import { Client, Collection, GatewayIntentBits, Partials, REST, Routes } from 'discord.js';
import { loadCommands } from './commandLoader.js';

export class FrankensteinClient extends Client {
  constructor(config, logger) {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
      ],
      partials: [Partials.Channel, Partials.Message],
    });

    this.config = config;
    this.log = logger;
    this.messageCommands = new Collection();
    this.slashCommands = [];
  }

  async init() {
    const commandsDir = this.config.commandsPath;
    const { slashCommands, messageCommands } = await loadCommands(commandsDir, this.log);
    this.slashCommands = slashCommands;
    this.messageCommands = messageCommands;

    await this.registerSlashCommands();
    this.registerEventHandlers();
  }

  registerEventHandlers() {
    this.once('ready', () => {
      this.log.info(
        { user: this.user?.tag, id: this.user?.id, guilds: this.guilds.cache.size },
        'Bot ready',
      );
      this.setPresence();
    });

    this.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      const command = this.slashCommands.find((c) => c.data.name === interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        this.log.error({ err, command: interaction.commandName }, 'Slash command error');
        const reply = interaction.replied || interaction.deferred ? 'followUp' : 'reply';
        await interaction[reply]({ content: 'Something went wrong.', ephemeral: true });
      }
    });

    this.on('messageCreate', async (message) => {
      if (message.author.bot) return;
      if (!message.content.startsWith(this.config.prefix)) return;

      const args = message.content.slice(this.config.prefix.length).trim().split(/\s+/);
      const name = args.shift()?.toLowerCase();
      if (!name) return;
      const command = this.messageCommands.get(name);
      if (!command?.executeMessage) return;
      try {
        await command.executeMessage(message, args);
      } catch (err) {
        this.log.error({ err, command: name }, 'Message command error');
        await message.reply('Something went wrong running that command.');
      }
    });
  }

  async registerSlashCommands() {
    if (!this.slashCommands.length) {
      this.log.info('No slash commands to register.');
      return;
    }
    const rest = new REST({ version: '10' }).setToken(this.config.token);
    const body = this.slashCommands.map((c) => c.data.toJSON());

    try {
      if (this.config.commandSync?.preferGuild && this.config.devGuildId) {
        await rest.put(
          Routes.applicationGuildCommands(this.config.clientId, this.config.devGuildId),
          { body },
        );
        this.log.info(
          { count: body.length, guild: this.config.devGuildId },
          'Registered guild slash commands',
        );
      } else {
        await rest.put(Routes.applicationCommands(this.config.clientId), { body });
        this.log.info({ count: body.length }, 'Registered global slash commands');
      }
    } catch (err) {
      this.log.error({ err }, 'Failed to register slash commands');
    }
  }

  setPresence() {
    const presence = this.config.presence || {};
    const activityType = presence.activityType?.toLowerCase() ?? 'playing';
    const activityMap = {
      watching: 3,
      listening: 2,
      competing: 5,
      streaming: 1,
      playing: 0,
    };
    this.user?.setPresence({
      activities: [
        {
          name: presence.activityText || 'the lab',
          type: activityMap[activityType] ?? 0,
        },
      ],
      status: presence.status || 'online',
    });
  }
}
