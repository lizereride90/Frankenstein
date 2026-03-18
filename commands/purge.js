import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('purge')
  .setDescription('Bulk delete messages')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addIntegerOption((opt) =>
    opt
      .setName('count')
      .setDescription('Number of recent messages to delete (1-100)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100),
  );

export async function execute(interaction) {
  const count = interaction.options.getInteger('count', true);
  const deleted = await interaction.channel.bulkDelete(count, true);
  await interaction.reply({ content: `Deleted ${deleted.size} messages.`, ephemeral: true });
}

export const name = 'purge';
export const executeMessage = async (message, args) => {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;
  const count = Math.min(Math.max(parseInt(args[0], 10) || 0, 1), 100);
  const deleted = await message.channel.bulkDelete(count, true);
  const reply = await message.channel.send(`Deleted ${deleted.size} messages.`);
  setTimeout(() => reply.delete().catch(() => {}), 5000);
};
