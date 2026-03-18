import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Collection, SlashCommandBuilder, ContextMenuCommandBuilder } from 'discord.js';

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
      const candidateList = Array.isArray(mod.commands) ? mod.commands : [mod];
      for (const candidate of candidateList) {
        if (
          (candidate.data instanceof SlashCommandBuilder ||
            candidate.data instanceof ContextMenuCommandBuilder) &&
          typeof candidate.execute === 'function'
        ) {
          slashCommands.push(candidate);
        }

        const name = candidate.name || candidate.data?.name;
        if (name && typeof candidate.executeMessage === 'function') {
          messageCommands.set(name, candidate);
          for (const alias of candidate.aliases || []) {
            messageCommands.set(alias, candidate);
          }
        }
      }
      logger?.info({ file, count: candidateList.length }, 'Loaded command module');
    } catch (err) {
      logger?.error({ err, file }, 'Failed to load command module');
    }
  }

  return { slashCommands, messageCommands };
};
