import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

const makeName = (user) => `ticket-${user.username.toLowerCase().slice(0, 12)}-${Math.floor(Math.random() * 9999)
  .toString()
  .padStart(4, '0')}`;

const buildChannelPermissions = (guild, openerId, staffRoleId) => {
  const everyone = guild.roles.everyone.id;
  const overwrites = [
    {
      id: everyone,
      deny: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
    {
      id: openerId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      id: guild.members.me.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ManageChannels,
      ],
    },
  ];

  if (staffRoleId && guild.roles.cache.has(staffRoleId)) {
    overwrites.push({
      id: staffRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
      ],
    });
  }
  return overwrites;
};

export const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('Ticket system')
  .addSubcommand((sub) =>
    sub.setName('open').setDescription('Open a ticket').addStringOption((o) => o.setName('reason').setDescription('Why?')),
  )
  .addSubcommand((sub) => sub.setName('close').setDescription('Close this ticket channel'))
  .addSubcommand((sub) =>
    sub
      .setName('setstaffrole')
      .setDescription('Set staff role for tickets')
      .addRoleOption((o) => o.setName('role').setDescription('Staff role').setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName('setcategory')
      .setDescription('Set category for new tickets')
      .addChannelOption((o) =>
        o
          .setName('category')
          .setDescription('Category to create tickets in')
          .addChannelTypes(ChannelType.GuildCategory)
          .setRequired(true),
      ),
  )
  .addSubcommand((sub) => sub.setName('info').setDescription('Show ticket settings'))
  .setDefaultMemberPermissions(null);

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const client = interaction.client;
  const settings = client.settings;

  if (!interaction.guild) {
    return interaction.reply({ content: 'Tickets are guild-only.', ephemeral: true });
  }

  if (sub === 'open') {
    const reason = interaction.options.getString('reason') || 'No reason provided';
    try {
      const channel = await interaction.guild.channels.create({
        name: makeName(interaction.user),
        type: ChannelType.GuildText,
        parent: settings.ticketCategoryId ?? undefined,
        permissionOverwrites: buildChannelPermissions(
          interaction.guild,
          interaction.user.id,
          settings.ticketStaffRoleId,
        ),
        reason: `Ticket opened by ${interaction.user.tag}: ${reason}`,
      });
      await channel.send(
        [
          `Ticket opened by ${interaction.user} (${interaction.user.tag})`,
          `Reason: ${reason}`,
          settings.ticketStaffRoleId ? `<@&${settings.ticketStaffRoleId}>` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      );
      return interaction.reply({ content: `Ticket created: ${channel}`, ephemeral: true });
    } catch (err) {
      client.log.error({ err }, 'Failed to open ticket');
      return interaction.reply({ content: 'Failed to create ticket (check my permissions).', ephemeral: true });
    }
  }

  if (sub === 'close') {
    const channel = interaction.channel;
    if (!channel || channel.type !== ChannelType.GuildText || !channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: 'Use this inside a ticket channel.', ephemeral: true });
    }
    await interaction.reply({ content: 'Closing ticket...', ephemeral: true });
    setTimeout(() => channel.delete('Ticket closed').catch(() => {}), 500);
    return;
  }

  if (sub === 'setstaffrole') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'Manage Server required.', ephemeral: true });
    }
    const role = interaction.options.getRole('role', true);
    client.updateSettings({ ticketStaffRoleId: role.id });
    return interaction.reply({ content: `Ticket staff role set to ${role}.`, ephemeral: true });
  }

  if (sub === 'setcategory') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'Manage Server required.', ephemeral: true });
    }
    const category = interaction.options.getChannel('category', true);
    client.updateSettings({ ticketCategoryId: category.id });
    return interaction.reply({ content: `Ticket category set to ${category.name}.`, ephemeral: true });
  }

  if (sub === 'info') {
    const role = settings.ticketStaffRoleId ? `<@&${settings.ticketStaffRoleId}>` : 'Not set';
    const category = settings.ticketCategoryId ? `<#${settings.ticketCategoryId}>` : 'Not set';
    return interaction.reply({ content: `Staff role: ${role}\nCategory: ${category}`, ephemeral: true });
  }
}
