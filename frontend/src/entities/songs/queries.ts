import { useGetQuery, usePostMutation } from '../../hooks/useQuery';
import { SongLyricResponse, YoutubeSearchParams, YoutubeSearchResponse } from './types';

export const useGetSongLyric = () => {
  return useGetQuery<SongLyricResponse>(
    '/songLyric',
    {
      queryKey: ['songLyric'],
    }
  );
};

export const useSearchYoutube = () => {
  return usePostMutation<YoutubeSearchResponse, YoutubeSearchParams>(
    '/songYoutube',
    {
      showSuccessMessage: 'YouTube Ä…t DÃ»µ»‰.',
    }
  );
};