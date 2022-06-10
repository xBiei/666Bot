import { codeBlock, SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { CustomClient } from '..';

module.exports.execute = async (interaction: CommandInteraction, client: CustomClient) => {
  if (interaction.user.id !== process.env.owner)
    return await interaction.reply('You are not the owner!');

  const clean = async (client: CustomClient, text: any) => {
    if (text && text.constructor.name == 'Promise') text = await text;
    if (typeof text !== 'string') text = require('util').inspect(text, { depth: 1 });

    text = text
      .replace(/`/g, '`' + String.fromCharCode(8203))
      .replace(/@/g, '@' + String.fromCharCode(8203));

    text.replaceAll(client.token, '[REDACTED]');
    return text;
  };

  const code = interaction.options.getString('code') as string;

  try {
    const evaled = eval(code);
    const cleaned = await clean(client, evaled);
    const MAX_CHARS = 3 + 2 + clean.length + 3;
    if (MAX_CHARS > 4000) {
      await interaction.reply({
        files: [{ attachment: Buffer.from(cleaned), name: 'output.txt' }]
      });
    }
    await interaction.reply(codeBlock('js', cleaned));
  } catch (err) {
    console.log(err);
  }
};

module.exports.info = {
  name: 'eval',
  slash: new SlashCommandBuilder()
    .setName('eval')
    .setDescription("Owner Only Command, Don't Bother.")
    .addStringOption((option) =>
      option.setName('code').setDescription('your code.').setRequired(true)
    ),
  description: "Owner Only Command, Don't Bother.",
  aliases: ['run']
};
