import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, NewsChannel, TextChannel, ThreadChannel } from 'discord.js';

module.exports.execute = async (interaction: CommandInteraction, args: string[]) => {
  if (interaction.user.id !== process.env.owner) return;
  const amount = parseInt(args[0]) + 1;

  if (isNaN(amount)) {
    return await interaction.reply('is that a number?');
  } else if (amount <= 1 || amount > 100) {
    return await interaction.reply('you need to input a number between 1 and 99.');
  }
  return await (interaction.channel as NewsChannel | TextChannel | ThreadChannel).bulkDelete(
    amount
  );
};

module.exports.info = {
  name: 'clear',
  slash: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clears the given number of messages.')
    .addNumberOption((option) =>
      option.setName('amount').setDescription('The amount of messages to delete.').setRequired(true)
    ),
  description: 'Clears the given number of messages.',
  aliases: ['delete']
};
