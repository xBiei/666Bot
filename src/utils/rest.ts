import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { CustomClient } from '..';
import logger from './logger';
import * as config from '../config.json';

export const restApi = async (
  client: CustomClient,
  slash: CustomClient['slashCommands'],
  context: CustomClient['contextCommands']
) => {
  const rest = new REST({ version: '9' }).setToken(config.token as string);
  await rest.put(Routes.applicationCommands(client.user?.id as string), {
    body: [...context.toJSON(), ...slash.toJSON()]
  });
  logger.info('Rest Api Done!');
};
