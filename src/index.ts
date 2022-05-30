import { readdir } from 'fs';
import path from 'path';
import { Client, Collection, Intents, Interaction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { AudioResource, VoiceConnection } from '@discordjs/voice';
import { restApi } from './utils/rest';
import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/rest/v9/interactions';
require('dotenv').config();

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
    name: string;
    group?: string;
    description: string;
    aliases?: string[];
  };
}
export class CustomClient extends Client {
  commands: Collection<String, CommandData> = new Collection();
  slashCommands: Collection<String, RESTPostAPIApplicationCommandsJSONBody> = new Collection();
}

const client = new CustomClient({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MESSAGES
  ]
});
const prefix = process.env.prefix;

client.commands = new Collection();
client.slashCommands = new Collection();
let musicQueue: Collection<string, QueueObject> = new Collection();

client.on('ready', async () => {
  console.log("Bot's Up!");
  client.user?.setActivity(`Luv u`, { type: 'PLAYING' });

  await readdir(path.resolve(__dirname, 'cmds'), async (error, files) => {
    if (error) throw error;
    await files.forEach((file) => {
      if (!file.endsWith('.js')) return;

      const properties: CommandData = require(`${path.resolve(__dirname, 'cmds')}/${file}`);

      client.slashCommands.set(
        properties.info.name,
        properties.info.slash?.toJSON() as RESTPostAPIApplicationCommandsJSONBody
      );
      client.commands.set(properties.info.name, properties);
      //  else if (properties.info.aliases) {
      //   properties.info.aliases.forEach((alias) => client.commands.set(alias, properties));
      // } else client.commands.set(properties.info.name, properties);
    });
    restApi(client, client.slashCommands);
  });
});

// client.on('messageCreate', async (message) => {
//   if (message.content.slice(0, prefix?.length) != prefix) return;
//   if (message.author.bot) return;

//   const args = message.content.substring(3).split(' ');
//   const cmd = message.content.substring(3).split(' ').shift();
//   const command = client.commands.get(cmd ? cmd : 'null');
//   if (!command) return console.log('not found');

//   if (command?.info.group === 'voice') {
//     try {
//       await command.run(message, args, musicQueue, client);
//     } catch (err) {
//       console.log(err);
//     }
//   } else {
//     try {
//       await command.run(message, args, undefined, client);
//     } catch (err) {
//       console.log(err);
//     }
//   }
// });

client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction, musicQueue);
  } catch (error) {
    console.log(error);
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true
    });
  }
});

client.on('error', (err) => {
  console.log('An Error Has Occured in Client: ' + err);
});

client.login(process.env.token);
