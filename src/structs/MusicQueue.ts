import {
  AudioPlayer,
  AudioPlayerState,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  entersState,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionState,
  VoiceConnectionStatus
} from '@discordjs/voice';
import { Interaction, Message, TextChannel, User } from 'discord.js';
import { promisify } from 'node:util';
import { client } from '../index';
import * as config from '../config.json';
import { Song } from './Song';
import { GuildMember } from 'discord.js';
import logger from '../utils/logger';

const wait = promisify(setTimeout);

export interface QueueOptions {
  interaction: Interaction;
  textChannel: TextChannel;
  connection: VoiceConnection;
}

export const canModifyQueue = (member: GuildMember) =>
  member.voice.channelId === member.guild.members.me!.voice.channelId;

export class MusicQueue {
  public readonly interaction!: Interaction;
  public readonly connection!: VoiceConnection;
  public readonly player: AudioPlayer;
  public readonly textChannel!: TextChannel;
  public readonly bot = client;

  public resource!: AudioResource;
  public songs: Song[] = [];
  public volume = config.volume || 100;
  public loop = false;
  public muted = false;
  public waitTimeout!: NodeJS.Timeout | null;
  private queueLock = false;
  private readyLock = false;
  private stopped = false;

  public constructor(options: QueueOptions) {
    Object.assign(this, options);

    this.player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
    this.connection.subscribe(this.player);

    const networkStateChangeHandler = (oldNetworkState: any, newNetworkState: any) => {
      const newUdp = Reflect.get(newNetworkState, 'udp');
      clearInterval(newUdp?.keepAliveInterval);
    };

    this.connection.on(
      'stateChange' as any,
      async (oldState: VoiceConnectionState, newState: VoiceConnectionState) => {
        Reflect.get(oldState, 'networking')?.off('stateChange', networkStateChangeHandler);
        Reflect.get(newState, 'networking')?.on('stateChange', networkStateChangeHandler);

        if (newState.status === VoiceConnectionStatus.Disconnected) {
          if (
            newState.reason === VoiceConnectionDisconnectReason.WebSocketClose &&
            newState.closeCode === 4014
          ) {
            try {
              this.stop();
            } catch (e) {
              console.log(e);
              logger.error(e);
              this.stop();
            }
          } else if (this.connection.rejoinAttempts < 5) {
            await wait((this.connection.rejoinAttempts + 1) * 5_000);
            this.connection.rejoin();
          } else {
            this.connection.destroy();
          }
        } else if (
          !this.readyLock &&
          (newState.status === VoiceConnectionStatus.Connecting ||
            newState.status === VoiceConnectionStatus.Signalling)
        ) {
          this.readyLock = true;
          try {
            await entersState(this.connection, VoiceConnectionStatus.Ready, 20_000);
          } catch {
            if (this.connection.state.status !== VoiceConnectionStatus.Destroyed) {
              try {
                this.connection.destroy();
              } catch {}
            }
          } finally {
            this.readyLock = false;
          }
        }
      }
    );

    this.player.on(
      'stateChange' as any,
      async (oldState: AudioPlayerState, newState: AudioPlayerState) => {
        if (
          oldState.status !== AudioPlayerStatus.Idle &&
          newState.status === AudioPlayerStatus.Idle
        ) {
          if (this.loop && this.songs.length) {
            this.songs.push(this.songs.shift()!);
          } else {
            this.songs.shift();
            if (!this.songs.length) return this.stop();
          }

          if (this.songs.length || this.resource.audioPlayer) this.processQueue();
        } else if (
          oldState.status === AudioPlayerStatus.Buffering &&
          newState.status === AudioPlayerStatus.Playing
        ) {
          this.sendPlayingMessage(newState);
        }
      }
    );

    this.player.on('error', (error) => {
      console.error(error);

      if (this.loop && this.songs.length) {
        this.songs.push(this.songs.shift()!);
      } else {
        this.songs.shift();
      }

      this.processQueue();
    });
  }

  public enqueue(...songs: Song[]) {
    if (this.waitTimeout !== null) clearTimeout(this.waitTimeout);
    this.waitTimeout = null;
    this.stopped = false;
    this.songs = this.songs.concat(songs);
    this.processQueue();
  }

  public stop() {
    if (this.stopped) return;

    this.stopped = true;
    this.loop = false;
    this.songs = [];
    this.player.stop();

    if (this.waitTimeout !== null) return;

    this.waitTimeout = setTimeout(() => {
      if (this.connection.state.status !== VoiceConnectionStatus.Destroyed) {
        try {
          this.connection.destroy();
        } catch {}
      }
      client.queues.delete(this.interaction.guild!.id);

      !config.pruning && this.textChannel.send('Cya l8r');
    }, config.stayTime * 1000);
  }

