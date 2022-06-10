import { readdir } from 'fs';
import path from 'path';
import { Client, Collection, Intents, Interaction, Message } from 'discord.js';
import { ContextMenuCommandBuilder, SlashCommandBuilder } from '@discordjs/builders';
import { AudioResource, VoiceConnection } from '@discordjs/voice';
import { restApi } from './utils/rest';
import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/rest/v9/interactions';
import { QuickDB } from 'quick.db';
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
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MESSAGES
  ]
});

client.commands = new Collection();
client.slashCommands = new Collection();
client.contextCommands = new Collection();
let musicQueue: Collection<string, QueueObject> = new Collection();

client.on('ready', async () => {
  console.log("Bot's Up!");
  client.user?.setActivity(`Luv u`, { type: 'PLAYING' });

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

      client.slashCommands.set(
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
  if (interaction.isCommand() || interaction.isContextMenu() || interaction.isUserContextMenu()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, musicQueue);
      await db.add(`${interaction.guildId}.${interaction.commandName}`, 1);
    } catch (error) {
      console.log(error);
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true
      });
    }
  } else console.log(interaction);
});

client.on('error', (err) => {
  console.log('An Error Has Occured in Client: ' + err);
});

client.login(process.env.token);
