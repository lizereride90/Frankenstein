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
];

const simpleCommands = simpleReplies.map((c) =>
  choices(c.name, c.description, [], async (i) => i.reply(c.reply)),
);

const targetCount = 60; // leaves headroom for moderation/ticket/welcome

export const commands = [...simpleCommands, ...makeTransformCommands, ...baseCommands, ...extraCommands].slice(0, targetCount);
