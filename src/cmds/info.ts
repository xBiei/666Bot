import {
  GuildMember,
  EmbedBuilder,
  SlashCommandBuilder,
  ChatInputCommandInteraction
} from 'discord.js';

module.exports.execute = async (interaction: ChatInputCommandInteraction) => {
  if (!interaction.inGuild()) return interaction.reply('This is Guild only Command!');

  const user = interaction.options.getUser('user', true);
  const member = interaction.options.getMember('user') as GuildMember;
  const msg = !interaction.options.getBoolean('send', true);

  const userEmbed = new EmbedBuilder()
    .setAuthor({
      name: user.username,
      iconURL: user.displayAvatarURL({ size: 2048 })
    })
    .setColor(13238363)
    .setThumbnail(member.displayAvatarURL({ size: 2048 }))
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
      iconURL: user.displayAvatarURL({
        size: 4096,
        extension: 'png'
      })
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
      option.setName('send').setDescription('Do you want to send this message?.').setRequired(true)
    ),
  description: 'Get info about the given user!'
};
