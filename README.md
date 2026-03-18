# Frankenstein (JS)

All‑in‑one Discord bot scaffold built with **discord.js v14**. Zero commands are shipped; drop your own modules into `commands/` and they will auto‑load and sync.

## Features
- JavaScript (ESM), Node 18+.
- Auto command handler scans `commands/*.js` for slash and prefix handlers.
- JSON config (`config/defaults.json` + optional `config/local.json`) with `.env` overrides.
- Slash commands auto‑synced (guild‑first if `DISCORD_GUILD_ID` is set).
- No economy code included—plug in only what you want.

## Quick start
```bash
npm install
cp .env.example .env   # fill in DISCORD_TOKEN and DISCORD_CLIENT_ID
npm start
```

## Environment
- `DISCORD_TOKEN` (required)
- `DISCORD_CLIENT_ID` (required)
- `DISCORD_GUILD_ID` (optional; dev guild for faster slash sync)
- `COMMAND_PREFIX` (default `!`)
- `STATUS_MESSAGE` (presence text)
- `LOG_LEVEL` (pino level, default `INFO`)

## Adding commands
Create a file under `commands/` that exports at least `data` (SlashCommandBuilder) and `execute(interaction)`:
```js
// commands/ping.js
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with pong.');

export async function execute(interaction) {
  await interaction.reply('pong');
}
```
For prefix/legacy commands, add `executeMessage(message, args)` and optional `aliases`.

## Project layout
```
src/
  index.js            # entrypoint
  core/               # client, loader, logger
  config/             # config loader
commands/             # put command modules here
config/defaults.json  # base settings
data/                 # persistent storage (left empty)
.env.example          # template env vars
```

## Notes
- Enable the Message Content intent in your Discord bot settings if you use prefix commands.
- Slash commands are registered to the dev guild when `DISCORD_GUILD_ID` is set; remove it to sync globally (slower).
