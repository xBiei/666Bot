import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import * as config from '../config.json';
import { CustomClient } from '../structs/CustomClient';

export const restApi = async (
  client: CustomClient['client'],
  slash: CustomClient['slashCommands'],
  context: CustomClient['contextCommands']
) => {
  const rest = new REST({ version: '9' }).setToken(config.token);
  await rest.put(Routes.applicationCommands(client.user?.id as string), {
    body: [...context, ...slash]
  });
};