  public async processQueue(): Promise<void> {
    if (this.queueLock || this.player.state.status !== AudioPlayerStatus.Idle) {
      return;
    }

    if (!this.songs.length) {
      return this.stop();
    }

    this.queueLock = true;

    const next = this.songs[0];

    try {
      const resource = await next.makeResource();

      this.resource = resource!;
      this.player.play(this.resource);
      this.resource.volume?.setVolumeLogarithmic(this.volume / 100);
    } catch (error) {
      console.error(error);

      return this.processQueue();
    } finally {
      this.queueLock = false;
    }
  }

  private async sendPlayingMessage(newState: any) {
    const song = (newState.resource as AudioResource<Song>).metadata;

    let playingMessage: Message;

    try {
      playingMessage = await this.textChannel.send(
        (newState.resource as AudioResource<Song>).metadata.startMessage()
      );

      await playingMessage.react('🔇');
      await playingMessage.react('🔁');
      await playingMessage.react('🔀');
      await playingMessage.react('🔉');
      await playingMessage.react('⏯️');
      await playingMessage.react('⏹️');
      await playingMessage.react('⏭️');
      await playingMessage.react('🔊');
    } catch (error: any) {
      console.error(error);
      logger.error(error);
      this.textChannel.send(error.message);
      return;
    }

    const filter = (reaction: any, user: User) => user.id !== this.textChannel.client.user!.id;

    const collector = playingMessage.createReactionCollector({
      filter,
      time: song.duration > 0 ? song.duration * 1000 : 600000
    });

    collector.on('collect', async (reaction, user) => {
      if (!this.songs) return;

      const member = await playingMessage.guild!.members.fetch(user);
      Object.defineProperty(this.interaction, 'user', {
        value: user
      });

      switch (reaction.emoji.name) {
        case '⏭️':
          reaction.users.remove(user).catch(console.error);
          await this.bot.slashCommandsMap.get('skip')!.execute(this.interaction);
          break;

        case '⏯️':
          reaction.users.remove(user).catch(console.error);
          if (this.player.state.status == AudioPlayerStatus.Playing) {
            await this.bot.slashCommandsMap.get('pause')!.execute(this.interaction);
          } else {
            await this.bot.slashCommandsMap.get('resume')!.execute(this.interaction);
          }
          break;

        case '🔇':
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return "You're not in the channel, Troller!";
          this.muted = !this.muted;
          if (this.muted) {
            this.resource.volume?.setVolumeLogarithmic(0);
            this.textChannel
              .send(`I'm muted! By ${user.username}`)
              .catch(console.error)
              .then((msg) => setTimeout(() => msg!.delete(), 5000));
          } else {
            this.resource.volume?.setVolumeLogarithmic(
              (!this.volume ? (this.volume = 10) : this.volume) / 100
            );
            this.textChannel
              .send(`unmuted!`)
              .catch(console.error)
              .then((msg) => setTimeout(() => msg!.delete(), 5000));
          }
          break;

        case '🔉':
          reaction.users.remove(user).catch(console.error);
          if (this.volume == 0) return;
          if (!canModifyQueue(member)) return "You're not in the channel, Troller!";
          this.volume = Math.max(this.volume - 10, 0);
          this.resource.volume?.setVolumeLogarithmic(this.volume / 100);
          this.textChannel
            .send(`Volume Decreased to ${this.volume}! By ${user.username}`)
            .catch(console.error)
            .then((msg) => setTimeout(() => msg!.delete(), 5000));
          break;

        case '🔊':
          reaction.users.remove(user).catch(console.error);
          if (this.volume == 100) return;
          if (!canModifyQueue(member)) return "You're not in the channel, Troller!";
          this.volume = Math.min(this.volume + 10, 100);
          this.resource.volume?.setVolumeLogarithmic(this.volume / 100);
          this.textChannel
            .send(`Volume Increased to ${this.volume}! By ${user.username}`)
            .catch(console.error)
            .then((msg) => setTimeout(() => msg!.delete(), 5000));
          break;

        case '🔁':
          reaction.users.remove(user).catch(console.error);
          await this.bot.slashCommandsMap.get('loop')!.execute(this.interaction, this.bot);
          break;

        case '🔀':
          reaction.users.remove(user).catch(console.error);
          await this.bot.slashCommandsMap.get('shuffle')!.execute(this.interaction, this.bot);
          break;

        case '⏹️':
          reaction.users.remove(user).catch(console.error);
          await this.bot.slashCommandsMap.get('stop')!.execute(this.interaction, this.bot);
          collector.stop();
          break;

        default:
          reaction.users.remove(user).catch(console.error);
          break;
      }
    });

    collector.on('end', () => {
      playingMessage.reactions.removeAll().catch(console.error);

      if (config.pruning) {
        setTimeout(() => {
          playingMessage.delete().catch();
        }, 3000);
      }
    });
  }
}
