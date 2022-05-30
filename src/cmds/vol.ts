import { SlashCommandBuilder } from '@discordjs/builders';
import { getVoiceConnection } from '@discordjs/voice';
import { CommandInteraction, Message } from 'discord.js';
import { QueueObject } from '..';

module.exports.execute = async (interaction: CommandInteraction, musicQueue: QueueObject) => {
  if (!interaction.inGuild()) return interaction.reply('This is Guild only Command!');
  let connection = getVoiceConnection(interaction.guildId);
  const volume = interaction.options.getNumber('volume');
  if (!volume) return interaction.reply(`Did u expect me to read your mind? gimme the vol u want`);

  if (isNaN(volume) || volume > 100) {
    return interaction.reply('Vol can be set between **`1`** - **`100`**');
  } else {
    const vol = volume / 100;
    // @ts-ignore
    connection._state.subscription.player._state.resource.volume.volume = vol;
    interaction.reply(`Done ya bb, vol is **\`${volume}%\`**.`);
  }
};

module.exports.info = {
  name: 'vol',
  slash: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Changes Volume.')
    .addNumberOption((option) =>
      option.setName('volume').setDescription('amount.').setRequired(true)
    ),
  group: 'voice',
  description: 'Changes Volume.',
  aliases: ['v', 'volume', 'sound']
};
