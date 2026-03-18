import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

const defaultConfigPath = path.join(rootDir, 'config', 'defaults.json');
const localConfigPath = path.join(rootDir, 'config', 'local.json');

const readJson = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`[config] Failed to read ${filePath}:`, err.message);
    }
    return {};
  }
};

export const loadConfig = () => {
  dotenv.config({ path: path.join(rootDir, '.env') });

  const defaults = readJson(defaultConfigPath);
  const overrides = readJson(localConfigPath);
  const merged = { ...defaults, ...overrides };

  // Environment overrides
  merged.prefix = process.env.COMMAND_PREFIX ?? merged.prefix ?? '!';
  merged.logLevel = process.env.LOG_LEVEL ?? merged.logLevel ?? 'INFO';
  const presence = merged.presence || {};
  merged.presence = {
    status: presence.status || 'online',
    activityType: presence.activityType || 'watching',
    activityText: process.env.STATUS_MESSAGE ?? presence.activityText ?? 'the lab monitors',
  };

  merged.commandSync = merged.commandSync || { syncOnStart: true, preferGuild: true };

  if (process.env.DISCORD_GUILD_ID) {
    merged.devGuildId = process.env.DISCORD_GUILD_ID;
  }

  merged.token = process.env.DISCORD_TOKEN || '';
  merged.clientId = process.env.DISCORD_CLIENT_ID || '';

  // Normalize arrays to strings
  merged.ownerIds = (merged.ownerIds || []).map(String);
  merged.guildAllowlist = (merged.guildAllowlist || []).map(String);

  merged.commandsPath = path.join(rootDir, merged.commandsPath || 'commands');
  merged.dataDir = path.join(rootDir, merged.dataDir || 'data');

  return merged;
};

export const paths = {
  root: rootDir,
  commands: (rel) => path.join(rootDir, rel || 'commands'),
  data: (rel) => path.join(rootDir, rel || 'data'),
};
