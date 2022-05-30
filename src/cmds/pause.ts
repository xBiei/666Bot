import { SlashCommandBuilder } from '@discordjs/builders';
import { getVoiceConnection } from '@discordjs/voice';
import { CommandInteraction, GuildMember } from 'discord.js';
import { QueueObject } from '..';

module.exports.execute = async (interaction: CommandInteraction, musicQueue: QueueObject) => {
  if (!interaction.inGuild()) return interaction.reply('This is Guild only Command!');

  const voiceChannel = (interaction.member as GuildMember).voice.channel;
  let connection = getVoiceConnection(interaction.guildId);

  if (!voiceChannel)
    return interaction.reply('You need to be in a channel to execute this command!');

  if (!connection) return interaction.reply("I'm not connected to your vc!");
  // @ts-ignore
  connection._state.subscription.player.pause().catch((err) => console.log(err));
};

module.exports.info = {
  name: 'pause',
  slash: new SlashCommandBuilder().setName('pause').setDescription('Pauses Player.'),
  description: 'Pauses Player.',
  aliases: ['pp']
};
