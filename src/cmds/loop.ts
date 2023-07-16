import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { canModifyQueue } from '../structs/MusicQueue';
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

  queue.loop = !queue.loop;

  const content = {
    content: `🔁 Queue is ${queue.loop ? `unlooped` : `looped`} by <@${interaction.user.id}>!`
  };

  if (interaction.replied) interaction.followUp(content).catch(console.error);
  else interaction.reply(content).catch(console.error);
};

module.exports.info = {
  name: 'loop',
  slash: new SlashCommandBuilder().setName('loop').setDescription('Loops the Queue.'),
  description: 'Loops the Queue.',
  cooldown: 1
};
