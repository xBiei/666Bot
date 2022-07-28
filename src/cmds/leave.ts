import { getVoiceConnection } from '@discordjs/voice';
import { CommandInteraction, GuildMember, SlashCommandBuilder } from 'discord.js';

module.exports.execute = async (interaction: CommandInteraction) => {
  if (!interaction.inGuild()) return await interaction.reply('This is Guild only Command!');
  const voiceChannel = (interaction.member as GuildMember).voice.channel;
  let connection = getVoiceConnection(interaction.guildId);

  if (!voiceChannel)
    return await interaction.reply('You need to be in a channel to execute this command!');

  connection?.destroy();
  await interaction.reply(`Bye bb.`);
};

module.exports.info = {
  name: 'leave',
  slash: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave the current voice channel!'),
  description: 'Leave the current voice channel!',
  aliases: ['l', 'go', 'disconnect', 'fuckoff', 'bye']
};
