import {
  SlashCommandBuilder,
  time,
} from 'discord.js';

const rand = (list) => list[Math.floor(Math.random() * list.length)];

const simpleReplies = [
  { name: 'about', description: 'About the bot', reply: 'Frankenstein — a modular, open-source bot scaffold by Raizel.' },
  { name: 'support', description: 'Where to get help', reply: 'Need help? Ask in #support or DM the maintainer.' },
  { name: 'invite', description: 'Get the bot invite link', reply: 'Generate an OAuth2 URL with application.commands + bot scopes.' },
  { name: 'rules', description: 'Remind the server rules', reply: 'Be kind, no spam, keep topics in the right channel.' },
];

const choices = (name, description, options = [], handler) => ({
  data: (() => {
    const b = new SlashCommandBuilder().setName(name).setDescription(description);
    for (const opt of options) {
      if (opt.type === 'string') b.addStringOption((o) => o.setName(opt.name).setDescription(opt.description).setRequired(opt.required ?? false));
      if (opt.type === 'integer')
        b.addIntegerOption((o) => {
          o.setName(opt.name).setDescription(opt.description).setRequired(opt.required ?? false);
          if (opt.min !== undefined) o.setMinValue(opt.min);
          if (opt.max !== undefined) o.setMaxValue(opt.max);
          return o;
        });
      if (opt.type === 'user')
        b.addUserOption((o) => o.setName(opt.name).setDescription(opt.description).setRequired(opt.required ?? false));
      if (opt.type === 'boolean')
        b.addBooleanOption((o) => o.setName(opt.name).setDescription(opt.description).setRequired(opt.required ?? false));
    }
    return b;
  })(),
  async execute(interaction) {
    await handler(interaction);
  },
});

const textTransforms = [
  { name: 'echo', desc: 'Repeat your text', run: (t) => t },
  { name: 'reverse', desc: 'Reverse text', run: (t) => t.split('').reverse().join('') },
  { name: 'uppercase', desc: 'Uppercase text', run: (t) => t.toUpperCase() },
  { name: 'lowercase', desc: 'Lowercase text', run: (t) => t.toLowerCase() },
  { name: 'clap', desc: 'Add 👏 between words', run: (t) => t.split(/\s+/).join(' 👏 ') },
  { name: 'owo', desc: 'owo-ify your text', run: (t) => t.replace(/r|l/gi, (m) => (m === m.toUpperCase() ? 'W' : 'w')) },
  { name: 'mock', desc: 'sPoNgEbOb TeXt', run: (t) => t.split('').map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join('') },
  { name: 'emojify', desc: 'Text to regional indicator emoji', run: (t) => t.toLowerCase().replace(/[a-z]/g, (c) => `:regional_indicator_${c}:`).replace(/\s+/g, '   ') },
  { name: 'spoiler', desc: 'Wrap text in spoilers', run: (t) => `||${t}||` },
  { name: 'titlecase', desc: 'Title Case text', run: (t) => t.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()) },
];

const funLists = {
  eightBall: [
    'It is certain.',
    'Ask again later.',
    'Better not tell you now.',
    'Definitely yes.',
    'Very doubtful.',
    'Without a doubt.',
  ],
  compliments: [
    'You light up the room!',
    'Your code is poetry.',
    'You make things look easy.',
    'Brilliant mind at work.',
    'You have impeccable taste.',
  ],
  advice: [
    'Ship it small, ship it often.',
    'Cache invalidation is hard; name things well.',
    'Tests are the safety net for future you.',
    'Measure before you optimize.',
    'Write docs while things are fresh.',
  ],
  quotes: [
    '“Programs must be written for people to read.” – Hal Abelson',
    '“Simplicity is prerequisite for reliability.” – Dijkstra',
    '“First, solve the problem. Then, write the code.” – Wirth',
    '“Talk is cheap. Show me the code.” – Linus Torvalds',
    '“Code is like humor. When you have to explain it, it’s bad.” – Cory House',
  ],
  facts: [
    'Honey never spoils. Archaeologists found 3,000-year-old honey that was still edible.',
    'Octopuses have three hearts.',
    'Bananas are berries; strawberries are not.',
    'A day on Venus is longer than its year.',
    'Hot water can freeze faster than cold (Mpemba effect).',
  ],
};

