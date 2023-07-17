import { AudioResource, createAudioResource } from '@discordjs/voice';
import {
  validate,
  stream,
  video_basic_info,
  spotify,
  search as ytSearch,
  soundcloud,
  YouTubeStream,
  SoundCloudStream
} from 'play-dl';

export interface SongData {
  url: string;
  title: string;
  duration: number;
}

export class Song {
  public readonly url: string;
  public readonly title: string;
  public readonly duration: number;

  public constructor({ url, title, duration }: SongData) {
    this.url = url;
    this.title = title;
    this.duration = duration;
  }

  public static async from(url: string = '', search: string = '') {
    const isYT = (await validate(url)) === 'yt_video';
    const isSO = (await validate(url)) === 'so_track';
    const isSP = (await validate(url)) === 'sp_track';
    let songInfo;

    // YT URL
    if (isYT) {
      songInfo = await video_basic_info(url);

      return new this({
        url: songInfo.video_details.url,
        title: songInfo.video_details.title || songInfo.video_details.url,
        duration: songInfo.video_details.durationInSec
      });
      // Spotify URL
    } else if (isSP) {
      await spotify(url)
        .then(async (e) => {
          if (e.name) await ytSearch(e.name).then((e) => (url = e[0].url));
        })
        .then(async () => {
          if ((await validate(url)) === 'yt_video')
            await video_basic_info(url).then(
              (e) =>
                new this({
                  url: e.video_details.url,
                  title: e.video_details.title || e.video_details.url,
                  duration: e.video_details.durationInSec
                })
            );
        });
      songInfo = await video_basic_info(url);

      return new this({
        url: songInfo.video_details.url,
        title: songInfo.video_details.title || songInfo.video_details.url,
        duration: songInfo.video_details.durationInSec
      });
      // Soundcloud URL
    } else if (isSO) {
      await soundcloud(url)
        .then(async (e) => {
          if (e.name) await ytSearch(e.name).then((e) => (url = e[0].url));
        })
        .then(async () => {
          if ((await validate(url)) === 'yt_video')
            await video_basic_info(url).then(
              (e) =>
                new this({
                  url: e.video_details.url,
                  title: e.video_details.title || e.video_details.url,
                  duration: e.video_details.durationInSec
                })
            );
        });
      songInfo = await video_basic_info(url);

      return new this({
        url: songInfo.video_details.url,
        title: songInfo.video_details.title || songInfo.video_details.url,
        duration: songInfo.video_details.durationInSec
      });
      // Search
    } else {
      const result = (await ytSearch(search, { limit: 1 }))[0];

      // This is for handling the case where no results are found (spotify links for example)
      result ? null : console.log(`No results found for ${search}`);

      if (!result) {
        let err = new Error(`No search results found for ${search}`);
        err.name = 'NoResults';
        if (
          !(await validate('yt_video')) &&
          !(await validate('sp_track')) &&
          !(await validate('so_track'))
        )
          err.name = 'InvalidURL';

        throw err;
      }

      songInfo = await video_basic_info(`https://youtube.com/watch?v=${result.id}`);

      return new this({
        url: songInfo.video_details.url,
        title: songInfo.video_details.title || songInfo.video_details.url,
        duration: songInfo.video_details.durationInSec
      });
    }
  }

  public async makeResource(): Promise<AudioResource<Song> | void> {
    let playStream: YouTubeStream | SoundCloudStream | undefined;

    if ((await validate(this.url)) === ('yt_video' || 'so_track')) {
      playStream = await stream(this.url);
    }

    if (!playStream) return;

    return createAudioResource(playStream.stream, {
      metadata: this,
      inputType: playStream!.type,
      inlineVolume: true
    });
  }

  public startMessage() {
    return `🔴 Playing **${this.title}**`;
  }
}
