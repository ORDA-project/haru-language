import { useGetQuery, usePostMutation } from "../../hooks/useQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { questionApi } from "./api";
import {
  CreateQuestionParams,
  CreateQuestionResponse,
  GetQuestionsResponse,
} from "./types";

export const useGetQuestionsByUserId = (userId?: number) => {
  // 보안: JWT 기반 인증 사용 - userId 파라미터는 사용하지 않음
  // userId가 전달되어도 무시하고 JWT 토큰으로 인증
  const endpoint = "/question";
  
  const query = useGetQuery<GetQuestionsResponse>(endpoint, {
    queryKey: ["questions", "current"], // userId 제거
    retry: false, // 404 에러는 재시도하지 않음
    refetchOnWindowFocus: false, // 포커스 시 재요청 방지
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    showErrorToast: false, // 인증 오류는 정상적인 상황일 수 있으므로 토스트 표시 안함
  });

  // 인증 오류(401)인 경우: 더미 데이터 대신 빈 배열 반환
  if (query.isError) {
    const error = query.error as any;
    // 401 인증 오류인 경우 빈 데이터 반환 (더미 데이터 사용 안함)
    if (error?.status === 401 || error?.code === "UNAUTHORIZED") {
      return {
        ...query,
        data: {
          message: "로그인이 필요합니다.",
          data: [],
        },
      };
    }
    
    // 기타 오류인 경우에도 더미 데이터 사용 안함 (빈 배열 반환)
    return {
      ...query,
      data: {
        message: "데이터를 불러올 수 없습니다.",
        data: [],
      },
    };
  }

  // 정상 응답이지만 데이터가 비어있는 경우
  if (query.data && (!query.data.data || query.data.data.length === 0)) {
    return {
      ...query,
      data: {
        message: query.data.message || "학습 기록이 없습니다.",
        data: [],
      },
    };
  }

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

// 질문 기록 삭제
export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questionId: number) => {
      return await questionApi.deleteQuestion(questionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["questions", "current"] });
    },
  });
};
