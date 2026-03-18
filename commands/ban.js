import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Ban a member')
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .addUserOption((opt) => opt.setName('target').setDescription('Member to ban').setRequired(true))
  .addStringOption((opt) => opt.setName('reason').setDescription('Reason'))
  .addIntegerOption((opt) =>
    opt
      .setName('delete_days')
      .setDescription('Delete message history (0-7 days)')
      .setMinValue(0)
      .setMaxValue(7),
  );

export async function execute(interaction) {
  const target = interaction.options.getMember('target');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const deleteDays = interaction.options.getInteger('delete_days') || 0;
  if (!target) return interaction.reply({ content: 'User not found.', ephemeral: true });
  await target.ban({ reason, deleteMessageDays: deleteDays });
  await interaction.reply({ content: `Banned ${target.user.tag}.`, ephemeral: true });
}

export const name = 'ban';
export const executeMessage = async (message, args) => {
  if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return;
  const target = message.mentions.members.first();
  if (!target) return message.reply('Mention a user to ban.');
  const reason = args.slice(1).join(' ') || 'No reason provided';
  await target.ban({ reason });
  await message.reply(`Banned ${target.user.tag}.`);
};
