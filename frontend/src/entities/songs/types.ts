export interface Song {
  Artist: string;
  Title: string;
  Lyric: string;
  YouTubeUrl?: string;
}

export interface SongLyricResponse {
  result: boolean;
  songData?: Song;
  message?: string;
}

export interface YoutubeSearchParams {
  Title: string;
  Artist: string;
}

export interface YoutubeSearchResponse {
  result: boolean;
  youtubeUrl?: string;
  message?: string;
}