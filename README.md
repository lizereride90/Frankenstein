# Frankenstein

A modular, JSON-driven Discord bot scaffold built with `discord.py` 2.x.

- Auto‑discovers cogs from the `commands/` package.
- Loads settings from `config/defaults.json` + optional `config/local.json` + environment variables.
- Uses a `.env` file for sensitive values (token, client IDs, etc.).
- Ready for both prefix commands and application commands (slash, context menus).
- No economy system included; add only the modules you want.

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env
# edit .env and set DISCORD_TOKEN, optionally DISCORD_GUILD_ID for fast command sync
python main.py
```

## Configuration

- `config/defaults.json`: base settings (prefix, presence, logging).
- `config/local.json`: optional overrides, ignored by Git. Create it to tweak per-environment settings.
- Environment variables (via `.env` or shell) override JSON values:
  - `DISCORD_TOKEN` (required)
  - `DISCORD_CLIENT_ID`
  - `DISCORD_GUILD_ID` (dev guild for faster slash-command sync)
  - `COMMAND_PREFIX`
  - `STATUS_MESSAGE`
  - `LOG_LEVEL`

## Adding commands

1. Create a file in `commands/`, e.g. `commands/moderation.py`.
2. Define a cog and expose an async `setup(bot)` function:

```python
from discord.ext import commands

class Moderation(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.command()
    async def ping(self, ctx: commands.Context):
        await ctx.send("Pong!")

async def setup(bot):
    await bot.add_cog(Moderation(bot))
```

3. Restart the bot. The loader will import every module in `commands/` automatically.

## Project layout

```
frankenstein-bot/
  main.py               # entry point
  requirements.txt
  config/defaults.json
  config/local.json     # optional, not tracked
  commands/             # add cogs here
  frankenstein/         # bot core
    bot.py
    config.py
    logger.py
    utils/paths.py
  data/                 # place persistent files/db here
```

## Notes
- The bot sets message content, members, and presence intents. Enable the Message Content intent in your bot settings if you plan to use prefix commands.
- By default, slash commands sync to the dev guild specified in `DISCORD_GUILD_ID`; remove that env var to sync globally (slower propagation).
