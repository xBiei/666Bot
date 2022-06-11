// Made for Mz
import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CommandInteraction,
  GuildMember,
  GuildMemberRoleManager,
  MessageEmbed,
  TextChannel,
  Util
} from 'discord.js';

module.exports.execute = async (interaction: CommandInteraction) => {
  if (!interaction.guild?.me?.permissionsIn(interaction.channel as TextChannel).has('EMBED_LINKS'))
    return interaction.reply({
      content: 'I need the `Embed Links` permission to use this command.',
      ephemeral: true
    });
  if (
    !(interaction.member?.roles as GuildMemberRoleManager).cache.has('984588938268270612') &&
    !(interaction.member as GuildMember)
      ?.permissionsIn(interaction.channel as TextChannel)
      .has('ADMINISTRATOR')
  )
    return interaction.reply({
      content: 'You need to have <@&984588938268270612> to use this command.',
      ephemeral: true
    });
  const snippet = interaction.options.getString('snippet', true);
  const description = interaction.options.getString('description', true);
  const framework = interaction.options.getString('framework', true);
  const version = interaction.options.getString('version');
  const author = interaction.options.getString('author');

  const userEmbed = new MessageEmbed()
    .setColor(13238363)
    .setTimestamp()
    .setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL() as string })
    .setFooter({
      text: `Meow :3`
    });

  Util.splitMessage(snippet, { maxLength: 1015, append: '', prepend: '', char: ' ' }).forEach(
    (msg, i) => {
      userEmbed.addField(`${i == 0 ? 'Snippet:' : '\u200B'}`, `\`\`\`${msg}\`\`\``, false);
    }
  );

  return interaction.channel
    ?.send({
      embeds: [
        userEmbed
          .addField('Description:', `${description}`, true)
          .addField('Framework:', `${framework}`, true)
          .addField(`Version:`, `${version}`, true)
          .addField(`Made By:`, `${author}`, true)
      ]
    })
    .then(async () => await interaction.reply({ content: 'Snippet Sent!', ephemeral: true }))
    .catch((err) => console.log(err));
};

module.exports.info = {
  name: 'snippet',
  slash: new SlashCommandBuilder()
    .setName('snippet')
    .setDescription('Send a snippet to codes channel!')
    .addStringOption((option) =>
      option.setName('description').setDescription('Describe your snippet.').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('snippet').setDescription('The snippet you wanna send.').setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('framework')
        .setDescription('The Framework/Lang your snippet uses.')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('version')
        .setDescription('The version of the Framework/Lang.')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('author')
        .setDescription('If this is copied, put the original author name here.')
        .setRequired(true)
    ),
  description: 'Send a snippet to codes channel!',
  aliases: ['code']
};
