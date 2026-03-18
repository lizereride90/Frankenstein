import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show available commands');

export async function execute(interaction) {
  const lines = interaction.client.slashCommands.map((c) => `• /${c.data.name} — ${c.data.description}`);
  await interaction.reply({ content: lines.join('\n') || 'No commands loaded.', ephemeral: true });
}

export const name = 'help';
export const aliases = ['commands'];
export const executeMessage = async (message) => {
  const cmds = [...new Set(message.client.messageCommands.keys())];
  await message.reply(cmds.length ? `Commands: ${cmds.join(', ')}` : 'No commands loaded.');
};
