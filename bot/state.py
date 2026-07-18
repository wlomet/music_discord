"""
Shared mutable state between the Discord bot and the FastAPI server.
Both modules run in the same asyncio event loop, so no locks are needed.
"""
import asyncio
from collections import defaultdict
from datetime import datetime
from typing import Optional


# ── Bot metadata ───────────────────────────────────────────────────────────────
bot_start_time: datetime = datetime.utcnow()
bot_guilds: int = 0          # updated on on_ready / guild events
active_guild_id: Optional[int] = None  # guild whose queue the dashboard shows

# List of guilds the bot is in: [{id, name, memberCount}]
guilds: list = []

# Per-guild text channels for notifications — guild_id -> text_channel
text_channels: dict = {}


# ── Playback ───────────────────────────────────────────────────────────────────
# Keys: id, title, url, duration (int seconds), elapsed (int seconds),
#       is_playing (bool), guild_id (int), started_at (ISO str)
current_track: Optional[dict] = None

# Per-guild queues — list of {id, title, url, duration}
music_queues: defaultdict = defaultdict(list)

# Per-guild last activity timestamp — guild_id -> datetime (updated when music plays)
last_activity: dict = {}  # used for auto-disconnect when idle for 2+ minutes

# Background tasks tracking
inactivity_task_started: bool = False  # flag to ensure we only start the task once


# ── History (most recent first, capped at 500) ─────────────────────────────────
# Each entry: {track: {id, title, url, duration}, playedAt: ISO str, guildId: str}
history: list = []


# ── Stats ──────────────────────────────────────────────────────────────────────
stats: dict = {
    "top_tracks": {},    # title -> play count
    "daily_plays": {},   # "YYYY-MM-DD" -> count
    "total_seconds": 0,  # cumulative listening seconds
}


# ── Log queue (async) ──────────────────────────────────────────────────────────
# LogEntry dicts: {id, level, message, timestamp}
# Filled by the bot's logging handler, drained by the WebSocket broadcaster.
log_queue: asyncio.Queue = asyncio.Queue(maxsize=500)
