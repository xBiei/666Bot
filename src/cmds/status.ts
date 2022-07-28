import { ActivityType, CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CustomClient } from '..';
import * as config from '../config.json';
import { readFile, writeFile } from 'fs';
import logger from '../utils/logger';

module.exports.execute = async (interaction: CommandInteraction, client: CustomClient) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.user.id !== config.owner)
    return await interaction.reply('You are not the owner!');

  let status: ActivityType.Playing | ActivityType.Watching | ActivityType.Listening =
    ActivityType.Playing;

  if (interaction.options.getString('type') === 'Playing') status = ActivityType.Playing;
  else if (interaction.options.getString('type') === 'Watching') status = ActivityType.Watching;
  else if (interaction.options.getString('type') === 'Listening') status = ActivityType.Listening;

  client.user?.setPresence({
    status:
      (interaction.options.getString('presence') as 'online') || 'idle' || 'dnd' || 'invisible'
  });
  client.user?.setActivity(interaction.options.getString('activity') as string, { type: status });

  readFile(`${__dirname}/../../src/config.json`, 'utf8', function readFileCallback(err, data) {
    if (err) {
      console.log(err);
    } else {
      let obj = JSON.parse(data);
      obj.status = interaction.options.getString('presence');
      obj.activity = interaction.options.getString('activity');
      obj.activityType = interaction.options.getString('type');

      writeFile(`${__dirname}/../../src/config.json`, JSON.stringify(obj), 'utf8', (err) =>
        logger.error(err)
      );
    }
  });
  // for dist
  readFile(`${__dirname}/../config.json`, 'utf8', function readFileCallback(err, data) {
    if (err) {
      console.log(err);
    } else {
      let obj = JSON.parse(data);
      obj.status = interaction.options.getString('presence');
      obj.activity = interaction.options.getString('activity');
      obj.activityType = interaction.options.getString('type');

      writeFile(`${__dirname}/../config.json`, JSON.stringify(obj), 'utf8', (err) =>
        logger.error(err)
      );
    }
  });

  return await interaction.reply({ content: 'Successfully updated presence!', ephemeral: true });
};

module.exports.info = {
  name: 'status',
  slash: new SlashCommandBuilder()
    .setName('status')
    .setDescription("set bot's status. Owner Only :3")
    .addStringOption((option) =>
      option
        .setName('presence')
        .setDescription('a presence')
        .setRequired(true)
        .addChoices(
          { name: 'online', value: 'online' },
          { name: 'idle', value: 'idle' },
          { name: 'dnd', value: 'dnd' },
          { name: 'invisible', value: 'invisible' }
        )
    )
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('activity type')
        .setRequired(true)
        .addChoices(
          { name: 'Playing', value: 'Playing' },
          { name: 'Watching', value: 'Watching' },
          { name: 'Listening', value: 'Listening' }
        )
    )
    .addStringOption((option) =>
      option.setName('activity').setDescription('name').setRequired(true)
    ),
  description: "set bot's status. Owner Only :3",
  aliases: ['']
};
