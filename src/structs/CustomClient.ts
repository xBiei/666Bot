import {
  ActivityType,
  ChatInputCommandInteraction,
  Client,
  Collection,
  Events,
  Interaction,
  PresenceStatusData,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPostAPIContextMenuApplicationCommandsJSONBody,
  Snowflake
} from 'discord.js';
import { readdir } from 'fs';
import path from 'path';
import { CommandData } from '../index';
import { MissingPermissionsException, checkPermissions, PermissionResult } from '../utils/perms';
import * as config from '../config.json';
import { TracksQueue } from './TracksQueue';
import { restApi } from '../utils/rest';
import { QuickDB } from 'quick.db';
import logger from '../utils/logger';
import { readFile, writeFile } from 'fs';

const db = new QuickDB();

export class CustomClient {
  public commands = new Collection<string, CommandData>();
  public slashCommands = new Array<RESTPostAPIChatInputApplicationCommandsJSONBody>();
  public slashCommandsMap = new Collection<string, CommandData>();
  public contextCommands = new Array<RESTPostAPIContextMenuApplicationCommandsJSONBody>();
  public contextCommandsMap = new Collection<string, CommandData>();
  public cooldowns = new Collection<string, Collection<Snowflake, number>>();
  public queues = new Collection<Snowflake, TracksQueue>();

  public constructor(public readonly client: Client) {
    this.client.login(config.token);

    this.client.on('ready', () => {
      console.log(`${this.client.user!.username} ready!`);
      logger.info(`${this.client.user!.username} ready!`);

      this.client.user?.setPresence({
        status: config.status as PresenceStatusData
      });
      this.client.user?.setActivity(config.activity, { type: config.activityType });

      this.registerSlashCommands();
    });

    this.onDebug();
    this.onError();
    this.onWarn();

    this.onInteractionCreate();
  }

  public async statusChange(
    status: PresenceStatusData,
    activity: string,
    type: ActivityType.Playing | ActivityType.Watching | ActivityType.Listening
  ) {
    this.client.user?.setPresence({
      status: status
    });
    this.client.user?.setActivity(activity, { type: Number(type) });
    readFile(`${__dirname}/../../src/config.json`, 'utf8', function readFileCallback(err, data) {
      if (err) {
        console.log(err);
      } else {
        const obj = JSON.parse(data);
        obj.status = status;
        obj.activity = activity;
        obj.activityType = Number(type);

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
        const obj = JSON.parse(data);
        obj.status = status;
        obj.activity = activity;
        obj.activityType = Number(type);

        writeFile(`${__dirname}/../config.json`, JSON.stringify(obj), 'utf8', (err) =>
          logger.error(err)
        );
      }
    });
  }

  private async registerSlashCommands() {
    const cmds = path.resolve(__dirname, '..', 'cmds');
    await readdir(cmds, async (error, files) => {
      if (error) throw error;
      await files.forEach((file) => {
        if (!file.endsWith('.js')) return;

        const properties: CommandData = require(`${cmds}/${file}`);

        // if (properties.info.context) {
        //   this.contextCommandsMap.set(properties.info.name, properties);
        //   this.contextCommands.push(properties.info.context?.toJSON());
        // }

        if (properties.info.slash) {
          this.slashCommandsMap.set(properties.info.name, properties);
          this.slashCommands.push(properties.info.slash?.toJSON());
        }

        this.commands.set(properties.info.name, properties);
      });
      await restApi(this.client, this.slashCommands, this.contextCommands);
    });
  }

  // todo: Add Context Menu Commands support
  private async onInteractionCreate() {
    this.client.on(Events.InteractionCreate, async (interaction: Interaction): Promise<any> => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.slashCommandsMap.get(interaction.commandName);

      if (!command) return;

      // Cool down Check
      if (!this.cooldowns.has(interaction.commandName)) {
        this.cooldowns.set(interaction.commandName, new Collection());
      }

      const now = Date.now();
      const timestamps = this.cooldowns.get(interaction.commandName);
      const cooldownAmount = (command.info.cooldown || 1) * 1000;

      if (timestamps?.has(interaction.user.id)) {
        const expirationTime = (timestamps?.get(interaction.user.id) || 0) + cooldownAmount;

        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          return interaction.reply({
            content: `${interaction.commandName} is too hot to run! Give it ${timeLeft.toFixed(
              1
            )} then Run it.`,
            ephemeral: true
          });
        }
      }

      timestamps?.set(interaction.user.id, now);
      setTimeout(() => timestamps?.delete(interaction.user.id), cooldownAmount);

      // Permissions Check
      try {
        const permissionsCheck: PermissionResult = await checkPermissions(command, interaction);

        if (permissionsCheck.result) {
          await command.execute(interaction as ChatInputCommandInteraction);
          await db.add(`${interaction.guildId}.${interaction.commandName}`, 1);
        } else {
          throw new MissingPermissionsException(permissionsCheck.missing);
        }
      } catch (error: any | never) {
        console.error(error);

        logger.log({
          level: 'error',
          message: 'An error occurred while executing a command!',
          meta: {
            channel: interaction.channelId || 'N/A',
            guild: interaction.guildId || 'N/A',
            user: interaction.user.id || 'N/A',
            command: interaction.commandName || 'N/A',
            errorMessage: (error as Error).message || 'N/A'
          },
          error
        });

        if (error.message.includes('permissions')) {
          interaction.reply({ content: error.toString(), ephemeral: true }).catch(console.error);
        } else {
          interaction
            .reply({
              content: `Error running this command. Idk why, but there's an error; Contact me here https://twitter.com/xBiei`,
              ephemeral: true
            })
            .catch(console.error);
        }
      }
    });
  }

  private async onDebug() {
    this.client.on(Events.Debug, async (msg) => {
      logger.log({
        level: 'debug',
        message: 'A debug message occurred in Client Main process!',
        meta: {
          debugMessage: msg || 'N/A'
        }
      });
    });
  }

  private async onWarn() {
    this.client.on(Events.Warn, async (msg) => {
      logger.log({
        level: 'warn',
        message: 'A warning occurred in Client Main process!',
        meta: {
          warningMessage: msg || 'N/A'
        }
      });
    });
  }

  private async onError() {
    this.client.on(Events.Error, async (msg) => {
      logger.log({
        level: 'error',
        message: 'An error occurred in Client Main process!',
        meta: {
          errorMessage: msg.message || 'N/A'
        },
        error: msg
      });
    });
  }
}
