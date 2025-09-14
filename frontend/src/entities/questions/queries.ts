import { useGetQuery, usePostMutation } from '../../hooks/useQuery';
import { CreateQuestionParams, CreateQuestionResponse, GetQuestionsResponse } from './types';

export const useGetQuestionsByUserId = (userId: number) => {
  return useGetQuery<GetQuestionsResponse>(
    `/question/${userId}`,
    {
      queryKey: ['questions', userId],
      enabled: !!userId,
    }
  );
};

export const useCreateQuestion = () => {
  return usePostMutation<CreateQuestionResponse, CreateQuestionParams>(
    '/question',
    {
      showSuccessMessage: '�8t 1�<\ �1ȵ��.',
      invalidateQueries: [['questions']],
    }
  );
};