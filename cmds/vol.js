const { getVoiceConnection } = require("@discordjs/voice");

module.exports.run = async (client, msg, cmd, args) => {
  let connection = getVoiceConnection(msg.guildId);

  if (!args[1])
    return msg.reply(`Did u expect me to read your mind? gimme the vol u want`);

  if (isNaN(args[1]) || args[1] > 100) {
    return msg.reply("Vol can be set between **`1`** - **`100`**");
  } else {
    process.env.volume = args[1] / 100;
    connection._state.subscription.player._state.resource.volume.volume =
      process.env.volume;
    msg.reply(`Done ya bb, vol is **\`${args[1]}%\`**.`);
  }
};

module.exports.help = {
  name: "vol",
  aliases: ["v", "volume", "sound"],
};
