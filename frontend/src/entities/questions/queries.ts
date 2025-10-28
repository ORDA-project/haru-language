import { useGetQuery, usePostMutation } from "../../hooks/useQuery";
import {
  CreateQuestionParams,
  CreateQuestionResponse,
  GetQuestionsResponse,
  Question,
} from "./types";

export const useGetQuestionsByUserId = (userId: number) => {
  const query = useGetQuery<GetQuestionsResponse>(`/question/${userId}`, {
    queryKey: ["questions", userId],
    enabled: !!userId,
    retry: 2, // 네트워크 오류 시 2번 재시도
    onError: (error) => {
      console.error("질문 데이터 조회 실패:", error);
    },
  });

  return query;
};

export const useCreateQuestion = () => {
  return usePostMutation<CreateQuestionResponse, CreateQuestionParams>(
    "/question",
    {
      showSuccessMessage: "Question Created Successfully",
      invalidateQueries: [["questions"]],
    }
  );
};
