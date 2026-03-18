import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('autorole')
  .setDescription('Configure autorole for new members')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addSubcommand((sub) =>
    sub
      .setName('set')
      .setDescription('Set autorole')
      .addRoleOption((opt) => opt.setName('role').setDescription('Role to assign').setRequired(true)),
  )
  .addSubcommand((sub) => sub.setName('clear').setDescription('Disable autorole'))
  .addSubcommand((sub) => sub.setName('show').setDescription('Show current autorole'));

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const client = interaction.client;
  if (sub === 'set') {
    const role = interaction.options.getRole('role', true);
    client.updateSettings({ autoroleId: role.id });
    await interaction.reply({ content: `Autorole set to ${role.name}.`, ephemeral: true });
  } else if (sub === 'clear') {
    client.updateSettings({ autoroleId: null });
    await interaction.reply({ content: 'Autorole cleared.', ephemeral: true });
  } else {
    const id = client.settings.autoroleId;
    await interaction.reply({ content: id ? `Autorole: <@&${id}>` : 'Autorole not set.', ephemeral: true });
  }
}

export const name = 'autorole';
export const aliases = ['ar'];
export const executeMessage = async (message, args) => {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) return;
  const client = message.client;
  const sub = (args[0] || '').toLowerCase();
  if (sub === 'set') {
    const role = message.mentions.roles.first();
    if (!role) return message.reply('Mention a role to set as autorole.');
    client.updateSettings({ autoroleId: role.id });
    return message.reply(`Autorole set to ${role.name}.`);
  }
  if (sub === 'clear') {
    client.updateSettings({ autoroleId: null });
    return message.reply('Autorole cleared.');
  }
  const id = client.settings.autoroleId;
  return message.reply(id ? `Autorole: <@&${id}>` : 'Autorole not set.');
};
