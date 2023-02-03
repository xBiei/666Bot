import { readdir } from 'fs';
import path from 'path';
import {
  ActivityType,
  Client,
  Collection,
  ContextMenuCommandBuilder,
  EmbedBuilder,
  GatewayIntentBits,
  Interaction,
  InteractionType,
  Message,
  PresenceStatusData,
  SlashCommandBuilder,
  TextChannel,
  User
} from 'discord.js';
import { restApi } from './utils/rest';
import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/rest/v10/interactions';
import { QuickDB } from 'quick.db';
import logger from './utils/logger';
import * as config from './config.json';
import InvitesTracker from '@androz2091/discord-invites-tracker';

const db = new QuickDB();

interface CommandData {
  run: (msg?: Message, args?: string[], client?: Client) => Promise<void>;
  execute: (interaction?: Interaction, client?: CustomClient) => Promise<void>;
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

let activityType: ActivityType.Playing | ActivityType.Watching | ActivityType.Listening;

if (config.activityType === 'Playing') activityType = ActivityType.Playing;
else if (config.activityType === 'Watching') activityType = ActivityType.Watching;
else if (config.activityType === 'Listening') activityType = ActivityType.Listening;

const tracker = InvitesTracker.init(client, {
  fetchGuilds: true,
  fetchVanity: true,
  fetchAuditLogs: true,
  activeGuilds: ['913917739079446569', '334000744405663754']
});

tracker.on('guildMemberAdd', (member, type, invite) => {
  console.log('type', type);
  console.log('invite', invite);
  console.log('member', member);

  const channel =
    invite?.guildId === '913917739079446569'
      ? (client.channels.cache.get('1019742148976984094') as TextChannel)
      : (client.channels.cache.get('1003222789198712842') as TextChannel);

  const userEmbed = new EmbedBuilder()
    .setAuthor({
      name: member.user.username,
      iconURL: member.user.avatarURL({ size: 4096, extension: 'png' }) as string
    })
    .setColor(13238363)
    .setThumbnail(member.user.avatarURL() as string)
    .setTimestamp()
    .addFields([
      { name: 'Username:', value: `<@${member.user.id}>`, inline: true },
      { name: '\u200B', value: `\u200B`, inline: true },
      {
        name: 'Joined Discord:',
        value: `${member.user.createdAt.toLocaleString()}\n **<t:${Number(
          member.user.createdAt.getTime() / 1000
        ).toFixed(0)}:R>**`,
        inline: true
      },
      {
        name: 'Inviter:',
        value: type === 'normal' ? `<@${invite?.inviter?.id}>` : `Custom Invite`,
        inline: true
      }
    ])
    .setFooter({
      text: `Made by _xB :3`,
      iconURL: (client.users.cache.get('333625171468353538') as User).avatarURL({
        size: 4096,
        extension: 'png'
      }) as string
    });

  return channel.send({ embeds: [userEmbed] });
});

client.on('ready', async () => {
  logger.info("Bot's Up!");

  client.user?.setPresence({
    status: config.status as PresenceStatusData
  });
  client.user?.setActivity(config.activity, { type: activityType });

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
      await command.execute(interaction, client);
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

client.on('debug', (m) => {
  logger.debug(m);
});
client.on('warn', (m) => {
  logger.warn(m);
});
client.on('error', (m) => {
  logger.error(m);
});

client.login(config.token);
