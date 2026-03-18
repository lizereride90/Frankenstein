import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('welcome')
  .setDescription('Configure welcome messages')
  .addSubcommand((sub) =>
    sub
      .setName('set')
      .setDescription('Set welcome channel/message')
      .addChannelOption((o) =>
        o
          .setName('channel')
          .setDescription('Channel to send welcomes')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true),
      )
      .addStringOption((o) => o.setName('message').setDescription('Welcome message, supports {user} and {server}'))
      .addBooleanOption((o) => o.setName('mention').setDescription('Mention the new user')),
  )
  .addSubcommand((sub) => sub.setName('disable').setDescription('Disable welcome messages'))
  .addSubcommand((sub) => sub.setName('preview').setDescription('Preview the welcome message in this channel'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

const formatMessage = (template, member, mention) => {
  const base = template
    .replaceAll('{user}', mention ? member.toString() : member.user.tag)
    .replaceAll('{server}', member.guild.name);
  return mention ? base : base;
};

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const client = interaction.client;
  const settings = client.settings;

  if (!interaction.guild) {
    return interaction.reply({ content: 'Welcome messages are guild-only.', ephemeral: true });
  }

  if (sub === 'set') {
    const channel = interaction.options.getChannel('channel', true);
    const message =
      interaction.options.getString('message') ??
      settings.welcomeMessage ??
      'Welcome {user} to {server}! Enjoy your stay.';
    const mention = interaction.options.getBoolean('mention') ?? settings.welcomeMention ?? false;

    client.updateSettings({
      welcomeChannelId: channel.id,
      welcomeMessage: message,
      welcomeMention: mention,
    });

    return interaction.reply({
      content: `Welcome channel set to ${channel}.\nMessage: ${message}\nMention: ${mention ? 'yes' : 'no'}`,
      ephemeral: true,
    });
  }

  if (sub === 'disable') {
    client.updateSettings({
      welcomeChannelId: null,
      welcomeMessage: null,
      welcomeMention: false,
    });
    return interaction.reply({ content: 'Welcome messages disabled.', ephemeral: true });
  }

  if (sub === 'preview') {
    const channel = interaction.channel;
    if (!channel || channel.type !== ChannelType.GuildText) {
      return interaction.reply({ content: 'Run preview in a text channel.', ephemeral: true });
    }
    const template =
      settings.welcomeMessage ?? 'Welcome {user} to {server}! Enjoy your stay.';
    const content = formatMessage(template, interaction.member, settings.welcomeMention);
    await channel.send({ content });
    return interaction.reply({ content: 'Sent preview.', ephemeral: true });
  }
}
