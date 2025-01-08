import winston, { format } from 'winston';
import DiscordTransport from 'winston-discord-transport';
import * as config from '../config.json';

const customFormat = format.combine(
  format.timestamp(),
  format.align(),
  format.printf(
    (info) => `{"level":"${info.level}","time":"${info.timestamp}","msg":"${info.message}"}`
  )
);
const logger = winston.createLogger({
  format: customFormat,
  transports: [
    new DiscordTransport({
      webhook: config.webhook,
      defaultMeta: { bot: '666' }
    }),
    new winston.transports.File({ filename: 'log.json' })
  ]
});
export default logger;
