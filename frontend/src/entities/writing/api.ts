import { http } from '../../utils/http';
import { CorrectWritingParams, CorrectWritingResponse, TranslateWritingParams, TranslateWritingResponse } from './types';

export const writingApi = {
  correctWriting: (params: CorrectWritingParams): Promise<CorrectWritingResponse> => {
    return http.post('/writing/correct', { json: params });
  },

  translateWriting: (params: TranslateWritingParams): Promise<TranslateWritingResponse> => {
    return http.post('/writing/translate', { json: params });
  },
};