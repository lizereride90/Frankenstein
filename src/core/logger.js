import pino from 'pino';

export const createLogger = (level = 'info') =>
  pino({
    name: 'frankenstein',
    level: level.toLowerCase(),
  });
