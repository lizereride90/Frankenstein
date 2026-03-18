import { loadConfig } from './config/index.js';
import { createLogger } from './core/logger.js';
import { FrankensteinClient } from './core/client.js';

const config = loadConfig();
const logger = createLogger(config.logLevel);

if (!config.token) {
  logger.fatal('DISCORD_TOKEN missing. Set it in .env');
  process.exit(1);
}
if (!config.clientId) {
  logger.fatal('DISCORD_CLIENT_ID missing. Set it in .env');
  process.exit(1);
}

const client = new FrankensteinClient(config, logger);

client.init().then(() => {
  client.login(config.token);
});