const dice = (sides = 6) => 1 + Math.floor(Math.random() * sides);

const makeTransformCommands = textTransforms.map((t) =>
  choices(t.name, t.desc, [{ type: 'string', name: 'text', description: 'Text to transform', required: true }], async (i) => {
    const text = i.options.getString('text', true);
    await i.reply(t.run(text).slice(0, 1900) || 'Nothing to show.');
  }),
);

const baseCommands = [
  choices('8ball', 'Ask the magic 8-ball', [{ type: 'string', name: 'question', description: 'Your question', required: true }], async (i) =>
    i.reply(`🎱 ${rand(funLists.eightBall)}`),
  ),
  choices('choose', 'Pick one option', [{ type: 'string', name: 'options', description: 'Options separated by ,', required: true }], async (i) => {
    const raw = i.options.getString('options', true);
    const opts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    await i.reply(opts.length ? `I choose: **${rand(opts)}**` : 'Give me some options separated by commas.');
  }),
  choices('coinflip', 'Flip a coin', [], async (i) => i.reply(Math.random() > 0.5 ? 'Heads' : 'Tails')),
  choices('roll', 'Roll a 6-sided die', [], async (i) => i.reply(`You rolled **${dice()}**`)),
  choices('diceroll', 'Roll custom dice', [
    { type: 'integer', name: 'sides', description: 'Number of sides', required: true, min: 2, max: 1000 },
    { type: 'integer', name: 'count', description: 'How many dice', required: false, min: 1, max: 20 },
  ], async (i) => {
    const sides = i.options.getInteger('sides', true);
    const count = i.options.getInteger('count') || 1;
    const rolls = Array.from({ length: count }, () => dice(sides));
    await i.reply(`🎲 d${sides} x${count}: ${rolls.join(', ')} (sum ${rolls.reduce((a, b) => a + b, 0)})`);
  }),
  choices('random', 'Random number in a range', [
    { type: 'integer', name: 'min', description: 'Minimum', required: true, min: -1_000_000 },
    { type: 'integer', name: 'max', description: 'Maximum', required: true, max: 1_000_000 },
  ], async (i) => {
    const min = i.options.getInteger('min', true);
    const max = i.options.getInteger('max', true);
    if (min > max) return i.reply({ content: 'Min must be <= max.', ephemeral: true });
    const val = Math.floor(Math.random() * (max - min + 1)) + min;
    await i.reply(`Random: **${val}**`);
  }),
  choices('fact', 'Get a random fact', [], async (i) => i.reply(rand(funLists.facts))),
  choices('quote', 'Get an inspirational quote', [], async (i) => i.reply(rand(funLists.quotes))),
  choices('advice', 'Get a piece of advice', [], async (i) => i.reply(rand(funLists.advice))),
  choices('compliment', 'Receive a compliment', [], async (i) => i.reply(rand(funLists.compliments))),
  choices('uptime', 'Show bot uptime', [], async (i) => {
    const now = Date.now();
    const diff = now - (i.client.readyTimestamp ?? now);
    const seconds = Math.floor(diff / 1000);
    await i.reply(`Uptime: ${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}s`);
  }),
  choices('serverinfo', 'Show server info', [], async (i) => {
    if (!i.guild) return i.reply({ content: 'Server info only works in guilds.', ephemeral: true });
    const { guild } = i;
    await i.reply(`Server: **${guild.name}**\nMembers: ${guild.memberCount}\nCreated: ${time(guild.createdAt, 'R')}`);
  }),
  choices('userinfo', 'Show user info', [{ type: 'user', name: 'user', description: 'User', required: false }], async (i) => {
    const user = i.options.getUser('user') || i.user;
    const member = i.guild?.members.cache.get(user.id);
    await i.reply(
      `User: **${user.tag}**\nID: ${user.id}\nCreated: ${time(user.createdAt, 'R')}${
        member ? `\nJoined: ${time(member.joinedAt ?? new Date(), 'R')}` : ''
      }`,
    );
  }),
  choices('avatar', 'Show a user avatar', [{ type: 'user', name: 'user', description: 'User', required: false }], async (i) => {
    const user = i.options.getUser('user') || i.user;
    const url = user.displayAvatarURL({ size: 512, extension: 'png' });
    await i.reply(url);
  }),
  choices('timestamp', 'Format a unix timestamp', [
    { type: 'integer', name: 'seconds', description: 'Unix seconds', required: true, min: 0 },
  ], async (i) => {
    const ts = i.options.getInteger('seconds', true);
    await i.reply(`${time(new Date(ts * 1000))} | ${time(new Date(ts * 1000), 'R')}`);
  }),
  choices('calcadd', 'Add two numbers', [
    { type: 'integer', name: 'a', description: 'First number', required: true, min: -1_000_000, max: 1_000_000 },
    { type: 'integer', name: 'b', description: 'Second number', required: true, min: -1_000_000, max: 1_000_000 },
  ], async (i) => {
    const a = i.options.getInteger('a', true);
    const b = i.options.getInteger('b', true);
    await i.reply(`${a} + ${b} = ${a + b}`);
  }),
  choices('calcsub', 'Subtract two numbers', [
    { type: 'integer', name: 'a', description: 'First number', required: true },
    { type: 'integer', name: 'b', description: 'Second number', required: true },
  ], async (i) => {
    const a = i.options.getInteger('a', true);
    const b = i.options.getInteger('b', true);
    await i.reply(`${a} - ${b} = ${a - b}`);
  }),
  choices('calcmul', 'Multiply two numbers', [
    { type: 'integer', name: 'a', description: 'First number', required: true },
    { type: 'integer', name: 'b', description: 'Second number', required: true },
  ], async (i) => {
    const a = i.options.getInteger('a', true);
    const b = i.options.getInteger('b', true);
    await i.reply(`${a} × ${b} = ${a * b}`);
  }),
  choices('calcdiv', 'Divide two numbers', [
    { type: 'integer', name: 'a', description: 'First number', required: true },
    { type: 'integer', name: 'b', description: 'Second number', required: true },
  ], async (i) => {
    const a = i.options.getInteger('a', true);
    const b = i.options.getInteger('b', true);
    if (b === 0) return i.reply({ content: 'Division by zero.', ephemeral: true });
    await i.reply(`${a} ÷ ${b} = ${(a / b).toFixed(4)}`);
  }),
  choices('percent', 'Percentage of a number', [
    { type: 'integer', name: 'part', description: 'Part', required: true },
    { type: 'integer', name: 'whole', description: 'Whole', required: true },
  ], async (i) => {
    const part = i.options.getInteger('part', true);
    const whole = i.options.getInteger('whole', true);
    if (whole === 0) return i.reply({ content: 'Whole cannot be zero.', ephemeral: true });
    await i.reply(`${((part / whole) * 100).toFixed(2)}%`);
  }),
  choices('palindrome', 'Check if text is a palindrome', [{ type: 'string', name: 'text', description: 'Text', required: true }], async (i) => {
    const text = i.options.getString('text', true).toLowerCase().replace(/[^a-z0-9]/g, '');
    const is = text === text.split('').reverse().join('');
    await i.reply(is ? 'Yes, that is a palindrome.' : 'Nope, not a palindrome.');
  }),
  choices('length', 'Count characters', [{ type: 'string', name: 'text', description: 'Text', required: true }], async (i) => {
    const text = i.options.getString('text', true);
    await i.reply(`Length: ${text.length} characters.`);
  }),
  choices('wordcount', 'Count words', [{ type: 'string', name: 'text', description: 'Text', required: true }], async (i) => {
    const text = i.options.getString('text', true).trim();
    const words = text ? text.split(/\s+/).length : 0;
    await i.reply(`Words: ${words}`);
  }),
  choices('scramble', 'Scramble the letters', [{ type: 'string', name: 'text', description: 'Text', required: true }], async (i) => {
    const text = i.options.getString('text', true);
    const arr = text.split('');
    for (let idx = arr.length - 1; idx > 0; idx -= 1) {
      const j = Math.floor(Math.random() * (idx + 1));
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
    }
    await i.reply(arr.join(''));
  }),
  choices('shuffle', 'Shuffle comma-separated items', [{ type: 'string', name: 'items', description: 'Item1, Item2, ...', required: true }], async (i) => {
    const items = i.options.getString('items', true).split(',').map((s) => s.trim()).filter(Boolean);
    for (let idx = items.length - 1; idx > 0; idx -= 1) {
      const j = Math.floor(Math.random() * (idx + 1));
      [items[idx], items[j]] = [items[j], items[idx]];
    }
    await i.reply(items.join(', '));
  }),
  choices('base64encode', 'Base64-encode text', [{ type: 'string', name: 'text', description: 'Text', required: true }], async (i) => {
    const text = i.options.getString('text', true);
    await i.reply(Buffer.from(text, 'utf8').toString('base64'));
  }),
  choices('base64decode', 'Base64-decode text', [{ type: 'string', name: 'text', description: 'Base64 text', required: true }], async (i) => {
    const text = i.options.getString('text', true);
    try {
      await i.reply(Buffer.from(text, 'base64').toString('utf8'));
    } catch {
      await i.reply({ content: 'Invalid base64.', ephemeral: true });
    }
  }),
  choices('binary', 'Text to binary', [{ type: 'string', name: 'text', description: 'Text', required: true }], async (i) => {
    const text = i.options.getString('text', true);
    const bin = Array.from(text).map((c) => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
    await i.reply(bin.slice(0, 1900));
  }),
  choices('unbinary', 'Binary to text', [{ type: 'string', name: 'bits', description: 'Binary bytes', required: true }], async (i) => {
    const bits = i.options.getString('bits', true).trim().split(/\s+/);
    try {
      const text = bits.map((b) => String.fromCharCode(parseInt(b, 2))).join('');
      await i.reply(text);
    } catch {
      await i.reply({ content: 'Invalid binary.', ephemeral: true });
    }
  }),
  choices('leet', 'Convert text to leetspeak', [{ type: 'string', name: 'text', description: 'Text', required: true }], async (i) => {
    const map = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7' };
    const text = i.options.getString('text', true).replace(/[aeiost]/gi, (c) => map[c.toLowerCase()]);
    await i.reply(text);
  }),
  choices('uuid', 'Generate a UUID v4', [], async (i) => {
    const { randomUUID } = await import('node:crypto');
    await i.reply(randomUUID());
  }),
  choices('password', 'Generate a random password', [{ type: 'integer', name: 'length', description: 'Length (6-64)', required: false, min: 6, max: 64 }], async (i) => {
    const len = i.options.getInteger('length') ?? 16;
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
    let out = '';
    for (let x = 0; x < len; x += 1) out += chars[Math.floor(Math.random() * chars.length)];
    await i.reply(out);
  }),
  choices('color', 'Generate a random hex color', [], async (i) => {
    const hex = Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0');
    await i.reply(`#${hex}`);
  }),
  choices('remind', 'Get a reminder format helper', [{ type: 'string', name: 'text', description: 'Reminder text', required: true }], async (i) => {
    const text = i.options.getString('text', true);
    await i.reply(`I cannot schedule reminders yet, but you asked me to remember: "${text}".`);
  }),
];

const toFullWidth = (str) =>
  str.replace(/[!-~]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0xfee0));

