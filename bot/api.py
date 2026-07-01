"""
FastAPI REST + WebSocket server for the Discord music bot dashboard.
Runs in the same asyncio event loop as the Discord bot via main.py.
"""
import asyncio
import math
import uuid
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import state

# Imported lazily inside endpoints to avoid circular import at module load time.
# bot.client is available once main.py has executed `import bot`.
def _vc():
    """Return the active guild's VoiceClient, or None."""
    import bot as _bot
    gid = state.active_guild_id
    if gid is None:
        return None
    guild = _bot.client.get_guild(gid)
    return guild.voice_client if guild else None

app = FastAPI(title="Discord Music Bot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── WebSocket connection manager ───────────────────────────────────────────────
class _ConnectionManager:
    def __init__(self):
        self._clients: list[WebSocket] = []

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._clients.append(ws)

    def disconnect(self, ws: WebSocket) -> None:
        try:
            self._clients.remove(ws)
        except ValueError:
            pass

    async def broadcast(self, data: dict) -> None:
        dead: list[WebSocket] = []
        for ws in list(self._clients):
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


_manager = _ConnectionManager()


async def _log_broadcaster() -> None:
    """Background task: drain state.log_queue → broadcast to all WS clients."""
    while True:
        entry = await state.log_queue.get()
        await _manager.broadcast(entry)


@app.on_event("startup")
async def _startup() -> None:
    asyncio.create_task(_log_broadcaster())


# ── Helpers ────────────────────────────────────────────────────────────────────
def _uptime_str() -> str:
    delta = datetime.utcnow() - state.bot_start_time
    total = int(delta.total_seconds())
    d, rem = divmod(total, 86400)
    h, rem = divmod(rem, 3600)
    m, _ = divmod(rem, 60)
    if d:
        return f"{d}d {h}h {m}m"
    if h:
        return f"{h}h {m}m"
    return f"{m}m"


def _active_queue() -> list:
    gid = state.active_guild_id
    if gid is not None:
        return state.music_queues[gid]
    # Fallback: first non-empty queue
    for q in state.music_queues.values():
        if q:
            return q
    return []


def _elapsed(track: dict) -> int:
    try:
        started = datetime.fromisoformat(track["started_at"])
        return int((datetime.utcnow() - started).total_seconds())
    except Exception:
        return track.get("elapsed", 0)


# ── REST endpoints ─────────────────────────────────────────────────────────────
@app.get("/bot/status")
async def get_status():
    q = _active_queue()
    connected_guilds = sum(1 for q2 in state.music_queues.values() if q2)
    voice_channels = connected_guilds or (1 if state.current_track else 0)
    return {
        "online": True,
        "guilds": state.bot_guilds,
        "voiceChannels": voice_channels,
        "uptime": _uptime_str(),
        "queueSize": len(q),
    }


@app.get("/bot/current-track")
async def get_current_track():
    track = state.current_track
    if not track:
        return JSONResponse(content=None)
    duration = track["duration"] or 1
    elapsed = min(_elapsed(track), duration)
    return {
        "id": track["id"],
        "title": track["title"],
        "url": track["url"],
        "duration": duration,
        "elapsed": elapsed,
        "isPlaying": track["is_playing"],
    }


class PlayRequest(BaseModel):
    url: str


@app.post("/bot/play")
async def post_play(body: PlayRequest):
    """Queue a URL from the dashboard and start playback if idle."""
    gid = state.active_guild_id
    if gid is None:
        raise HTTPException(
            status_code=400,
            detail="Bot is not connected to any guild. Use /join in Discord first.",
        )
    vc = _vc()
    if vc is None:
        raise HTTPException(
            status_code=400,
            detail="Bot is not in a voice channel. Use /join in Discord first.",
        )
    entry = {
        "id": str(uuid.uuid4()),
        "url": body.url,
        "title": "Queued via dashboard",
        "duration": 0,
    }
    state.music_queues[gid].append(entry)

    # If nothing is playing, trigger playback as a background task so the
    # API endpoint returns immediately (yt-dlp extraction can take 30s+).
    if not vc.is_playing() and not vc.is_paused():
        import bot as _bot
        asyncio.create_task(_bot._play_next(gid, None))

    return {"queued": True}


@app.post("/bot/pause")
async def post_pause():
    vc = _vc()
    if vc and vc.is_playing():
        vc.pause()
    if state.current_track:
        state.current_track["is_playing"] = False
    return {"ok": True}


@app.post("/bot/resume")
async def post_resume():
    vc = _vc()
    if vc and vc.is_paused():
        vc.resume()
    if state.current_track:
        state.current_track["is_playing"] = True
    return {"ok": True}


@app.post("/bot/skip")
async def post_skip():
    vc = _vc()
    if vc and (vc.is_playing() or vc.is_paused()):
        vc.stop()  # triggers after-callback → _play_next
    return {"ok": True}


@app.post("/bot/stop")
async def post_stop():
    vc = _vc()
    if vc and (vc.is_playing() or vc.is_paused()):
        vc.stop()
    state.current_track = None
    gid = state.active_guild_id
    if gid is not None:
        state.music_queues[gid].clear()
    return {"ok": True}


@app.get("/bot/queue")
async def get_queue():
    q = _active_queue()
    return [{"position": i + 1, "track": item} for i, item in enumerate(q)]


@app.delete("/bot/queue/{track_id}")
async def delete_queue_item(track_id: str):
    gid = state.active_guild_id
    if gid is None:
        raise HTTPException(status_code=400, detail="No active guild.")
    before = len(state.music_queues[gid])
    state.music_queues[gid] = [
        t for t in state.music_queues[gid] if t["id"] != track_id
    ]
    if len(state.music_queues[gid]) == before:
        raise HTTPException(status_code=404, detail="Track not found.")
    return {"ok": True}


@app.get("/bot/history")
async def get_history(page: int = 1, per_page: int = 10):
    total = len(state.history)
    start = (page - 1) * per_page
    items = state.history[start: start + per_page]
    return {
        "items": items,
        "total": total,
        "page": page,
        "totalPages": math.ceil(total / per_page) if total else 1,
    }


@app.get("/bot/guilds")
async def get_guilds():
    return state.guilds


class ActiveGuildRequest(BaseModel):
    guild_id: str


@app.post("/bot/guilds/active")
async def set_active_guild(body: ActiveGuildRequest):
    gid = int(body.guild_id)
    if not any(int(g["id"]) == gid for g in state.guilds):
        raise HTTPException(status_code=404, detail="Guild not found.")
    state.active_guild_id = gid
    return {"ok": True}


@app.get("/bot/stats")
async def get_stats():
    top = sorted(
        state.stats["top_tracks"].items(), key=lambda x: x[1], reverse=True
    )[:10]
    top_tracks = [{"title": t, "plays": c} for t, c in top]

    today = datetime.utcnow().date()
    daily_plays = []
    for i in range(29, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        daily_plays.append({"date": d, "count": state.stats["daily_plays"].get(d, 0)})

    dow_map = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    dow_counts: dict[int, int] = {i: 0 for i in range(7)}
    for entry in daily_plays:
        try:
            dt = datetime.fromisoformat(entry["date"])
            dow_counts[dt.weekday()] += entry["count"] * 3
        except Exception:
            pass
    weekly = [{"day": dow_map[i], "minutes": dow_counts[i]} for i in range(7)]

    return {
        "topTracks": top_tracks,
        "dailyPlays": daily_plays,
        "totalListeningTime": state.stats["total_seconds"] // 60,
        "weeklyActivity": weekly,
    }


# ── WebSocket ──────────────────────────────────────────────────────────────────
@app.websocket("/ws/logs")
async def websocket_logs(ws: WebSocket):
    await _manager.connect(ws)
    try:
        while True:
            # Keep connection alive; client sends periodic pings
            await ws.receive_text()
    except WebSocketDisconnect:
        _manager.disconnect(ws)
