import { ChatInputCommandInteraction, PresenceStatusData, SlashCommandBuilder } from 'discord.js';
import * as config from '../config.json';
import { client } from '../index';

module.exports.execute = async (interaction: ChatInputCommandInteraction) => {
  if (interaction.user.id !== config.owner)
    return await interaction.reply('You are not the owner!');

  const status = interaction.options.getString('presence', true) as PresenceStatusData;
  const activity = interaction.options.getString('activity', true);
  const type = interaction.options.getString('type', true);

  await client.statusChange(status, activity, Number(type));

  return await interaction.reply({ content: 'Successfully updated presence!', ephemeral: true });
};

module.exports.info = {
  name: 'presence',
  slash: new SlashCommandBuilder()
    .setName('presence')
    .setDescription("set bot's status. Owner Only :3")
    .addStringOption((option) =>
      option
        .setName('presence')
        .setDescription('a presence')
        .setRequired(true)
        .addChoices(
          { name: 'Online', value: 'online' },
          { name: 'Idle', value: 'idle' },
          { name: 'Dnd', value: 'dnd' },
          { name: 'Invisible', value: 'invisible' }
        )
    )
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('activity type')
        .setRequired(true)
        .addChoices(
          { name: 'Playing', value: '0' },
          { name: 'Streaming', value: '1' },
          { name: 'Listening', value: '2' },
          { name: 'Watching', value: '3' }
        )
    )
    .addStringOption((option) =>
      option.setName('activity').setDescription('name').setRequired(true)
    ),
  description: "set bot's presence. Owner Only :3"
};
