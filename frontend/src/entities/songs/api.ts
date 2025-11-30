import { http } from '../../utils/http';
import { SongLyricResponse, YoutubeSearchParams, YoutubeSearchResponse } from './types';

export const songApi = {
  getSongLyric: (): Promise<SongLyricResponse> => {
    return http.get('/songLyric');
  },

  searchYoutube: (params: YoutubeSearchParams): Promise<YoutubeSearchResponse> => {
    return http.post('/songYoutube', { json: params });
  },
};