import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Kick a member')
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
  .addUserOption((opt) => opt.setName('target').setDescription('Member to kick').setRequired(true))
  .addStringOption((opt) => opt.setName('reason').setDescription('Reason'));

export async function execute(interaction) {
  const target = interaction.options.getMember('target');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  if (!target) return interaction.reply({ content: 'User not found.', ephemeral: true });
  await target.kick(reason);
  await interaction.reply({ content: `Kicked ${target.user.tag}.`, ephemeral: true });
}

export const name = 'kick';
export const executeMessage = async (message, args) => {
  if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) return;
  const target = message.mentions.members.first();
  if (!target) return message.reply('Mention a user to kick.');
  const reason = args.slice(1).join(' ') || 'No reason provided';
  await target.kick(reason);
  await message.reply(`Kicked ${target.user.tag}.`);
};
