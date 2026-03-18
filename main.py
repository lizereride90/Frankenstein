from __future__ import annotations

import os
import sys

from dotenv import load_dotenv

from frankenstein.bot import FrankensteinBot
from frankenstein.config import load_config
from frankenstein.logger import setup_logging


def main() -> None:
    config = load_config()
    logger = setup_logging(config.log_level)
    load_dotenv()

    token = os.getenv("DISCORD_TOKEN")
    if not token:
        logger.error("DISCORD_TOKEN missing. Add it to .env or your environment.")
        sys.exit(1)

    bot = FrankensteinBot(config)
    bot.run_with_token(token)


if __name__ == "__main__":
    main()
