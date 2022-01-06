const { joinVoiceChannel } = require('@discordjs/voice');
module.exports = {
	name: 'join',
	description: 'Joins and plays a video from youtube',
	execute: async (client, msg, Discord) => {
		const voiceChannel = msg.member.voice.channel;
		if (!voiceChannel) return msg.channel.send('You need to be in a channel to execute this command!');
		joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guild.id,
			adapterCreator: msg.channel.guild.voiceAdapterCreator,
		});
	},
};
