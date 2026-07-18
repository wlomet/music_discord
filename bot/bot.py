"""
Discord music bot — adapted from d:/Projet/bot_discord_yt/exe.py.
Do NOT modify the original file; this is the version integrated into
the discord-music-bot-da-main project.

Run via main.py (not directly).
"""
import asyncio
import logging
import os
import uuid
from datetime import datetime

import discord
from discord import app_commands
import yt_dlp

import state

logger = logging.getLogger(__name__)

# ── yt-dlp options ─────────────────────────────────────────────────────────────
_YTDL_OPTIONS: dict = {
    "format": "bestaudio/best",
    "noplaylist": False,
    "quiet": True,
    "extractflat": False,
    "socket_timeout": 30,
    "retries": 3,
    "extractor_args": {
        "youtube": {"player_client": ["android", "web"]}
    },
    "user_agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    ),
}

# Add cookies file only if it exists next to this script
_COOKIES = os.path.join(os.path.dirname(__file__), "cookies.txt")
if os.path.isfile(_COOKIES):
    _YTDL_OPTIONS["cookies"] = _COOKIES

_FFMPEG_OPTIONS: dict = {
    "before_options": "-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5",
    "options": '-vn -filter:a "volume=0.5"',
}


# ── YTDLSource ─────────────────────────────────────────────────────────────────
class YTDLSource(discord.PCMVolumeTransformer):
    def __init__(self, source, *, data: dict, volume: float = 0.5):
        super().__init__(source, volume)
        self.data = data
        self.title: str = data.get("title", "Unknown")
        self.url: str = data.get("webpage_url") or data.get("url", "")
        self.duration: int = data.get("duration") or 0

    @classmethod
    async def from_url(
        cls, url: str, *, loop=None, stream: bool = True
    ) -> "YTDLSource | None":
        ytdl = yt_dlp.YoutubeDL(_YTDL_OPTIONS)
        loop = loop or asyncio.get_event_loop()
        try:
            data = await loop.run_in_executor(
                None, lambda: ytdl.extract_info(url, download=not stream)
            )
            if "entries" in data:
                data = data["entries"][0]
            filename = data["url"] if stream else ytdl.prepare_filename(data)
            source = discord.FFmpegPCMAudio(filename, **_FFMPEG_OPTIONS)
            return cls(source, data=data)
        except Exception as exc:
            logger.error("Extraction error: %s", exc)
            return None

    @classmethod
    async def get_playlist_entries(cls, url: str, *, loop=None) -> list[dict]:
        opts = {**_YTDL_OPTIONS, "extract_flat": True, "noplaylist": False}
        ytdl = yt_dlp.YoutubeDL(opts)
        loop = loop or asyncio.get_event_loop()
        try:
            data = await loop.run_in_executor(
                None, lambda: ytdl.extract_info(url, download=False)
            )
            if "entries" in data:
                return [
                    {
                        "id": str(uuid.uuid4()),
                        "url": (
                            e.get("url")
                            or f"https://www.youtube.com/watch?v={e['id']}"
                        ),
                        "title": e.get("title", "Unknown"),
                        "duration": e.get("duration") or 0,
                    }
                    for e in data["entries"]
                    if e
                ]
            return [
                {
                    "id": str(uuid.uuid4()),
                    "url": url,
                    "title": data.get("title", "Unknown"),
                    "duration": data.get("duration") or 0,
                }
            ]
        except Exception as exc:
            logger.error("Playlist extraction error: %s", exc)
            return []


# ── Internal helpers ───────────────────────────────────────────────────────────
def _record_play(entry: dict, guild_id: int) -> None:
    """Update shared history and stats when a track starts."""
    state.history.insert(
        0,
        {
            "track": {
                "id": entry["id"],
                "title": entry["title"],
                "url": entry["url"],
                "duration": entry["duration"],
            },
            "playedAt": datetime.utcnow().isoformat(),
            "guildId": str(guild_id),
        },
    )
    state.history = state.history[:500]

    # Stats
    title = entry["title"]
    state.stats["top_tracks"][title] = (
        state.stats["top_tracks"].get(title, 0) + 1
    )
    today = datetime.utcnow().strftime("%Y-%m-%d")
    state.stats["daily_plays"][today] = (
        state.stats["daily_plays"].get(today, 0) + 1
    )


