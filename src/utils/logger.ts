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
        'https://discord.com/api/webhooks/1326155784220053625/wzTIlT_SLN5rM_XycnnDdb_emdOwXtxUIJecvcgKHOox3OBao1dujtJwuUDmFGsP7468',
      defaultMeta: { bot: '666' }
    }),
    new winston.transports.File({ filename: 'log.json' })
  ]
});
export default logger;
