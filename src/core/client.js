import {
  ChannelType,
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  PermissionFlagsBits,
  REST,
  Routes,
} from 'discord.js';
import { loadCommands } from './commandLoader.js';
import { ensureDataFiles, readSettings, writeSettings } from '../utils/storage.js';

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
    this.settings = {
      autoroleId: null,
      blacklist: [],
      ticketStaffRoleId: null,
      ticketCategoryId: null,
      welcomeChannelId: null,
      welcomeMessage: null,
      welcomeMention: false,
    };
  }

  async init() {
    ensureDataFiles(this.config.dataDir);
    this.settings = readSettings(this.config.dataDir);

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

      // Mention response
      if (message.mentions.has(this.user) && message.content.trim() === `<@${this.user.id}>`) {
        await message.reply('hi i am Frankenstein made by raizel');
        return;
      }

      // Blacklist filter
      if (this.settings.blacklist.length) {
        const lower = message.content.toLowerCase();
        const hit = this.settings.blacklist.find((w) => lower.includes(w));
        if (hit) {
          try {
            await message.delete();
            await message.channel.send({
              content: `${message.author}, that word is not allowed here.`,
              allowedMentions: { users: [message.author.id] },
            });
          } catch (err) {
            this.log.error({ err }, 'Failed to delete blacklisted message');
          }
          return;
        }
      }

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

    this.on('guildMemberAdd', async (member) => {
      // Autorole
      if (this.settings.autoroleId) {
        const role = member.guild.roles.cache.get(this.settings.autoroleId);
        if (role) {
          try {
            await member.roles.add(role, 'autorole enabled');
          } catch (err) {
            this.log.error({ err }, 'Failed to add autorole');
          }
        }
      }

      // Welcome message
      if (this.settings.welcomeChannelId) {
        const channel = member.guild.channels.cache.get(this.settings.welcomeChannelId);
        if (channel && channel.type === ChannelType.GuildText) {
          const template =
            this.settings.welcomeMessage ?? 'Welcome {user} to {server}! Enjoy your stay.';
          const content = template
            .replaceAll('{user}', this.settings.welcomeMention ? member.toString() : member.user.tag)
            .replaceAll('{server}', member.guild.name);
          try {
            await channel.send({ content });
          } catch (err) {
            this.log.error({ err }, 'Failed to send welcome message');
          }
        }
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

  updateSettings(next) {
    this.settings = { ...this.settings, ...next };
    writeSettings(this.config.dataDir, this.settings);
  }
}