async def _play_next(guild_id: int, text_channel) -> None:
    """Pop the next entry from the guild queue and start playback."""
    if not state.music_queues[guild_id]:
        state.current_track = None
        logger.info("Queue empty — playback finished for guild %s", guild_id)
        return

    guild = client.get_guild(guild_id)
    if not guild or not guild.voice_client:
        return

    vc = guild.voice_client
    entry = state.music_queues[guild_id].pop(0)

    try:
        player = await YTDLSource.from_url(entry["url"], loop=asyncio.get_event_loop(), stream=True)
        if not player:
            logger.warning("Could not load track %s, skipping.", entry["title"])
            await _play_next(guild_id, text_channel)
            return

        started_at = datetime.utcnow()
        resolved_entry = {**entry, "title": player.title or entry["title"]}
        state.current_track = {
            "id": entry["id"],
            "title": resolved_entry["title"],
            "url": player.url or entry["url"],
            "duration": player.duration or entry["duration"],
            "elapsed": 0,
            "is_playing": True,
            "guild_id": guild_id,
            "started_at": started_at.isoformat(),
        }
        _record_play(resolved_entry, guild_id)
        logger.info("Now playing: %s", state.current_track["title"])

        def _after(error: Exception | None) -> None:
            if error:
                logger.error("Playback error: %s", error)
            elapsed = int((datetime.utcnow() - started_at).total_seconds())
            state.stats["total_seconds"] += min(elapsed, player.duration or elapsed)
            asyncio.run_coroutine_threadsafe(
                _play_next(guild_id, text_channel), client.loop
            )

        vc.play(player, after=_after)

        if text_channel:
            try:
                await text_channel.send(
                    f"🎶 Now playing: **{state.current_track['title']}**"
                )
            except Exception:
                pass

    except Exception as exc:
        logger.error("Play error: %s", exc)
        await _play_next(guild_id, text_channel)


# ── Discord client ─────────────────────────────────────────────────────────────
_intents = discord.Intents.default()
_intents.message_content = True
_intents.voice_states = True
_intents.guilds = True


class BotClient(discord.Client):
    def __init__(self):
        super().__init__(intents=_intents)
        self.tree = app_commands.CommandTree(self)

    async def on_ready(self):
        state.bot_start_time = datetime.utcnow()
        state.guilds = [
            {"id": str(g.id), "name": g.name, "memberCount": g.member_count}
            for g in self.guilds
        ]
        state.bot_guilds = len(state.guilds)
        # Auto-select the first guild so the dashboard has data without needing
        # the user to pick a server manually first.
        if state.active_guild_id is None and self.guilds:
            state.active_guild_id = self.guilds[0].id
        logger.info("Logged in as %s (ID: %s)", self.user, self.user.id)
        await self.tree.sync()
        logger.info("Slash commands synced.")

    async def on_guild_join(self, guild):
        state.guilds = [
            {"id": str(g.id), "name": g.name, "memberCount": g.member_count}
            for g in self.guilds
        ]
        state.bot_guilds = len(state.guilds)

    async def on_guild_remove(self, guild):
        state.guilds = [
            {"id": str(g.id), "name": g.name, "memberCount": g.member_count}
            for g in self.guilds
        ]
        state.bot_guilds = len(state.guilds)
        if state.active_guild_id == guild.id:
            state.active_guild_id = self.guilds[0].id if self.guilds else None


client = BotClient()


# ── Slash commands ─────────────────────────────────────────────────────────────
@client.tree.command(name="join", description="Join your voice channel.")
async def join(interaction: discord.Interaction):
    if not interaction.user.voice:
        await interaction.response.send_message(
            "You must be in a voice channel.", ephemeral=True
        )
        return
    channel = interaction.user.voice.channel
    if interaction.guild.voice_client:
        await interaction.response.send_message("Already connected.", ephemeral=True)
        return
    await interaction.response.defer()
    try:
        await channel.connect()
        state.active_guild_id = interaction.guild.id
        # Store the text channel where the command was issued for notifications
        state.text_channels[interaction.guild.id] = interaction.channel
        await interaction.followup.send(f"✅ Connected to **{channel.name}**")
    except Exception as exc:
        await interaction.followup.send(f"❌ Connection error: {exc}")


