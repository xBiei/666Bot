import {
  Client,
  ContextMenuCommandBuilder,
  EmbedBuilder,
  GatewayIntentBits,
  Interaction,
  Message,
  SlashCommandBuilder,
  TextChannel,
  User
} from 'discord.js';
import logger from './utils/logger';
import InvitesTracker from '@androz2091/discord-invites-tracker';
import { CustomClient } from './structs/CustomClient';

export interface CommandData {
  run: (msg?: Message, args?: string[], client?: Client) => Promise<void>;
  execute: (interaction?: Interaction, client?: CustomClient) => Promise<void>;
  info: {
    slash: SlashCommandBuilder;
    context?: ContextMenuCommandBuilder;
    name: string;
    group?: string;
    description: string;
    aliases?: string[]; // todo: remove this
    permissions?: string[];
    cooldown?: number;
  };
}

export const client = new CustomClient(
  new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages
    ]
  })
);

// todo: Fix this
// const tracker = InvitesTracker.init(client, {
//   fetchGuilds: true,
//   fetchVanity: true,
//   fetchAuditLogs: true,
//   activeGuilds: ['913917739079446569', '334000744405663754']
// });

// tracker.on('guildMemberAdd', (member, type, invite) => {
//   logger.info('type', type);
//   logger.info('invite', invite);
//   logger.info('member', member);

//   const channel =
//     invite?.guildId === '913917739079446569'
//       ? (client.channels.cache.get('1019742148976984094') as TextChannel)
//       : (client.channels.cache.get('1003222789198712842') as TextChannel);

//   const userEmbed = new EmbedBuilder()
//     .setAuthor({
//       name: member.user.username,
//       iconURL: member.user.avatarURL({ size: 4096, extension: 'png' }) as string
//     })
//     .setColor(13238363)
//     .setThumbnail(member.user.avatarURL() as string)
//     .setTimestamp()
//     .addFields([
//       { name: 'Username:', value: `<@${member.user.id}>`, inline: true },
//       { name: '\u200B', value: `\u200B`, inline: true },
//       {
//         name: 'Joined Discord:',
//         value: `${member.user.createdAt.toLocaleString()}\n **<t:${Number(
//           member.user.createdAt.getTime() / 1000
//         ).toFixed(0)}:R>**`,
//         inline: true
//       },
//       {
//         name: 'Inviter:',
//         value: `<@${invite?.inviter?.id}>`,
//         inline: true
//       }
//     ])
//     .setFooter({
//       text: `Made by @.xb. :3`,
//       iconURL: (client.users.cache.get('333625171468353538') as User).avatarURL({
//         size: 4096,
//         extension: 'png'
//       }) as string
//     });

//   return channel.send({ embeds: [userEmbed] });
// });
