import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder
} from 'discord.js';
import { splitBar } from 'string-progressbar';
import { client } from '../index';

module.exports.execute = async (interaction: ChatInputCommandInteraction) => {
  const queue = client.queues.get(interaction.guild!.id);

  if (!queue || !queue.songs.length)
    return interaction
      .reply({
        content: 'The Queue is empty, use /play command to add some stuff!',
        ephemeral: true
      })
      .catch(console.error);

  const song = queue.songs[0];
  const seek = queue.resource.playbackDuration / 1000;
  const left = song.duration - seek;

  let nowPlaying = new EmbedBuilder()
    .setTitle('Now Playing')
    .setDescription(`${song.title}\n${song.url}`)
    .setColor('#f0e9e9');

  if (song.duration > 0) {
    nowPlaying.addFields({
      name: '\u200b',
      value:
        new Date(seek * 1000).toISOString().substr(11, 8) +
        '[' +
        splitBar(song.duration == 0 ? seek : song.duration, seek, 20)[0] +
        ']' +
        (song.duration == 0
          ? ' ◉ LIVE'
          : new Date(song.duration * 1000).toISOString().substr(11, 8)),
      inline: false
    });

    nowPlaying.setFooter({
      text: `Time Remaining: ${new Date(left * 1000).toISOString().substr(11, 8)}`
    });
  }

  return interaction
    .reply({ embeds: [nowPlaying] })
    .then((msg) => setTimeout(() => msg!.delete(), 5000));
};

module.exports.info = {
  name: 'nowplaying',
  slash: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Sends the status of the current player.'),
  description: 'Sends the status of the current player.',
  cooldown: 1,
  permissions: [PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.SendMessages]
};