@client.tree.command(name="play", description="Play a YouTube video or playlist.")
@app_commands.describe(url="YouTube video or playlist URL")
async def play(interaction: discord.Interaction, url: str):
    guild_id = interaction.guild.id
    if not interaction.user.voice:
        await interaction.response.send_message(
            "You must be in a voice channel.", ephemeral=True
        )
        return
    await interaction.response.defer()

    vc = interaction.guild.voice_client
    if vc is None:
        try:
            await interaction.user.voice.channel.connect()
            vc = interaction.guild.voice_client
            state.active_guild_id = guild_id
        except Exception as exc:
            await interaction.followup.send(f"❌ Connection error: {exc}")
            return

    entries = await YTDLSource.get_playlist_entries(url, loop=asyncio.get_event_loop())
    if not entries:
        await interaction.followup.send("❌ Could not process this URL.")
        return

    if vc.is_playing() or vc.is_paused():
        state.music_queues[guild_id].extend(entries)
        msg = (
            f"🔁 Added to queue: **{entries[0]['title']}**"
            if len(entries) == 1
            else f"🔁 Added {len(entries)} tracks to queue."
        )
        await interaction.followup.send(msg)
    else:
        first = entries[0]
        state.music_queues[guild_id] = list(entries)
        await _play_next(guild_id, interaction.channel)
        # Message is already sent by _play_next to the channel


@client.tree.command(name="pause", description="Pause playback.")
async def pause(interaction: discord.Interaction):
    vc = interaction.guild.voice_client
    if vc and vc.is_playing():
        vc.pause()
        if state.current_track:
            state.current_track["is_playing"] = False
        await interaction.response.send_message("⏸️ Paused.")
    else:
        await interaction.response.send_message("Nothing is playing.", ephemeral=True)


@client.tree.command(name="resume", description="Resume playback.")
async def resume(interaction: discord.Interaction):
    vc = interaction.guild.voice_client
    if vc and vc.is_paused():
        vc.resume()
        if state.current_track:
            state.current_track["is_playing"] = True
        await interaction.response.send_message("▶️ Resumed.")
    else:
        await interaction.response.send_message("Nothing is paused.", ephemeral=True)


@client.tree.command(name="stop", description="Stop playback and clear the queue.")
async def stop(interaction: discord.Interaction):
    guild_id = interaction.guild.id
    vc = interaction.guild.voice_client
    if vc and (vc.is_playing() or vc.is_paused()):
        vc.stop()
        state.music_queues[guild_id].clear()
        state.current_track = None
        await interaction.response.send_message("⏹️ Stopped and queue cleared.")
    else:
        await interaction.response.send_message("Nothing is playing.", ephemeral=True)


@client.tree.command(name="leave", description="Disconnect from voice channel.")
async def leave(interaction: discord.Interaction):
    guild_id = interaction.guild.id
    if interaction.guild.voice_client:
        state.music_queues[guild_id].clear()
        state.current_track = None
        await interaction.guild.voice_client.disconnect()
        await interaction.response.send_message("👋 Disconnected.")
    else:
        await interaction.response.send_message(
            "Not in a voice channel.", ephemeral=True
        )


@client.tree.command(name="queue", description="Show the current queue.")
async def queue_cmd(interaction: discord.Interaction):
    guild_id = interaction.guild.id
    q = state.music_queues[guild_id]
    if not q:
        await interaction.response.send_message("📭 Queue is empty.")
        return
    display = q[:10]
    msg = "📜 **Queue:**\n" + "\n".join(
        f"{i + 1}. {item['title']}" for i, item in enumerate(display)
    )
    if len(q) > 10:
        msg += f"\n… and {len(q) - 10} more."
    msg += f"\n**Total: {len(q)} track(s)**"
    await interaction.response.send_message(msg)


@client.tree.command(name="clear", description="Clear the queue.")
async def clear_cmd(interaction: discord.Interaction):
    guild_id = interaction.guild.id
    count = len(state.music_queues[guild_id])
    state.music_queues[guild_id].clear()
    await interaction.response.send_message(f"🗑️ Cleared {count} track(s).")


@client.tree.command(name="next", description="Skip to the next track.")
async def next_song(interaction: discord.Interaction):
    vc = interaction.guild.voice_client
    if not vc or not vc.is_connected():
        await interaction.response.send_message("Not connected.", ephemeral=True)
        return
    if not vc.is_playing():
        await interaction.response.send_message("Nothing is playing.", ephemeral=True)
        return
    vc.stop()  # triggers the after callback → _play_next
    await interaction.response.send_message("⏭️ Skipping…")


@client.tree.command(name="nowplaying", description="Show the current track.")
async def nowplaying(interaction: discord.Interaction):
    track = state.current_track
    if track and track.get("is_playing"):
        await interaction.response.send_message(
            f"🎵 Now playing: **{track['title']}**"
        )
    elif track:
        await interaction.response.send_message(
            f"⏸️ Paused: **{track['title']}**"
        )
    else:
        await interaction.response.send_message(
            "Nothing is playing.", ephemeral=True
        )
