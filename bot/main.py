"""
Entry point — runs the Discord bot and the FastAPI/uvicorn server
in the same asyncio event loop so they share state directly.

Usage:
    python main.py
"""
import asyncio
import logging
import os
import sys
import uuid

import uvicorn
from dotenv import load_dotenv

# Load .env based on environment (DEVELOPMENT or PRODUCTION)
# Defaults to .env.development if ENVIRONMENT is not set
env = os.getenv("ENVIRONMENT", "development").lower()
env_file = os.path.join(os.path.dirname(__file__), f".env.{env}")

# Try the environment-specific file first, then fall back to .env
if os.path.isfile(env_file):
    load_dotenv(env_file)
else:
    # Fall back to .env for backward compatibility
    fallback = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.isfile(fallback):
        load_dotenv(fallback)
    else:
        print(f"⚠️  Warning: Neither {env_file} nor .env found!")

logger_name = logging.getLogger(__name__)
logger_name.debug(f"Loaded configuration from {env_file if os.path.isfile(env_file) else 'fallback .env'}")

# Custom logging handler that pushes records into state.log_queue
import state  # noqa: E402


class _AsyncQueueHandler(logging.Handler):
    """Forwards log records to the shared asyncio queue for WebSocket broadcast."""

    _LEVEL_MAP = {
        logging.DEBUG: "info",
        logging.INFO: "info",
        logging.WARNING: "warning",
        logging.ERROR: "error",
        logging.CRITICAL: "error",
    }

    def emit(self, record: logging.LogRecord) -> None:
        entry = {
            "id": str(uuid.uuid4()),
            "level": self._LEVEL_MAP.get(record.levelno, "info"),
            "message": self.format(record),
            "timestamp": record.created,  # Unix timestamp; frontend formats it
        }
        try:
            state.log_queue.put_nowait(entry)
        except Exception:
            pass  # drop if full


def _setup_logging() -> None:
    fmt = logging.Formatter("%(name)s: %(message)s")
    root = logging.getLogger()
    root.setLevel(logging.INFO)

    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(fmt)
    root.addHandler(stream_handler)

    queue_handler = _AsyncQueueHandler()
    queue_handler.setFormatter(fmt)
    root.addHandler(queue_handler)


async def main() -> None:
    _setup_logging()

    token = os.getenv("DISCORD_TOKEN", "").strip()
    if not token:
        raise RuntimeError(
            "DISCORD_TOKEN is not set. "
            "Create bot/.env with DISCORD_TOKEN=your_token_here"
        )

    import bot  # registers all slash commands as a side-effect
    from api import app

    # Suppress the spurious WinError 10054 (ConnectionResetError) that Windows'
    # ProactorEventLoop raises when a browser closes an HTTP keep-alive connection.
    # This is a known asyncio/uvicorn issue on Windows and is harmless.
    def _exception_handler(loop: asyncio.AbstractEventLoop, context: dict) -> None:
        exc = context.get("exception")
        if isinstance(exc, ConnectionResetError):
            return  # silently ignore
        loop.default_exception_handler(context)

    asyncio.get_event_loop().set_exception_handler(_exception_handler)

    config = uvicorn.Config(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        # Disable uvicorn's own signal handlers so discord.py can manage the loop
        loop="none",
    )
    server = uvicorn.Server(config)

    await asyncio.gather(
        bot.client.start(token),
        server.serve(),
    )


if __name__ == "__main__":
    asyncio.run(main())
