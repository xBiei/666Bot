import { SlashCommandBuilder } from '@discordjs/builders';
import { joinVoiceChannel } from '@discordjs/voice';
import { CommandInteraction, GuildMember, InternalDiscordGatewayAdapterCreator } from 'discord.js';

module.exports.execute = async (interaction: CommandInteraction) => {
  if (!interaction.inGuild()) return interaction.reply('This is Guild only Command!');
  const voiceChannel = (interaction.member as GuildMember).voice.channel;

  if (!voiceChannel)
    return interaction.reply('You need to be in a channel to execute this command!');

  joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: interaction.channel?.guild
      .voiceAdapterCreator as InternalDiscordGatewayAdapterCreator
  });
  return interaction.reply('Coooming.');
};

module.exports.info = {
  name: 'join',
  slash: new SlashCommandBuilder().setName('join').setDescription('Join a voice channel.'),
  description: 'Join a voice channel',
  aliases: ['j', 'come', 'connect']
};
