import { DiscordGatewayAdapterCreator, joinVoiceChannel } from '@discordjs/voice';
import {
  ChatInputCommandInteraction,
  PermissionsBitField,
  SlashCommandBuilder,
  TextChannel
} from 'discord.js';
import { client } from '../index';
import { TracksQueue } from '../structs/TracksQueue';
import { Song } from '../structs/Song';
import { validate } from 'play-dl';

module.exports.execute = async (interaction: ChatInputCommandInteraction, input: string) => {
  let songArg = interaction.options.getString('query');
  if (!songArg) songArg = input;

  const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
  const { channel } = guildMember!.voice;

  if (!channel)
    return interaction
      .reply({ content: "You're not in the channel, Troller!", ephemeral: true })
      .catch(console.error);

  if (!channel.joinable)
    return interaction
      .reply({ content: "I don't have permission to join your VC", ephemeral: true })
      .catch(console.error);

  const queue = client.queues.get(interaction.guild!.id);

  if (queue && channel.id !== queue.connection.joinConfig.channelId)
    return interaction
      .reply({
        content: "You're not in the channel, Troller!",
        ephemeral: true
      })
      .catch(console.error);

  if (!songArg)
    return interaction
      .reply({
        content: 'You gotta use a YT/Spotify/Soundcloud URL or a text to search',
        ephemeral: true
      })
      .catch(console.error);

  const url = songArg;

  if (interaction.replied)
    await interaction
      .editReply('⏳ Loading...')
      .catch()
      .then((msg) => setTimeout(() => msg?.delete().catch(console.error), 5000))
      .catch(console.error);
  else
    await interaction
      .reply('⏳ Loading...')
      .catch()
      .then((msg) => setTimeout(() => msg?.delete().catch(console.error), 5000))
      .catch(console.error);

  // Start the playlist if playlist url was provided
  if ((await validate(url)) === 'yt_playlist') {
    await interaction.editReply('🔗 Link is playlist').catch(console.error);

    return client.slashCommandsMap.get('playlist')!.execute(interaction);
  }

  let song;

  try {
    song = await Song.from(url, url);
  } catch (error: any) {
    if (error.name == 'NoResults')
      return interaction
        .reply({ content: `No Video found for this url <${url}>`, ephemeral: true })
        .catch(console.error);
    if (error.name == 'InvalidURL')
      return interaction
        .reply({ content: `Smth wrong with this url <${url}>`, ephemeral: true })
        .catch(console.error);

    console.error(error);
    // if (interaction.replied)
    //   return await interaction
    //     .editReply({
    //       content: `Error running this command. Idk why, but there's an error; Contact me @.xb.`
    //     })
    //     .catch(console.error)
    //     .then((msg) => setTimeout(() => msg?.delete().catch(console.error), 5000))
    //     .catch(console.error);
    // else
    //   return interaction
    //     .reply({
    //       content: `Error running this command. Idk why, but there's an error; Contact me @.xb.`,
    //       ephemeral: true
    //     })
    //     .catch(console.error)
    //     .then((msg) => setTimeout(() => msg?.delete().catch(console.error), 5000))
    //     .catch(console.error);
  }

  if (queue) {
    queue.enqueue(song!);

    return (interaction.channel as TextChannel)
      .send({
        content: `✅ **${song!.title}** has been added to the queue by <@${interaction.user.id}>`
      })
      .catch(console.error)
      .then((msg) => setTimeout(() => msg?.delete().catch(console.error), 5000))
      .catch(console.error);
  }

  const newQueue = new TracksQueue({
    interaction,
    textChannel: interaction.channel! as TextChannel,
    connection: joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
    })
  });

  client.queues.set(interaction.guild!.id, newQueue);

  newQueue.enqueue(song!);
  interaction.deleteReply().catch(console.error);
};

module.exports.info = {
  name: 'play',
  slash: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays a track from a link.')
    .addStringOption((option) =>
      option.setName('query').setDescription('The link/text you want to play').setRequired(true)
    ),
  cooldown: 3,
  permissions: [
    PermissionsBitField.Flags.Connect,
    PermissionsBitField.Flags.Speak,
    PermissionsBitField.Flags.AddReactions,
    PermissionsBitField.Flags.ManageMessages,
    PermissionsBitField.Flags.SendMessages
  ]
};
