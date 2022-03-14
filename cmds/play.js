const {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  getVoiceConnection,
  AudioPlayerStatus,
  NoSubscriberBehavior
} = require('@discordjs/voice');
const { stream, video_info } = require('play-dl');

module.exports.run = async (client, msg, cmd, args, Discord) => {
  const voiceChannel = msg.member.voice.channel;
  let connection = getVoiceConnection(msg.guildId);
  const player = createAudioPlayer();
  const url = args[1];

  if (!voiceChannel)
    return msg.channel.send('You need to be in a channel to execute this command!');

  if (!connection) {
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: msg.channel.guild.voiceAdapterCreator
    });
  }

  if (!url) return msg.reply('Bruh, u forgot the url.');

  if (!url.match('^https://...*') || !url.match('^https://...*'))
    return msg.reply('not legit http/s url.');

  const song = await stream(url);
  const videoName = await video_info(url);
  var resource = createAudioResource(song.stream, {
    inlineVolume: true,
    inputType: song.type,
    noSubscriber: NoSubscriberBehavior.Pause
  });

  resource.volume.setVolume(process.env.volume);
  player.play(resource);
  connection.subscribe(player);

  player.on(AudioPlayerStatus.Idle, () => {
    msg.guild.me.setNickname('ム.');
  });
  player.on(AudioPlayerStatus.Playing, () => {
    msg.guild.me.setNickname('ム. (Playing)');
  });
  player.on(AudioPlayerStatus.AutoPaused, () => {
    msg.guild.me.setNickname('ム. (Paused)');
  });
  player.on(AudioPlayerStatus.Paused, () => {
    msg.guild.me.setNickname('ム. (Paused)');
  });
  player.on('error', (err) => console.error(err));

  return msg.reply(`Playing: **[${videoName.video_details.title}]**`);
};

module.exports.help = {
  name: 'play',
  aliases: ['p', 'song', 'start']
};
