import { ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { client } from '../index';
import { canModifyQueue } from '../structs/MusicQueue';

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

  queue.player.stop(true);

  if (interaction.replied)
    interaction
      .followUp({ content: `⏭️ Skipped by <@${interaction.user.id}>!` })
      .catch(console.error)
      .then((msg) => setTimeout(() => msg?.delete(), 5000));
  else
    interaction
      .reply({ content: `⏭️ Skipped by <@${interaction.user.id}>!` })
      .catch(console.error)
      .then((msg) => setTimeout(() => msg?.delete(), 5000));
};

module.exports.info = {
  name: 'skip',
  slash: new SlashCommandBuilder().setName('skip').setDescription('Skips the current song.'),
  description: 'Skips the current song.',
  cooldown: 1,
  permissions: [PermissionsBitField.Flags.SendMessages]
};
