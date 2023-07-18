import { ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { client } from '../index';
import { canModifyQueue } from '../structs/MusicQueue';

module.exports.execute = async (interaction: ChatInputCommandInteraction) => {
  const queue = client.queues.get(interaction.guild!.id);
  const playlistSlotArg = interaction.options.getInteger('number', true);
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

  if (playlistSlotArg > queue.songs.length)
    return interaction
      .reply({ content: `The queue is only ${queue.songs.length} long.`, ephemeral: true })
      .catch(console.error);

  if (queue.loop) {
    for (let i = 0; i < playlistSlotArg - 2; i++) {
      queue.songs.push(queue.songs.shift()!);
    }
  } else {
    queue.songs = queue.songs.slice(playlistSlotArg - 2);
  }

  queue.player.stop();

  if (interaction.replied)
    interaction
      .followUp({ content: `⏭️ Skipped by <@${interaction.user.id}>!` })
      .catch(console.error)
      .then((msg) => setTimeout(() => msg?.delete(), 5000))
      .catch(console.error);
  else
    interaction
      .reply({ content: `⏭️ Skipped by <@${interaction.user.id}>!` })
      .catch(console.error)
      .then((msg) => setTimeout(() => msg?.delete(), 5000))
      .catch(console.error);
};

module.exports.info = {
  name: 'skipto',
  slash: new SlashCommandBuilder()
    .setName('skipto')
    .setDescription('Skips to a song in the queue.')
    .addIntegerOption((option) =>
      option
        .setName('number')
        .setDescription('The number of the desired song in the queue')
        .setRequired(true)
    ),
  description: 'Skips to a song in the queue.',
  cooldown: 1,
  permissions: [PermissionsBitField.Flags.SendMessages]
};
