import { readdir } from 'fs';
import path from 'path';
import {
  ActivityType,
  Client,
  Collection,
  ContextMenuCommandBuilder,
  GatewayIntentBits,
  Interaction,
  InteractionType,
  Message,
  SlashCommandBuilder
} from 'discord.js';
import { AudioResource, VoiceConnection } from '@discordjs/voice';
import { restApi } from './utils/rest';
import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/rest/v10/interactions';
import { QuickDB } from 'quick.db';
import logger from './utils/logger';

require('dotenv').config();
const db = new QuickDB();
export interface QueueObject {
  id: string;
  voice: string;
  connection?: VoiceConnection;
  resource?: AudioResource;
}

interface CommandData {
  run: (
    msg?: Message,
    args?: string[],
    musicQueue?: Collection<string, QueueObject>,
    client?: Client
  ) => Promise<void>;
  execute: (
    interaction?: Interaction,
    musicQueue?: Collection<string, QueueObject>
  ) => Promise<void>;
  info: {
    slash?: SlashCommandBuilder;
    context?: ContextMenuCommandBuilder;
    name: string;
    group?: string;
    description: string;
    aliases?: string[];
  };
}
export class CustomClient extends Client {
  commands: Collection<String, CommandData> = new Collection();
  slashCommands: Collection<String, RESTPostAPIApplicationCommandsJSONBody> = new Collection();
  contextCommands: Collection<String, RESTPostAPIApplicationCommandsJSONBody> = new Collection();
}

const client = new CustomClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages
  ]
});

client.commands = new Collection();
client.slashCommands = new Collection();
client.contextCommands = new Collection();
let musicQueue: Collection<string, QueueObject> = new Collection();

client.on('ready', async () => {
  logger.info("Bot's Up!");
  client.user?.setActivity(`Cigarettes After Sex, K.`, { type: ActivityType.Listening });

  await readdir(path.resolve(__dirname, 'cmds'), async (error, files) => {
    if (error) throw error;
    await files.forEach((file) => {
      if (!file.endsWith('.js')) return;

      const properties: CommandData = require(`${path.resolve(__dirname, 'cmds')}/${file}`);

      properties.info.context
        ? client.contextCommands.set(
            properties.info.name,
            properties.info.context?.toJSON() as RESTPostAPIApplicationCommandsJSONBody
          )
        : null;
      properties.info.name === 'snippet'
        ? null
        : client.slashCommands.set(
            properties.info.name,
            properties.info.slash?.toJSON() as RESTPostAPIApplicationCommandsJSONBody
          );
      properties.info.aliases?.forEach((alias) => {
        client.commands.set(alias, properties);
      });

      client.commands.set(properties.info.name, properties);
    });
    restApi(client, client.slashCommands, client.contextCommands);
  });
});

client.on('interactionCreate', async (interaction: Interaction) => {
  if (interaction.type === InteractionType.ApplicationCommand) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, musicQueue);
      await db.add(`${interaction.guildId}.${interaction.commandName}`, 1);
    } catch (error) {
      logger.error(error);
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true
      });
    }
  } else logger.info(interaction);
});

client.on('debug', (m) => logger.debug(m));
client.on('warn', (m) => logger.warn(m));
client.on('error', (m) => logger.error(m));

client.login(process.env.token);
