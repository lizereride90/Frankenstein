import fs from 'node:fs';
import path from 'node:path';

const SETTINGS_FILE = 'settings.json';

export const ensureDataFiles = (dataDir) => {
  fs.mkdirSync(dataDir, { recursive: true });
  const settingsPath = path.join(dataDir, SETTINGS_FILE);
  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(
      settingsPath,
      JSON.stringify(
        {
          autoroleId: null,
          blacklist: [],
          ticketStaffRoleId: null,
          ticketCategoryId: null,
          welcomeChannelId: null,
          welcomeMessage: null,
          welcomeMention: false,
        },
        null,
        2,
      ),
    );
  }
};

export const readSettings = (dataDir) => {
  try {
    const raw = fs.readFileSync(path.join(dataDir, SETTINGS_FILE), 'utf8');
    const parsed = JSON.parse(raw);
    return {
      autoroleId: parsed.autoroleId ?? null,
      blacklist: Array.isArray(parsed.blacklist)
        ? parsed.blacklist.map((w) => String(w).toLowerCase())
        : [],
      ticketStaffRoleId: parsed.ticketStaffRoleId ?? null,
      ticketCategoryId: parsed.ticketCategoryId ?? null,
      welcomeChannelId: parsed.welcomeChannelId ?? null,
      welcomeMessage: parsed.welcomeMessage ?? null,
      welcomeMention: parsed.welcomeMention ?? false,
    };
  } catch (err) {
    return {
      autoroleId: null,
      blacklist: [],
      ticketStaffRoleId: null,
      ticketCategoryId: null,
      welcomeChannelId: null,
      welcomeMessage: null,
      welcomeMention: false,
    };
  }
};

export const writeSettings = (dataDir, data) => {
  const safe = {
    autoroleId: data.autoroleId ?? null,
    blacklist: Array.from(new Set(data.blacklist || [])).map((w) => String(w).toLowerCase()),
    ticketStaffRoleId: data.ticketStaffRoleId ?? null,
    ticketCategoryId: data.ticketCategoryId ?? null,
    welcomeChannelId: data.welcomeChannelId ?? null,
    welcomeMessage: data.welcomeMessage ?? null,
    welcomeMention: !!data.welcomeMention,
  };
  fs.writeFileSync(path.join(dataDir, SETTINGS_FILE), JSON.stringify(safe, null, 2));
};
