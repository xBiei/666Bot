import {
  CommandInteraction,
  CommandInteractionOptionResolver,
  ContextMenuCommandBuilder,
  GuildMember,
  EmbedBuilder,
  SlashCommandBuilder,
  User,
  Guild
} from 'discord.js';

module.exports.execute = async (interaction: CommandInteraction) => {
  if (!interaction.inGuild()) return interaction.reply('This is Guild only Command!');

  const user = (await interaction.options.getUser('user')?.fetch()) as User;
  const member = (interaction.guild as Guild).members.cache.get(
    interaction.options.getUser('user')?.id as string
  ) as GuildMember;
  const msg =
    !(interaction.options as CommandInteractionOptionResolver).getBoolean('send') || false;

  const userEmbed = new EmbedBuilder()
    .setAuthor({
      name: user.username,
      iconURL: user.avatarURL({ size: 2048 }) as string
    })
    .setColor(13238363)
    .setThumbnail(user.avatarURL({ size: 2048 }) as string)
    .setTimestamp()
    .addFields([
      { name: 'Username:', value: `<@${user.id}>`, inline: true },
      { name: '\u200B', value: `\u200B`, inline: true },
      {
        name: 'Joined Discord:',
        value: `${user.createdAt.toLocaleString()}\n **<t:${Number(
          user.createdAt.getTime() / 1000
        ).toFixed(0)}:R>**`,
        inline: true
      },
      {
        name: 'Joined Server:',
        value: member
          ? `${member.joinedAt?.toLocaleString()}\n **<t:${Number(
              member.joinedTimestamp! / 1000
            ).toFixed(0)}:R>**`
          : `User is not in this server!`,
        inline: false
      }
    ])
    .setImage(
      user.banner ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}?size=2048` : null
    )
    .setFooter({
      text: `Requested by ${interaction.member.user.username} :3`,
      iconURL: (interaction.member.user as User).avatarURL({
        size: 4096,
        extension: 'png'
      }) as string
    });

  return await interaction.reply({ embeds: [userEmbed], ephemeral: msg });
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
        .setName('send')
        .setDescription('Do you want to hide this message from the chat?.')
        .setRequired(true)
    ),
  context: new ContextMenuCommandBuilder().setName('Get Info').setType(2),
  description: 'Get info about the given user!',
  aliases: ['user', 'Get Info']
};
