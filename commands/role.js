import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('role')
  .setDescription('Add or remove a role from a user')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addSubcommand((sub) =>
    sub
      .setName('add')
      .setDescription('Add a role')
      .addUserOption((opt) => opt.setName('user').setDescription('Target user').setRequired(true))
      .addRoleOption((opt) => opt.setName('role').setDescription('Role to add').setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName('remove')
      .setDescription('Remove a role')
      .addUserOption((opt) => opt.setName('user').setDescription('Target user').setRequired(true))
      .addRoleOption((opt) => opt.setName('role').setDescription('Role to remove').setRequired(true)),
  );

export async function execute(interaction) {
  const user = interaction.options.getMember('user');
  const role = interaction.options.getRole('role');
  const sub = interaction.options.getSubcommand();
  if (!user || !role) return interaction.reply({ content: 'User or role missing.', ephemeral: true });
  if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({ content: 'I lack Manage Roles permission.', ephemeral: true });
  }
  if (sub === 'add') {
    await user.roles.add(role, `Requested by ${interaction.user.tag}`);
    await interaction.reply({ content: `Added ${role.name} to ${user.user.tag}.`, ephemeral: true });
  } else {
    await user.roles.remove(role, `Requested by ${interaction.user.tag}`);
    await interaction.reply({ content: `Removed ${role.name} from ${user.user.tag}.`, ephemeral: true });
  }
}

export const name = 'role';
export const executeMessage = async (message, args) => {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) return;
  const action = (args[0] || '').toLowerCase();
  const user = message.mentions.members.first();
  const role = message.mentions.roles.first();
  if (!['add', 'remove'].includes(action) || !user || !role) {
    return message.reply('Usage: !role add @user @role | !role remove @user @role');
  }
  if (action === 'add') {
    await user.roles.add(role, `Requested by ${message.author.tag}`);
    await message.reply(`Added ${role.name} to ${user.user.tag}.`);
  } else {
    await user.roles.remove(role, `Requested by ${message.author.tag}`);
    await message.reply(`Removed ${role.name} from ${user.user.tag}.`);
  }
};
