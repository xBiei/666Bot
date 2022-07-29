import winston, { format } from 'winston';
import DiscordTransport from 'winston-discord-transport';
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
      webhook:
        'https://discord.com/api/webhooks/1002655588230119436/vslQm5NeDqwJko0O-BjMMzEXC2Gq4kULeTYLnKi00fr3M9MIkN22CjrLqtej9c-eyzHi',
      defaultMeta: { bot: '666' }
    }),
    new winston.transports.File({ filename: 'log.json' })
  ]
});
export default logger;
