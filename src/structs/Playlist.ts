import { playlist_info, search, validate, YouTubeVideo } from 'play-dl';
import * as config from '../config.json';
import { Song } from './Song';

export class Playlist {
  public data: YouTubeVideo[];
  public videos: Song[];

  public constructor(playlist: YouTubeVideo[]) {
    this.data = playlist;

    this.videos = this.data
      .filter(
        (video) =>
          video.title != 'Private video' && video.title != 'Deleted video' && video.title != null
      )
      .slice(0, config.maxPlaylistSize - 1)
      .map((video) => {
        return new Song({
          title: video.title!,
          url: `https://youtube.com/watch?v=${video.id}`,
          duration: video.durationInSec
        });
      });
  }

  public static async from(url: string = '', searchString: string = '') {
    const urlValid = await validate(url);
    let playlistVideos: YouTubeVideo[];

    if (urlValid === 'yt_playlist') {
      playlistVideos = await (
        await search(url, { source: { youtube: 'playlist' } })
      )[0].all_videos();
    } else {
      const result = await search(searchString, { source: { youtube: 'playlist' } });

      playlistVideos = await (await playlist_info(result[0].url!)).all_videos();
    }

    return new this(playlistVideos);
  }
}
