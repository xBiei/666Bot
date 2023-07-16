import {
  Client,
  ContextMenuCommandBuilder,
  GatewayIntentBits,
  Interaction,
  Message,
  SlashCommandBuilder
} from 'discord.js';
import { CustomClient } from './structs/CustomClient';

export interface CommandData {
  run: (msg?: Message, args?: string[], client?: Client) => Promise<void>;
  execute: (interaction?: Interaction, client?: CustomClient) => Promise<void>;
  info: {
    slash: SlashCommandBuilder;
    context?: ContextMenuCommandBuilder;
    name: string;
    description: string;
    aliases?: string[]; // todo: remove this
    permissions?: string[];
    cooldown?: number;
  };
}

export const client = new CustomClient(
  new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages
    ]
  })
);
