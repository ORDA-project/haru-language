import { usePostMutation } from '../../hooks/useQuery';
import { TTSParams, TTSResponse } from './types';

export const useGenerateTTS = () => {
  return usePostMutation<TTSResponse, TTSParams>(
    '/tts',
    {
      showSuccessMessage: 'L1 ְXt Dּָµָה.',
    }
  );
};