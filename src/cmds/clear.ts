import { SlashCommandBuilder } from '@discordjs/builders';
import {
  CommandInteraction,
  GuildMember,
  NewsChannel,
  TextChannel,
  ThreadChannel
} from 'discord.js';

module.exports.execute = async (interaction: CommandInteraction) => {
  if (
    !interaction.guild?.me?.permissionsIn(interaction.channel as TextChannel).has('MANAGE_MESSAGES')
  )
    return interaction.reply({
      content: 'I need the `Manage Messages` permission to use this command.',
      ephemeral: true
    });
  else if (
    !(interaction.member as GuildMember)
      ?.permissionsIn(interaction.channel as TextChannel)
      .has('MANAGE_MESSAGES')
  )
    return interaction.reply({
      content: 'You need the `Manage Messages` permission to use this command.',
      ephemeral: true
    });

  const amount = interaction.options.getNumber('amount') as number;

  if (amount <= 1) {
    return await interaction.reply({
      content: 'you need to input a number higher than 1.',
      ephemeral: true
    });
  }

  if (amount > 100) {
    const splitted = new Array(Math.floor(amount / 100)).fill(100).concat(amount % 100);
    return splitted.forEach((num: number) => {
      console.log(num);
      num == 100 ? (num = num - 1) : null;
      if (num === 0) return;
      (interaction.channel as NewsChannel | TextChannel | ThreadChannel).bulkDelete(num);
    });
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
