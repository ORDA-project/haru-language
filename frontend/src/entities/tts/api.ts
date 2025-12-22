import { http } from '../../utils/http';
import { TTSParams, TTSResponse } from './types';

export const ttsApi = {
  generateTTS: (params: TTSParams): Promise<TTSResponse> => {
    return http.post('/api/tts', { json: params });
  },
};