import fs from 'node:fs';
import path from 'node:path';

const SETTINGS_FILE = 'settings.json';

export const ensureDataFiles = (dataDir) => {
  fs.mkdirSync(dataDir, { recursive: true });
  const settingsPath = path.join(dataDir, SETTINGS_FILE);
  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, JSON.stringify({ autoroleId: null, blacklist: [] }, null, 2));
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
    };
  } catch (err) {
    return { autoroleId: null, blacklist: [] };
  }
};

export const writeSettings = (dataDir, data) => {
  const safe = {
    autoroleId: data.autoroleId ?? null,
    blacklist: Array.from(new Set(data.blacklist || [])).map((w) => String(w).toLowerCase()),
  };
  fs.writeFileSync(path.join(dataDir, SETTINGS_FILE), JSON.stringify(safe, null, 2));
};
