const { getVoiceConnection } = require("@discordjs/voice");

module.exports.run = async (client, msg, cmd, args, Discord) => {
  const connection = getVoiceConnection(msg.guildId);
  const voiceChannel = msg.member.voice.channel;

  if (!voiceChannel)
    return msg.channel.send(
      "You need to be in a channel to execute this command!",
    );

  connection.destroy();
  msg.reply(`Bye bb.`);
};

module.exports.help = {
  name: "leave",
  aliases: ["l", "go", "disconnect", "fuckoff", "bye"],
};
