import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  PermissionsBitField,
  SlashCommandBuilder
} from 'discord.js';

module.exports.execute = async (interaction: ChatInputCommandInteraction) => {
  const user = interaction.options.getUser('user', true);
  const member = interaction.options.getMember('user') as GuildMember;
  const server = interaction.options.getBoolean('server', true);
  const msg = !interaction.options.getBoolean('send', true);

  const userEmbed = new EmbedBuilder()
    .setColor(13238363)
    .setTimestamp()
    .setImage(
      server
        ? member.displayAvatarURL({ size: 2048 })
        : (user.displayAvatarURL({ size: 2048 }) as string)
    )
    .setFooter({
      text: `Meow :3`
    });

  return await interaction.reply({ embeds: [userEmbed], ephemeral: msg });
};

module.exports.info = {
  name: 'avatar',
  slash: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription("Get User's Avatar!")
    .addUserOption((option) =>
      option.setName('user').setDescription('The user to get avatar.').setRequired(true)
    )
    .addBooleanOption((option) =>
      option.setName('server').setDescription('Do you want the server avatar?.').setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName('send')
        .setDescription('Do you want to send this message to the chat?.')
        .setRequired(true)
    ),
  description: "Get User's Avatar!",
  permissions: [PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.SendMessages]
};
