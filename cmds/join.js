const { joinVoiceChannel } = require('@discordjs/voice');

module.exports.run = async (client, msg, cmd, args, Discord) => {
  const voiceChannel = msg.member.voice.channel;

  if (!voiceChannel)
    return msg.channel.send('You need to be in a channel to execute this command!');

  joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: msg.channel.guild.voiceAdapterCreator
  });
  return msg.reply('Coooming.');
};

module.exports.help = {
  name: 'join',
  aliases: ['j', 'come', 'connect']
};
