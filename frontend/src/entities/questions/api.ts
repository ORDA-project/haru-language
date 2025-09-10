import { http } from '../../utils/http';
import { CreateQuestionParams, CreateQuestionResponse, GetQuestionsResponse } from './types';

export const questionApi = {
  createQuestion: (params: CreateQuestionParams): Promise<CreateQuestionResponse> => {
    return http.post('/question', { json: params });
  },

  getQuestionsByUserId: (userId: number): Promise<GetQuestionsResponse> => {
    return http.get(`/question/${userId}`);
  },
};