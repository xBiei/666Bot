import { DiscordGatewayAdapterCreator, joinVoiceChannel } from '@discordjs/voice';
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
  TextChannel
} from 'discord.js';
import { client } from '../index';
import { MusicQueue } from '../structs/MusicQueue';
import { Playlist } from '../structs/Playlist';
import { Song } from '../structs/Song';

module.exports.execute = async (interaction: ChatInputCommandInteraction) => {
  let argSongName = interaction.options.getString('query', true);

  const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
  const { channel } = guildMember!.voice;

  const queue = client.queues.get(interaction.guild!.id);

  if (!channel)
    return interaction
      .reply({ content: "You're not in the channel, Troller!", ephemeral: true })
      .catch(console.error);

  if (queue && channel.id !== queue.connection.joinConfig.channelId)
    if (interaction.replied)
      return interaction
        .editReply({ content: "You're not in the channel, Troller!" })
        .catch(console.error);
    else
      return interaction
        .reply({
          content: "You're not in the channel, Troller!",
          ephemeral: true
        })
        .catch(console.error);

  let playlist: Playlist;

  try {
    playlist = await Playlist.from(argSongName!.split(' ')[0], argSongName!);
  } catch (error) {
    console.error(error);

    if (interaction.replied)
      return interaction
        .editReply({ content: 'Playlist not found, try another one!' })
        .catch(console.error);
    else
      return interaction
        .reply({ content: 'Playlist not found, try another one!', ephemeral: true })
        .catch(console.error);
  }

  if (queue) {
    queue.songs.push(...playlist.videos);
  } else {
    const newQueue = new MusicQueue({
      interaction,
      textChannel: interaction.channel! as TextChannel,
      connection: joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
      })
    });

    client.queues.set(interaction.guild!.id, newQueue);
    newQueue.songs.push(...playlist.videos);

    newQueue.enqueue(playlist.videos[0]);
  }

  let playlistEmbed = new EmbedBuilder()
    .setTitle(`Youtube Playlist - ${playlist.data.length} songs}`)
    .setDescription(
      playlist.videos
        .map((song: Song, index: number) => `${index + 1}. ${song.title}`)
        .join('\n')
        .slice(0, 4095)
    )
    .setURL(argSongName)
    .setColor('#f0e9e9')
    .setTimestamp();

  if (interaction.replied)
    return interaction
      .editReply({
        content: `⏯ Playlist started by <@${interaction.user.id}>!`,
        embeds: [playlistEmbed]
      })
      .then((msg) => setTimeout(() => msg!.delete(), 10000));
  interaction
    .reply({
      content: `⏯ Playlist started by <@${interaction.user.id}>!`,
      embeds: [playlistEmbed]
    })
    .catch(console.error)
    .then((msg) => setTimeout(() => msg!.delete(), 10000));
};

module.exports.info = {
  name: 'playlist',
  slash: new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('Plays music from a playlist.')
    .addStringOption((option) =>
      option.setName('query').setDescription('The link/text you want to play').setRequired(true)
    ),
  cooldown: 5,
  permissions: [
    PermissionsBitField.Flags.Connect,
    PermissionsBitField.Flags.Speak,
    PermissionsBitField.Flags.AddReactions,
    PermissionsBitField.Flags.ManageMessages
  ]
};
