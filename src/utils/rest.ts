import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { CustomClient } from '..';

export const restApi = async (
  client: CustomClient,
  slash: CustomClient['slashCommands'],
  context: CustomClient['contextCommands']
) => {
  const rest = new REST({ version: '9' }).setToken(process.env.token as string);
  await rest.put(Routes.applicationCommands(client.user?.id as string), {
    body: [...context.toJSON(), ...slash.toJSON()]
  });
  console.log('Rest Api Done!');
};
