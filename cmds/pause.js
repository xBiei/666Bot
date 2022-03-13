const { getVoiceConnection } = require("@discordjs/voice");
module.exports.run = async (client, msg, cmd, args, Discord) => {
  const voiceChannel = msg.member.voice.channel;
  let connection = getVoiceConnection(msg.guildId);
  if (!voiceChannel)
    return msg.channel.send(
      "You need to be in a channel to execute this command!",
    );
  if (!connection) return msg.channel.send("I'm not connected to your vc!");
  connection._state.subscription.player.pause();
};

module.exports.help = {
  name: "pause",
  aliases: ["pp"],
};
