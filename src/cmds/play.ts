import {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  getVoiceConnection,
  NoSubscriberBehavior
} from '@discordjs/voice';
import {
  CommandInteraction,
  GuildMember,
  InternalDiscordGatewayAdapterCreator,
  SlashCommandBuilder
} from 'discord.js';
import {
  validate,
  video_basic_info,
  stream,
  search,
  spotify,
  is_expired,
  refreshToken
} from 'play-dl';
import logger from '../utils/logger';
import * as config from '../config.json';

module.exports.execute = async (interaction: CommandInteraction) => {
  if (!interaction.inGuild()) return await interaction.reply('This is Guild only Command!');
  if (!interaction.isChatInputCommand()) return;
  if (is_expired()) await refreshToken();

  const voiceChannel = (interaction.member as GuildMember).voice.channel;
  let connection = getVoiceConnection(interaction.guildId);
  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause
    }
  });
  let url = interaction.options.getString('url') as string;
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

  if ((await validate(url)) === 'yt_video') {
    await video_basic_info(url).then((e) => {
      info = { title: e.video_details.title, type: e.video_details.type };
      title = e.video_details.title;
    });
  } else if ((await validate(url)) === 'sp_track') {
    await spotify(url)
      .then((e) => {
        info = { title: e.name, type: e.type };
        title = e.name;
      })
      .then(async () => {
        if (title) await search(title).then((e) => (url = e[0].url));
        else return await interaction.reply('Could not find the song. Use a YT link instead.');
      })
      .then(async () => {
        if ((await validate(url)) === 'yt_video')
          await video_basic_info(url).then((e) => {
            info = { title: e.video_details.title, type: e.video_details.type };
            title = e.video_details.title;
          });
        else return await interaction.reply('Could not find the song. Use a YT link instead.');
      });
  } else return await interaction.reply('Could not find the song. Use a YT link instead.');

  const video = await stream(url);

  var resource = createAudioResource(video.stream, {
    inlineVolume: true,
    inputType: video.type
  });

  resource.volume?.setVolume(Number(config.volume));
  player.play(resource);
  connection.subscribe(player);

  player.on('error', (err) => logger.error(err));

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
