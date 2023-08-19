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
import {
  ActionRowBuilder,
  ButtonBuilder,
  ComponentType,
  Interaction,
  TextChannel
} from 'discord.js';
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

export class TracksQueue {
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
              } catch (err) {
                console.error(err);
              }
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
        } catch (err) {
          console.error(err);
        }
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

    // button components for all playing functions
    const buttons = [
      new ButtonBuilder().setCustomId('loop').setLabel('🔁').setStyle(2),
      new ButtonBuilder().setCustomId('shuffle').setLabel('🔀').setStyle(2),
      new ButtonBuilder().setCustomId('pause').setLabel('⏯️').setStyle(1),
      new ButtonBuilder().setCustomId('stop').setLabel('⏹️').setStyle(4),
      new ButtonBuilder().setCustomId('skip').setLabel('⏭️').setStyle(2),
      new ButtonBuilder().setCustomId('mute').setLabel('🔇').setStyle(4),
      new ButtonBuilder().setCustomId('volume_down').setLabel('🔉').setStyle(2),
      new ButtonBuilder().setCustomId('volume_up').setLabel('🔊').setStyle(2)
    ];

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(0, 5));
    const secondRow = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(5, 8));

    const playingMessage = await this.textChannel
      .send({
        content: (newState.resource as AudioResource<Song>).metadata.startMessage(),
        components: [row, secondRow]
      })
      .catch((error) => {
        console.error(error);
        logger.error(error);
        return;
      });

    try {
      const collector = playingMessage?.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (interaction: any) => interaction.user.id === this.interaction.user.id,
        time: song.duration > 0 ? song.duration * 1000 : 600000
      });

      if (!collector) return;
      collector.on('collect', async (response) => {
        const member = response.member;
        Object.defineProperty(this.interaction, 'user', {
          value: member.user
        });

        switch (response.customId) {
          case 'skip':
            await this.bot.slashCommandsMap.get('skip')!.execute(this.interaction);
            response.reply({ content: 'Done!', ephemeral: true });
            break;

          case 'pause':
            if (this.player.state.status == AudioPlayerStatus.Playing) {
              await this.bot.slashCommandsMap.get('pause')!.execute(this.interaction);
            } else {
              await this.bot.slashCommandsMap.get('resume')!.execute(this.interaction);
            }
            response.reply({ content: 'Done!', ephemeral: true });
            break;

          case 'mute':
            if (!canModifyQueue(member)) {
              response.reply({
                content: "You're not in the channel, Troller!!",
                ephemeral: true
              });
              break;
            }
            this.muted = !this.muted;
            if (this.muted) {
              this.resource.volume?.setVolumeLogarithmic(0);
              this.textChannel
                .send(`I'm muted! By <@${member.id}>`)
                .catch(console.error)
                .then((msg) => setTimeout(() => msg?.delete().catch(console.error), 5000))
                .catch(console.error);
            } else {
              this.resource.volume?.setVolumeLogarithmic(
                (!this.volume ? (this.volume = 10) : this.volume) / 100
              );
              this.textChannel
                .send(`unmuted!`)
                .catch(console.error)
                .then((msg) => setTimeout(() => msg?.delete().catch(console.error), 5000))
                .catch(console.error);
            }
            response.reply({ content: 'Done!', ephemeral: true });
            break;

          case 'volume_down':
            if (this.volume == 0) return;
            if (!canModifyQueue(member)) {
              response.reply({
                content: "You're not in the channel, Troller!!",
                ephemeral: true
              });
              break;
            }
            this.volume = Math.max(this.volume - 10, 0);
            this.resource.volume?.setVolumeLogarithmic(this.volume / 100);
            this.textChannel
              .send(`Volume Decreased to ${this.volume}! By <@${member.id}>`)
              .catch(console.error)
              .then((msg) => setTimeout(() => msg?.delete().catch(console.error), 5000))
              .catch(console.error);
            response.reply({ content: 'Done!', ephemeral: true });
            break;

          case 'volume_up':
            if (this.volume == 100) return;
            if (!canModifyQueue(member)) {
              response.reply({
                content: "You're not in the channel, Troller!!",
                ephemeral: true
              });
              break;
            }
            this.volume = Math.min(this.volume + 10, 100);
            this.resource.volume?.setVolumeLogarithmic(this.volume / 100);
            this.textChannel
              .send(`Volume Increased to ${this.volume}! By <@${member.id}>`)
              .catch(console.error)
              .then((msg) => setTimeout(() => msg?.delete().catch(console.error), 5000))
              .catch(console.error);
            response.reply({ content: 'Done!', ephemeral: true });
            break;

          case 'loop':
            await this.bot.slashCommandsMap.get('loop')!.execute(this.interaction, this.bot);
            response.reply({ content: 'Done!', ephemeral: true });
            break;

          case 'shuffle':
            await this.bot.slashCommandsMap.get('shuffle')!.execute(this.interaction, this.bot);
            response.reply({ content: 'Done!', ephemeral: true });
            break;

          case 'stop':
            await this.bot.slashCommandsMap.get('stop')!.execute(this.interaction, this.bot);
            collector.stop('track stopped');
            response.reply({ content: 'Done!', ephemeral: true });
            break;

          default:
            break;
        }
      });
      collector.on('end', () => {
        if (config.pruning) {
          setTimeout(() => {
            playingMessage?.delete().catch();
          }, 3000);
        }
      });
    } catch (error: any) {
      console.error(error);
      logger.error(error);
      return;
    }
  }
}
