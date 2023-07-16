import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { canModifyQueue } from '../structs/MusicQueue';
import { client } from '../index';

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
};

module.exports.info = {
  name: 'leave',
  slash: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave the current voice channel!'),
  description: 'Leave the current voice channel!'
};
