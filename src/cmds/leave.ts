import { ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
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

  if (interaction.replied)
    interaction
      .followUp({ content: `⏹️ Queue stopped By ${interaction.user.id}` })
      .catch(console.error)
      .then((msg) => setTimeout(() => msg!.delete(), 5000));
  else
    interaction
      .reply({ content: `⏹️ Queue stopped By ${interaction.user.id}` })
      .catch(console.error)
      .then((msg) => setTimeout(() => msg!.delete(), 5000));
};

module.exports.info = {
  name: 'leave',
  slash: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave the current voice channel!'),
  description: 'Leave the current voice channel!',
  cooldown: 1,
  permissions: [PermissionsBitField.Flags.SendMessages]
};
