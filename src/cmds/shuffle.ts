import { ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { canModifyQueue } from '../structs/TracksQueue';
import { client } from '../index';

module.exports.execute = (interaction: ChatInputCommandInteraction) => {
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

  const songs = queue.songs;

  for (let i = songs.length - 1; i > 1; i--) {
    const j = 1 + Math.floor(Math.random() * i);
    [songs[i], songs[j]] = [songs[j], songs[i]];
  }

  queue.songs = songs;

  const content = { content: `🔀 Queue is shuffled by <@${interaction.user.id}>!` };

  if (interaction.replied)
    interaction
      .followUp(content)
      .catch(console.error)
      .then((msg) => setTimeout(() => msg?.delete().catch(console.error), 5000))
      .catch(console.error);
  else
    interaction
      .reply(content)
      .catch(console.error)
      .then((msg) => setTimeout(() => msg?.delete().catch(console.error), 5000))
      .catch(console.error);
};

module.exports.info = {
  name: 'shuffle',
  slash: new SlashCommandBuilder().setName('shuffle').setDescription('shuffles the Queue.'),
  description: 'shuffles the Queue.',
  cooldown: 1,
  permissions: [PermissionsBitField.Flags.SendMessages]
};
