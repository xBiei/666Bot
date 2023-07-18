import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder
} from 'discord.js';

module.exports.execute = async (interaction: ChatInputCommandInteraction) => {
  const inviteEmbed = new EmbedBuilder()
    .setTitle('You gotta add me to your server pweaase pweaaseee! >﹏< ')
    .setColor('#f0e9e9');

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('Add me to your server!')
      .setStyle(ButtonStyle.Link)
      .setURL(
        `https://discord.com/api/oauth2/authorize?client_id=${
          interaction.client.user!.id
        }&permissions=19760832566&scope=bot%20applications.commands`
      )
  );

  return interaction.reply({ embeds: [inviteEmbed], components: [actionRow] }).catch(console.error);
};

module.exports.info = {
  name: 'invite',
  slash: new SlashCommandBuilder().setName('invite').setDescription('Sends invite link.'),
  description: 'Sends invite link.',
  cooldown: 1,
  permissions: [PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.SendMessages]
};
