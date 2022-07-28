import { getVoiceConnection } from '@discordjs/voice';
import { CommandInteraction, GuildMember, SlashCommandBuilder } from 'discord.js';
import { QueueObject } from '..';

module.exports.execute = async (interaction: CommandInteraction, musicQueue: QueueObject) => {
  if (!interaction.inGuild()) return await interaction.reply('This is Guild only Command!');

  const voiceChannel = (interaction.member as GuildMember).voice.channel;
  let connection = getVoiceConnection(interaction.guildId);

  if (!voiceChannel)
    return await interaction.reply('You need to be in a channel to execute this command!');

  if (!connection) return await interaction.reply("I'm not connected to your vc!");
  // @ts-ignore
  connection._state.subscription.player.unpause().catch((err) => console.log(err));
};

module.exports.info = {
  name: 'resume',
  slash: new SlashCommandBuilder().setName('resume').setDescription('Resumes Player.'),
  group: 'voice',
  description: 'Resumes Player.',
  aliases: ['rp', 'unpause', 'up', 'r']
};