const shiftText = (text, shift) =>
  text.replace(/[a-z]/gi, (c) => {
    const base = c >= 'a' ? 97 : 65;
    const code = ((c.charCodeAt(0) - base + shift + 26) % 26) + base;
    return String.fromCharCode(code);
  });

const extraCommands = [
  choices('poll', 'Create a quick yes/no poll', [{ type: 'string', name: 'question', description: 'Question', required: true }], async (i) => {
    const q = i.options.getString('question', true);
    const msg = await i.reply({ content: `📊 ${q}\n👍 Yes\n👎 No`, fetchReply: true });
    await msg.react('👍').catch(() => {});
    await msg.react('👎').catch(() => {});
  }),
  choices(
    'slowmode',
    'Set slowmode for this channel',
    [{ type: 'integer', name: 'seconds', description: '0 to disable', required: true, min: 0, max: 21600 }],
    async (i) => {
      if (!i.channel?.isTextBased() || !i.memberPermissions?.has('ManageChannels')) {
        return i.reply({ content: 'Manage Channels required.', ephemeral: true });
      }
      const sec = i.options.getInteger('seconds', true);
      await i.channel.setRateLimitPerUser(sec, `Set by ${i.user.tag}`);
      await i.reply(`Slowmode set to ${sec}s.`);
    },
  ),
  choices('lock', 'Lock this channel (deny Send Messages)', [], async (i) => {
    if (!i.channel?.isTextBased() || !i.memberPermissions?.has('ManageChannels')) {
      return i.reply({ content: 'Manage Channels required.', ephemeral: true });
    }
    await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, { SendMessages: false });
    await i.reply('Channel locked.');
  }),
  choices('unlock', 'Unlock this channel', [], async (i) => {
    if (!i.channel?.isTextBased() || !i.memberPermissions?.has('ManageChannels')) {
      return i.reply({ content: 'Manage Channels required.', ephemeral: true });
    }
    await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, { SendMessages: null });
    await i.reply('Channel unlocked.');
  }),
  choices(
    'nickname',
    'Change a user nickname',
    [
      { type: 'user', name: 'user', description: 'Target user', required: true },
      { type: 'string', name: 'nick', description: 'New nickname (empty to clear)', required: false },
    ],
    async (i) => {
      if (!i.memberPermissions?.has('ManageNicknames')) {
        return i.reply({ content: 'Manage Nicknames required.', ephemeral: true });
      }
      const member = i.options.getMember('user');
      if (!member) return i.reply({ content: 'Member not found.', ephemeral: true });
      const nick = i.options.getString('nick') ?? '';
      await member.setNickname(nick || null, `Set by ${i.user.tag}`).catch(() => {});
      await i.reply(nick ? `Nickname set to "${nick}".` : 'Nickname cleared.');
    },
  ),
  choices(
    'purgeuser',
    'Delete last messages from a user (max 100)',
    [
      { type: 'user', name: 'user', description: 'User to target', required: true },
      { type: 'integer', name: 'count', description: 'Messages to scan (1-100)', required: false, min: 1, max: 100 },
    ],
    async (i) => {
      if (!i.channel?.isTextBased() || !i.memberPermissions?.has('ManageMessages')) {
        return i.reply({ content: 'Manage Messages required.', ephemeral: true });
      }
      const user = i.options.getUser('user', true);
      const limit = i.options.getInteger('count') ?? 50;
      const messages = await i.channel.messages.fetch({ limit });
      const toDelete = messages.filter((m) => m.author.id === user.id).first(100);
      await i.channel.bulkDelete(toDelete, true);
      await i.reply({ content: `Deleted ${toDelete.length} messages from ${user.tag}.`, ephemeral: true });
    },
  ),
  choices('rollstat', 'Roll 4d6 drop lowest (ability score)', [], async (i) => {
    const roll = () => {
      const dice = [0, 0, 0, 0].map(() => 1 + Math.floor(Math.random() * 6)).sort((a, b) => b - a);
      return { dice, total: dice[0] + dice[1] + dice[2] };
    };
    const { dice, total } = roll();
    await i.reply(`🎲 Rolled: ${dice.join(', ')} -> **${total}**`);
  }),
  choices('pickmember', 'Pick a random online member', [], async (i) => {
    if (!i.guild) return i.reply({ content: 'Guild only.', ephemeral: true });
    const members = await i.guild.members.fetch({ withPresences: true });
    const pool = members.filter((m) => !m.user.bot).map((m) => m);
    if (!pool.length) return i.reply('No members to pick from.');
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    await i.reply(`🎯 Selected: ${chosen.user.tag}`);
  }),
  choices('shrug', 'Send a shrug', [], async (i) => i.reply('¯\\\\_(ツ)_/¯')),
  choices('flip', 'Flip a table', [], async (i) => i.reply('(╯°□°）╯︵ ┻━┻')),
  choices('unflip', 'Put the table back', [], async (i) => i.reply('┬─┬ ノ( ゜-゜ノ)')),
  choices('dicepool', 'Roll NdM dice', [
    { type: 'integer', name: 'count', description: 'Number of dice', required: true, min: 1, max: 50 },
    { type: 'integer', name: 'sides', description: 'Sides per die', required: true, min: 2, max: 1000 },
  ], async (i) => {
    const count = i.options.getInteger('count', true);
    const sides = i.options.getInteger('sides', true);
    const rolls = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
    const sum = rolls.reduce((a, b) => a + b, 0);
    await i.reply(`🎲 ${count}d${sides}: ${rolls.join(', ')} (sum ${sum})`);
  }),
  choices('botinfo', 'Show bot info', [], async (i) => {
    const client = i.client;
    await i.reply(`Bot: ${client.user?.tag}\nServers: ${client.guilds.cache.size}\nUsers (cached): ${client.users.cache.size}`);
  }),
  choices('servericon', 'Get this server icon', [], async (i) => {
    if (!i.guild) return i.reply({ content: 'Guild only.', ephemeral: true });
    const url = i.guild.iconURL({ size: 512, extension: 'png' });
    await i.reply(url ?? 'No icon set.');
  }),
  choices('serverbanner', 'Get this server banner', [], async (i) => {
    if (!i.guild) return i.reply({ content: 'Guild only.', ephemeral: true });
    const url = i.guild.bannerURL({ size: 1024, extension: 'png' });
    await i.reply(url ?? 'No banner set.');
  }),
  choices('channelinfo', 'Info about this channel', [], async (i) => {
    if (!i.channel || !i.channel.isTextBased()) return i.reply({ content: 'Text channels only.', ephemeral: true });
    await i.reply(`Channel: ${i.channel}\nID: ${i.channel.id}\nTopic: ${i.channel.topic ?? 'None'}\nNSFW: ${i.channel.nsfw}`);
  }),
  choices('roleinfo', 'Info about a role', [{ type: 'role', name: 'role', description: 'Role', required: true }], async (i) => {
    const role = i.options.getRole('role', true);
    await i.reply(
      `Role: ${role.name}\nID: ${role.id}\nColor: ${role.hexColor}\nMembers: ${role.members.size}\nHoisted: ${role.hoist}`,
    );
  }),
  choices('emoji', 'Get emoji image URL', [{ type: 'string', name: 'emoji', description: 'Custom emoji', required: true }], async (i) => {
    const raw = i.options.getString('emoji', true);
    const match = raw.match(/<(a?):(\w+):(\d+)>/);
    if (!match) return i.reply({ content: 'Provide a custom emoji like <:name:id>.', ephemeral: true });
    const animated = match[1] === 'a';
    const id = match[3];
    const url = `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}?size=512`;
    await i.reply(url);
  }),
  choices('snowflake', 'Convert snowflake to timestamp', [{ type: 'string', name: 'id', description: 'Snowflake ID', required: true }], async (i) => {
    const id = i.options.getString('id', true);
    const asInt = BigInt(id);
    const epoch = 1420070400000n;
    const ms = Number((asInt >> 22n) + epoch);
    await i.reply(`${new Date(ms).toISOString()}`);
  }),
  choices('hex2dec', 'Hex to decimal', [{ type: 'string', name: 'hex', description: 'Hex number', required: true }], async (i) => {
    const hex = i.options.getString('hex', true).replace(/^0x/, '');
    const dec = parseInt(hex, 16);
    if (Number.isNaN(dec)) return i.reply({ content: 'Invalid hex.', ephemeral: true });
    await i.reply(dec.toString());
  }),
  choices('dec2hex', 'Decimal to hex', [{ type: 'integer', name: 'dec', description: 'Decimal number', required: true }], async (i) => {
    const dec = i.options.getInteger('dec', true);
    await i.reply('0x' + dec.toString(16));
  }),
  choices('bin2dec', 'Binary to decimal', [{ type: 'string', name: 'bin', description: 'Binary number', required: true }], async (i) => {
    const bin = i.options.getString('bin', true);
    const dec = parseInt(bin, 2);
    if (Number.isNaN(dec)) return i.reply({ content: 'Invalid binary.', ephemeral: true });
    await i.reply(dec.toString());
  }),
  choices('dec2bin', 'Decimal to binary', [{ type: 'integer', name: 'dec', description: 'Decimal number', required: true }], async (i) => {
    const dec = i.options.getInteger('dec', true);
    await i.reply(dec.toString(2));
  }),
  choices('c2f', 'Celsius to Fahrenheit', [{ type: 'integer', name: 'c', description: 'Celsius', required: true }], async (i) => {
    const c = i.options.getInteger('c', true);
    await i.reply(`${((c * 9) / 5 + 32).toFixed(2)} °F`);
  }),
  choices('f2c', 'Fahrenheit to Celsius', [{ type: 'integer', name: 'f', description: 'Fahrenheit', required: true }], async (i) => {
    const f = i.options.getInteger('f', true);
    await i.reply(`${(((f - 32) * 5) / 9).toFixed(2)} °C`);
  }),
  choices('km2mi', 'Kilometers to miles', [{ type: 'number', name: 'km', description: 'Kilometers', required: true }], async (i) => {
    const km = Number(i.options.getNumber('km', true));
    await i.reply(`${(km * 0.621371).toFixed(3)} mi`);
  }),
  choices('mi2km', 'Miles to kilometers', [{ type: 'number', name: 'mi', description: 'Miles', required: true }], async (i) => {
    const mi = Number(i.options.getNumber('mi', true));
    await i.reply(`${(mi / 0.621371).toFixed(3)} km`);
  }),
  choices('kg2lb', 'Kilograms to pounds', [{ type: 'number', name: 'kg', description: 'Kilograms', required: true }], async (i) => {
    const kg = Number(i.options.getNumber('kg', true));
    await i.reply(`${(kg * 2.20462).toFixed(3)} lb`);
  }),
  choices('lb2kg', 'Pounds to kilograms', [{ type: 'number', name: 'lb', description: 'Pounds', required: true }], async (i) => {
    const lb = Number(i.options.getNumber('lb', true));
    await i.reply(`${(lb / 2.20462).toFixed(3)} kg`);
  }),
  choices('urlencode', 'URL-encode text', [{ type: 'string', name: 'text', description: 'Text', required: true }], async (i) => {
    await i.reply(encodeURIComponent(i.options.getString('text', true)).slice(0, 1900));
  }),
  choices('urldecode', 'URL-decode text', [{ type: 'string', name: 'text', description: 'Encoded text', required: true }], async (i) => {
    try {
      await i.reply(decodeURIComponent(i.options.getString('text', true)));
    } catch {
      await i.reply({ content: 'Invalid encoded text.', ephemeral: true });
    }
  }),
  choices('caesar', 'Caesar cipher shift', [
    { type: 'string', name: 'text', description: 'Text', required: true },
    { type: 'integer', name: 'shift', description: 'Shift (-25 to 25)', required: true, min: -25, max: 25 },
  ], async (i) => {
    const text = i.options.getString('text', true);
    const shift = i.options.getInteger('shift', true);
    await i.reply(shiftText(text, shift));
  }),
  choices('fullwidth', 'Vaporwave / full-width text', [{ type: 'string', name: 'text', description: 'Text', required: true }], async (i) => {
    await i.reply(toFullWidth(i.options.getString('text', true)).slice(0, 1900));
  }),
  choices('bold', 'Bold your text', [{ type: 'string', name: 'text', description: 'Text', required: true }], async (i) => {
    await i.reply(`**${i.options.getString('text', true)}**`);
  }),
  choices('italic', 'Italicize your text', [{ type: 'string', name: 'text', description: 'Text', required: true }], async (i) => {
    await i.reply(`*${i.options.getString('text', true)}*`);
  }),
  choices('code', 'Wrap in code block', [{ type: 'string', name: 'text', description: 'Text', required: true }], async (i) => {
    await i.reply('```' + i.options.getString('text', true).slice(0, 1900) + '```');
  }),
  choices('stripmd', 'Strip markdown', [{ type: 'string', name: 'text', description: 'Text', required: true }], async (i) => {
    const text = i.options.getString('text', true);
    await i.reply(text.replace(/[*_`~>|]/g, ''));
  }),
  choices('charinfo', 'Show char codepoint', [{ type: 'string', name: 'char', description: 'Single character', required: true }], async (i) => {
    const ch = i.options.getString('char', true);
    const c = Array.from(ch)[0];
    const code = c.codePointAt(0);
    await i.reply(`'${c}' U+${code.toString(16).toUpperCase().padStart(4, '0')} (${code})`);
  }),
  choices('regexescape', 'Escape text for regex', [{ type: 'string', name: 'text', description: 'Text', required: true }], async (i) => {
    const text = i.options.getString('text', true);
    await i.reply(text.replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&'));
  }),
  choices('calcmod', 'Modulo two numbers', [
    { type: 'integer', name: 'a', description: 'Dividend', required: true },
    { type: 'integer', name: 'b', description: 'Divisor', required: true },
  ], async (i) => {
    const a = i.options.getInteger('a', true);
    const b = i.options.getInteger('b', true);
    if (b === 0) return i.reply({ content: 'Divisor cannot be zero.', ephemeral: true });
    await i.reply(`${a} mod ${b} = ${a % b}`);
  }),
  choices('calcavg', 'Average comma-separated numbers', [{ type: 'string', name: 'numbers', description: 'e.g. 1,2,3', required: true }], async (i) => {
    const nums = i.options
      .getString('numbers', true)
      .split(',')
      .map((n) => Number(n.trim()))
      .filter((n) => !Number.isNaN(n));
    if (!nums.length) return i.reply({ content: 'Provide numbers like 1,2,3', ephemeral: true });
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    await i.reply(`Average: ${avg.toFixed(3)}`);
  }),
];

const simpleCommands = simpleReplies.map((c) =>
  choices(c.name, c.description, [], async (i) => i.reply(c.reply)),
);

const targetCount = 90; // keep total under Discord's 100-command limit with other modules

export const commands = [...simpleCommands, ...makeTransformCommands, ...baseCommands, ...extraCommands].slice(0, targetCount);
