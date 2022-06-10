import { SlashCommandBuilder } from '@discordjs/builders';
import {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  getVoiceConnection,
  NoSubscriberBehavior
} from '@discordjs/voice';
import { CommandInteraction, GuildMember, InternalDiscordGatewayAdapterCreator } from 'discord.js';
import { validate, video_basic_info, stream } from 'play-dl';
import { QueueObject } from '..';

module.exports.execute = async (interaction: CommandInteraction, musicQueue: QueueObject) => {
  if (!interaction.inGuild()) return await interaction.reply('This is Guild only Command!');
  const voiceChannel = (interaction.member as GuildMember).voice.channel;
  let connection = getVoiceConnection(interaction.guildId);
  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause
    }
  });
  const url = interaction.options.getString('url') as string;
  const video = await stream(url);
  let info: { title?: string; type: string };
  let title: string | undefined;
  if (!voiceChannel)
    return await interaction.reply('You need to be in a channel to execute this command!');

  if (!connection) {
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: interaction.channel?.guild
        .voiceAdapterCreator as InternalDiscordGatewayAdapterCreator
    });
  }

  if ((await validate(url)) !== 'yt_video') return await interaction.reply('not legit YT url.');

  await video_basic_info(url).then((e) => {
    info = { title: e.video_details.title, type: e.video_details.type };
    title = e.video_details.title;
  });

  var resource = createAudioResource(video.stream, {
    inlineVolume: true,
    inputType: video.type
  });

  resource.volume?.setVolume(Number(process.env.volume));
  player.play(resource);
  connection.subscribe(player);

  player.on('error', (err) => console.error(err));

  return await interaction.reply(`Playing: **[${title}]**`);
};

module.exports.info = {
  name: 'play',
  slash: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays music from a link.')
    .addStringOption((option) =>
      option.setName('url').setDescription('music URL from YT').setRequired(true)
    ),
  group: 'voice',
  description: 'Plays music from a link.',
  aliases: ['p', 'song', 'start']
};
