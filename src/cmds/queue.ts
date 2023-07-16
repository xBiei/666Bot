import {
  ChatInputCommandInteraction,
  CommandInteraction,
  EmbedBuilder,
  MessageReaction,
  PermissionsBitField,
  SlashCommandBuilder,
  TextChannel,
  User
} from 'discord.js';
import { client } from '../index';
import { Song } from '../structs/Song';

module.exports.execute = async (interaction: ChatInputCommandInteraction) => {
  const queue = client.queues.get(interaction.guild!.id);
  if (!queue || !queue.songs.length)
    return interaction
      .reply({
        content: 'The Queue is empty, use /play command to add some stuff!',
        ephemeral: true
      })
      .catch(console.error);

  let currentPage = 0;
  const embeds = generateQueueEmbed(interaction, queue.songs);

  await interaction.reply('⏳ Loading queue...');

  if (interaction.replied)
    await interaction.editReply({
      content: `**Page - ${currentPage + 1}/${embeds.length}**`,
      embeds: [embeds[currentPage]]
    });

  const queueEmbed = await interaction.fetchReply();

  try {
    await queueEmbed.react('⬅️');
    await queueEmbed.react('⏹');
    await queueEmbed.react('➡️');
  } catch (error: any) {
    console.error(error);
    (interaction.channel as TextChannel).send(error.message).catch(console.error);
  }

  const filter = (reaction: MessageReaction, user: User) =>
    ['⬅️', '⏹', '➡️'].includes(reaction.emoji.name!) && interaction.user.id === user.id;

  const collector = queueEmbed.createReactionCollector({ filter, time: 900000 });

  collector.on('collect', async (reaction, user) => {
    try {
      if (reaction.emoji.name === '➡️') {
        if (currentPage < embeds.length - 1) {
          currentPage++;
          queueEmbed.edit({
            content: `**Page - ${currentPage + 1}/${embeds.length}**`,
            embeds: [embeds[currentPage]]
          });
        }
      } else if (reaction.emoji.name === '⬅️') {
        if (currentPage !== 0) {
          --currentPage;
          queueEmbed.edit({
            content: `**Page - ${currentPage + 1}/${embeds.length}**`,
            embeds: [embeds[currentPage]]
          });
        }
      } else {
        collector.stop();
        reaction.message.reactions.removeAll();
      }
      await reaction.users.remove(interaction.user.id);
    } catch (error: any) {
      console.error(error);
      return (interaction.channel as TextChannel).send(error.message).catch(console.error);
    }
  });
};

const generateQueueEmbed = (interaction: CommandInteraction, songs: Song[]) => {
  let embeds = [];
  let k = 10;

  for (let i = 0; i < songs.length; i += 10) {
    const current = songs.slice(i, k);
    let j = i;
    k += 10;

    const info = current.map((track) => `${++j} - [${track.title}](${track.url})`).join('\n');

    const embed = new EmbedBuilder()
      .setTitle('Current Queue')
      .setThumbnail(interaction.guild?.iconURL()!)
      .setColor('#f0e9e9')
      .setDescription(`**Current Song - [${songs[0].title}](${songs[0].url})**\n\n${info}`)
      .setTimestamp();
    embeds.push(embed);
  }

  return embeds;
};

module.exports.info = {
  name: 'queue',
  slash: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Sends the queue of the current player.'),
  description: 'Sends the queue of the current player.',
  permissions: [PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.ManageMessages],
  cooldown: 7
};
