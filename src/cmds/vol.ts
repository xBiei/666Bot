import { getVoiceConnection } from '@discordjs/voice';
import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

module.exports.execute = async (interaction: CommandInteraction) => {
  if (!interaction.inGuild()) return await interaction.reply('This is Guild only Command!');
  if (!interaction.isChatInputCommand()) return;

  let connection = getVoiceConnection(interaction.guildId);
  const volume = interaction.options.getNumber('volume');
  if (!volume)
    return await interaction.reply(`Did u expect me to read your mind? gimme the vol u want`);

  if (isNaN(volume) || volume > 100) {
    return await interaction.reply('Vol can be set between **`1`** - **`100`**');
  } else {
    const vol = volume / 100;
    // @ts-ignore
    connection._state.subscription.player._state.resource.volume.volume = vol;
    await interaction.reply(`Done ya bb, vol is **\`${volume}%\`**.`);
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
