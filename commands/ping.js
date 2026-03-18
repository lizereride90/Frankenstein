import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check latency');

export async function execute(interaction) {
  const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
  const latency = sent.createdTimestamp - interaction.createdTimestamp;
  await interaction.editReply(`Pong! ${latency}ms`);
}

export const executeMessage = async (message) => {
  const sent = await message.channel.send('Pinging...');
  const latency = sent.createdTimestamp - message.createdTimestamp;
  await sent.edit(`Pong! ${latency}ms`);
};

export const name = 'ping';
export const aliases = ['pong'];
