import {
  CommandInteraction,
  CommandInteractionOptionResolver,
  ContextMenuCommandBuilder,
  EmbedBuilder,
  GuildMember,
  SlashCommandBuilder,
  User
} from 'discord.js';

module.exports.execute = async (interaction: CommandInteraction) => {
  const user = interaction.options.getUser('user') as User;
  const member = interaction.options.getMember('user') as GuildMember;
  const msg =
    !(interaction.options as CommandInteractionOptionResolver).getBoolean('send') || false;

  const userEmbed = new EmbedBuilder()
    .setColor(13238363)
    .setTimestamp()
    .setImage(
      interaction.options.get('server')
        ? member.avatarURL({ size: 2048 }) || user.avatarURL({ size: 2048 })
        : (user.avatarURL({ size: 2048 }) as string)
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
  context: new ContextMenuCommandBuilder().setName('Get Avatar').setType(2),
  description: "Get User's Avatar!",
  aliases: ['av', 'Get Avatar']
};
