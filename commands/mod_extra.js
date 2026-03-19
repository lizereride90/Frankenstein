import { PermissionFlagsBits, SlashCommandBuilder, time } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('mod')
  .setDescription('Extra moderation tools')
  .addSubcommand((sub) =>
    sub
      .setName('timeout')
      .setDescription('Timeout a member')
      .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
      .addIntegerOption((o) => o.setName('minutes').setDescription('Duration in minutes').setRequired(true).setMinValue(1).setMaxValue(10080))
      .addStringOption((o) => o.setName('reason').setDescription('Reason')),
  )
  .addSubcommand((sub) =>
    sub
      .setName('untimeout')
      .setDescription('Remove timeout from a member')
      .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName('softban')
      .setDescription('Ban then unban to clear messages')
      .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
      .addStringOption((o) => o.setName('reason').setDescription('Reason')),
  )
  .addSubcommand((sub) =>
    sub
      .setName('cleanbots')
      .setDescription('Delete recent bot messages')
      .addIntegerOption((o) => o.setName('count').setDescription('Messages to scan (1-100)').setMinValue(1).setMaxValue(100)),
  )
  .setDefaultMemberPermissions(null);

export async function execute(interaction) {
  if (!interaction.guild) return interaction.reply({ content: 'Guild only.', ephemeral: true });
  const sub = interaction.options.getSubcommand();

  if (sub === 'timeout') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: 'Need Moderate Members permission.', ephemeral: true });
    }
    const member = interaction.options.getMember('user');
    const minutes = interaction.options.getInteger('minutes', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';
    if (!member) return interaction.reply({ content: 'Member not found.', ephemeral: true });
    const until = Date.now() + minutes * 60_000;
    await member.timeout(until, reason).catch(() => {});
    return interaction.reply(`Timed out ${member.user.tag} until ${time(new Date(until), 'R')}.`);
  }

  if (sub === 'untimeout') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: 'Need Moderate Members permission.', ephemeral: true });
    }
    const member = interaction.options.getMember('user');
    if (!member) return interaction.reply({ content: 'Member not found.', ephemeral: true });
    await member.timeout(null, 'Timeout cleared').catch(() => {});
    return interaction.reply(`Timeout cleared for ${member.user.tag}.`);
  }

  if (sub === 'softban') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: 'Need Ban Members permission.', ephemeral: true });
    }
    const member = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    if (!member) return interaction.reply({ content: 'Member not found.', ephemeral: true });
    await member.ban({ deleteMessageDays: 1, reason }).catch(() => {});
    await interaction.guild.members.unban(member.id, 'Softban revert').catch(() => {});
    return interaction.reply(`Softbanned ${member.user.tag}.`);
  }

  if (sub === 'cleanbots') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: 'Need Manage Messages permission.', ephemeral: true });
    }
    const limit = interaction.options.getInteger('count') || 50;
    const messages = await interaction.channel.messages.fetch({ limit }).catch(() => null);
    if (!messages) return interaction.reply({ content: 'Could not fetch messages.', ephemeral: true });
    const bots = messages.filter((m) => m.author.bot).first(100);
    await interaction.channel.bulkDelete(bots, true);
    return interaction.reply({ content: `Deleted ${bots.length} bot messages.`, ephemeral: true });
  }
 }
