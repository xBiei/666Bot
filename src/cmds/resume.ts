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

  if (!canModifyQueue(guildMember!))
    return interaction
      .reply({ content: "You're not in the channel, Troller!", ephemeral: true })
      .catch(console.error);

  if (queue.player.unpause()) {
    const content = {
      content: `⏯ Resumed by <@${interaction.user.id}>!`
    };

    if (interaction.replied)
      interaction
        .followUp(content)
        .catch(console.error)
        .then((msg) => setTimeout(() => msg?.delete(), 5000))
        .catch(console.error);
    else
      interaction
        .reply(content)
        .catch(console.error)
        .then((msg) => setTimeout(() => msg?.delete(), 5000))
        .catch(console.error);

    return true;
  }

  const content = { content: "The player isn't Paused", ephemeral: true };

  if (interaction.replied)
    interaction
      .followUp(content)
      .catch(console.error)
      .then((msg) => setTimeout(() => msg?.delete(), 5000))
      .catch(console.error);
  else
    interaction
      .reply(content)
      .catch(console.error)
      .then((msg) => setTimeout(() => msg?.delete(), 5000))
      .catch(console.error);
  return false;
};

module.exports.info = {
  name: 'resume',
  slash: new SlashCommandBuilder().setName('resume').setDescription('Resumes Player.'),
  description: 'Resumes Player.',
  cooldown: 1,
  permissions: [PermissionsBitField.Flags.SendMessages]
};
