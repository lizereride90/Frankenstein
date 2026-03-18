import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Collection, SlashCommandBuilder } from 'discord.js';

/**
 * Loads command modules from a directory.
 * Each module should export:
 *  - data: SlashCommandBuilder instance (for app commands)
 *  - execute: async (interaction) => void
 * Optional for prefix commands:
 *  - name / aliases / executeMessage(message, args)
 */
export const loadCommands = async (commandsPath, logger) => {
  const slashCommands = [];
  const messageCommands = new Collection();

  const entries = await fs.readdir(commandsPath).catch(() => []);
  for (const file of entries) {
    if (!file.endsWith('.js')) continue;
    const fullPath = path.join(commandsPath, file);
    try {
      const mod = await import(pathToFileURL(fullPath).href);
      if (mod.data instanceof SlashCommandBuilder && typeof mod.execute === 'function') {
        slashCommands.push(mod);
      }
      const name = mod.name || mod.data?.name;
      if (name && typeof mod.executeMessage === 'function') {
        messageCommands.set(name, mod);
        for (const alias of mod.aliases || []) {
          messageCommands.set(alias, mod);
        }
      }
      logger?.info({ file }, 'Loaded command module');
    } catch (err) {
      logger?.error({ err, file }, 'Failed to load command module');
    }
  }

  return { slashCommands, messageCommands };
};
