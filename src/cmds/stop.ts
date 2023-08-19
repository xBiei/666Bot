import { ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { client } from '../index';
import { canModifyQueue } from '../structs/TracksQueue';

module.exports.execute = async (interaction: ChatInputCommandInteraction) => {
  const queue = client.queues.get(interaction.guild!.id);
  const guildMember = interaction.guild!.members.cache.get(interaction.user.id);

  if (!queue)
    return interaction
      .reply({
        content: 'The Queue is empty, use /play command to add some stuff!',
        ephemeral: true
      })
      .catch(console.error);

  if (!guildMember || !canModifyQueue(guildMember))
    return interaction
      .reply({ content: "You're not in the channel, Troller!", ephemeral: true })
      .catch(console.error);

  queue.stop();

  if (interaction.replied)
    interaction
      .followUp({ content: `⏯ Stopped by <@${interaction.user.id}>!` })
      .catch(console.error)
      .then((msg) => setTimeout(() => msg?.delete(), 5000))
      .catch(console.error);
  else
    interaction
      .reply({ content: `⏯ Stopped by <@${interaction.user.id}>!` })
      .catch(console.error)
      .then((msg) => setTimeout(() => msg?.delete(), 5000))
      .catch(console.error);
};

module.exports.info = {
  name: 'stop',
  slash: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stops the player and clear the queue.'),
  description: 'Stops the player and clear the queue.',
  cooldown: 1,
  permissions: [PermissionsBitField.Flags.SendMessages]
};
