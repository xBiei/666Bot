import { ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { client } from '../index';
import { canModifyQueue } from '../structs/MusicQueue';

module.exports.execute = async (interaction: ChatInputCommandInteraction) => {
  const queue = client.queues.get(interaction.guild!.id);
  const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
  const volumeArg = interaction.options.getNumber('volume');

  if (!queue)
    return interaction
      .reply({
        content: 'The Queue is empty, use /play command to add some stuff!',
        ephemeral: true
      })
      .catch(console.error);

  if (!canModifyQueue(guildMember!))
    return interaction
      .reply({ content: "You're not in the channel, Troller!", ephemeral: true })
      .catch(console.error);

  if (!volumeArg || volumeArg === queue.volume)
    return interaction
      .reply({ content: `🔊 The current volume is: **%${queue.volume}%**` })
      .catch(console.error);

  if (isNaN(volumeArg))
    return interaction
      .reply({ content: 'You gotta use a number mate.', ephemeral: true })
      .catch(console.error);

  if (Number(volumeArg) > 100 || Number(volumeArg) < 0)
    return interaction
      .reply({ content: 'You gotta use a number between 0 <=> 100', ephemeral: true })
      .catch(console.error);

  queue.volume = volumeArg;
  queue.resource.volume?.setVolumeLogarithmic(volumeArg / 100);

  return interaction
    .reply({ content: `Volume set to %${volumeArg}`, ephemeral: true })
    .catch(console.error)
    .then((msg) => setTimeout(() => msg?.delete(), 5000))
    .catch(console.error);
};

module.exports.info = {
  name: 'volume',
  slash: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Changes Volume.')
    .addNumberOption((option) =>
      option.setName('volume').setDescription('amount.').setRequired(true)
    ),
  description: 'Changes Volume.',
  cooldown: 1,
  permissions: [PermissionsBitField.Flags.SendMessages]
};
