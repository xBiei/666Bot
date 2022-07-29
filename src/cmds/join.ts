import { joinVoiceChannel } from '@discordjs/voice';
import {
  CommandInteraction,
  GuildMember,
  InternalDiscordGatewayAdapterCreator,
  SlashCommandBuilder
} from 'discord.js';

module.exports.execute = async (interaction: CommandInteraction) => {
  if (!interaction.inGuild()) return await interaction.reply('This is Guild only Command!');
  const voiceChannel = (interaction.member as GuildMember).voice.channel;

  if (!voiceChannel)
    return await interaction.reply('You need to be in a channel to execute this command!');

  joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: interaction.channel?.guild
      .voiceAdapterCreator as InternalDiscordGatewayAdapterCreator
  });
  return await interaction.reply({content:'Coooming.', ephemeral: true});
};

module.exports.info = {
  name: 'join',
  slash: new SlashCommandBuilder().setName('join').setDescription('Join a voice channel.'),
  description: 'Join a voice channel',
  aliases: ['j', 'come', 'connect']
};
