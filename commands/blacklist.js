import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('blacklistword')
  .setDescription('Manage blacklisted words')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addSubcommand((sub) =>
    sub
      .setName('add')
      .setDescription('Add a word')
      .addStringOption((opt) => opt.setName('word').setDescription('Word to block').setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName('remove')
      .setDescription('Remove a word')
      .addStringOption((opt) => opt.setName('word').setDescription('Word to remove').setRequired(true)),
  )
  .addSubcommand((sub) => sub.setName('list').setDescription('List blacklisted words'));

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const client = interaction.client;
  if (sub === 'list') {
    const list = client.settings.blacklist;
    return interaction.reply({ content: list.length ? list.join(', ') : 'No words blacklisted.', ephemeral: true });
  }
  const word = interaction.options.getString('word', true).toLowerCase();
  const blacklist = new Set(client.settings.blacklist);
  if (sub === 'add') {
    blacklist.add(word);
    client.updateSettings({ blacklist: [...blacklist] });
    return interaction.reply({ content: `Added **${word}** to blacklist.`, ephemeral: true });
  }
  blacklist.delete(word);
  client.updateSettings({ blacklist: [...blacklist] });
  return interaction.reply({ content: `Removed **${word}** from blacklist.`, ephemeral: true });
}

export const name = 'blacklistword';
export const aliases = ['blword'];
export const executeMessage = async (message, args) => {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;
  const sub = (args[0] || '').toLowerCase();
  const word = (args[1] || '').toLowerCase();
  const client = message.client;
  const blacklist = new Set(client.settings.blacklist);
  if (sub === 'list') {
    return message.reply(blacklist.size ? `Blacklisted: ${[...blacklist].join(', ')}` : 'No words blacklisted.');
  }
  if (!word) return message.reply('Provide a word. Usage: !blacklistword add <word> | remove <word> | list');
  if (sub === 'add') {
    blacklist.add(word);
    client.updateSettings({ blacklist: [...blacklist] });
    return message.reply(`Added **${word}**.`);
  }
  if (sub === 'remove') {
    blacklist.delete(word);
    client.updateSettings({ blacklist: [...blacklist] });
    return message.reply(`Removed **${word}**.`);
  }
  return message.reply('Usage: !blacklistword add <word> | remove <word> | list');
};
