import { ContextMenuCommandBuilder, SlashCommandBuilder } from '@discordjs/builders';
import {
  CommandInteraction,
  CommandInteractionOptionResolver,
  ContextMenuInteraction,
  GuildMember,
  MessageEmbed,
  User,
  UserContextMenuInteraction
} from 'discord.js';

module.exports.execute = async (
  interaction: CommandInteraction | UserContextMenuInteraction | ContextMenuInteraction
) => {
  if (!interaction.inGuild()) return interaction.reply('This is Guild only Command!');
  const user = interaction.options.getUser('user') as User;
  const member = interaction.guild?.members.cache.get(
    interaction.options.getUser('user')?.id as string
  ) as GuildMember;
  const msg =
    interaction instanceof UserContextMenuInteraction
      ? false
      : (interaction.options as CommandInteractionOptionResolver).getBoolean('ephemeral', true);

  const userEmbed = new MessageEmbed()
    .setAuthor({
      name: user.username,
      iconURL: user.avatarURL({ size: 4096, dynamic: true, format: 'png' }) as string
    })
    .setColor(13238363)
    .setThumbnail(user.avatarURL() as string)
    .setTimestamp()
    .addField('Username:', `<@${user.id}>`, true)
    .addField('\u200B', `\u200B`, true)
    .addField(
      'Joined Discord:',
      `${user.createdAt.toLocaleString()}\n **<t:${Number(user.createdAt.getTime() / 1000).toFixed(
        0
      )}:R>**`,
      true
    )
    .addField('ID:', `${user.id}`, true)
    .addField('\u200B', `\u200B`, true)
    .addField(
      'Joined Server:',
      `${member.joinedAt?.toLocaleString()}\n **<t:${Number(member.joinedTimestamp! / 1000).toFixed(
        0
      )}:R>**`,
      true
    )
    .setFooter({
      text: `Requested by ${interaction.member.user.username} :3`,
      iconURL: (interaction.member.user as User).avatarURL({
        size: 4096,
        dynamic: true,
        format: 'png'
      }) as string
    });

  return interaction.reply({ embeds: [userEmbed], ephemeral: msg });
};

module.exports.info = {
  name: 'info',
  slash: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Get info about the given user!')
    .addUserOption((option) =>
      option.setName('user').setDescription('The user to get info about.').setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName('ephemeral')
        .setDescription('Do you want to hide this message from the chat?.')
        .setRequired(true)
    ),
  context: new ContextMenuCommandBuilder().setName('Get Info').setType(2),
  description: 'Get info about the given user!',
  aliases: ['user', 'Get Info']
};
