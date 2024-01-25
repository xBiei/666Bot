import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder
} from 'discord.js';
import { client } from '../index';

module.exports.execute = async (interaction: ChatInputCommandInteraction) => {
  const commands = client.slashCommandsMap;
  const helpEmbed = new EmbedBuilder()
    .setTitle('Commands List')
    .setDescription(`a List of all the available commands.`)
    .setColor('#f0e9e9');

  commands.forEach((cmd) => {
    helpEmbed.addFields({
      name: `**${cmd.info.name}**`,
      value: `${cmd.info.description}`,
      inline: true
    });
  });

  helpEmbed.setTimestamp();

  return interaction
    .reply({ embeds: [helpEmbed] })
    .catch(console.error)
    .then((msg) => setTimeout(() => msg?.delete().catch(console.error), 10000))
    .catch(console.error);
};

module.exports.info = {
  name: 'help',
  slash: new SlashCommandBuilder().setName('help').setDescription('Sends the help embed.'),
  description: 'Sends the help embed.',
  cooldown: 1,
  permissions: [PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.SendMessages]
};
