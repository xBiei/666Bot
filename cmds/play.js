const {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  getVoiceConnection,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core");

module.exports.run = async (client, msg, cmd, args, Discord) => {
  const voiceChannel = msg.member.voice.channel;
  let connection = getVoiceConnection(msg.guildId);
  const player = createAudioPlayer();
  const url = args[1];
  console.log(args);
  if (!voiceChannel)
    return msg.channel.send(
      "You need to be in a channel to execute this command!",
    );

  if (!connection) {
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: msg.channel.guild.voiceAdapterCreator,
    });
  }

  if (!url) return msg.reply("Bruh, u forgot the url.");

  if (!url.match("^https://...*") || !url.match("^https://...*"))
    return msg.reply("not legit http/s url.");

  const stream = await ytdl(url, { filter: "audioonly" });
  const videoName = await ytdl.getInfo(url)
  var resource = createAudioResource(stream, { inlineVolume: true });

  resource.volume.setVolume(process.env.volume);
  player.play(resource);
  connection.subscribe(player);
  return msg.reply('Playing: **['+videoName.player_response.videoDetails.title+']**')
};

module.exports.help = {
  name: "play",
  aliases: ["p", "song", "start"],
};
