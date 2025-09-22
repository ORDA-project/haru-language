import { useGetQuery, usePostMutation } from "../../hooks/useQuery";
import {
  CreateQuestionParams,
  CreateQuestionResponse,
  GetQuestionsResponse,
} from "./types";

export const useGetQuestionsByUserId = (userId: number) => {
  return useGetQuery<GetQuestionsResponse>(`/question/${userId}`, {
    queryKey: ["questions", userId],
    enabled: !!userId,
  });
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
