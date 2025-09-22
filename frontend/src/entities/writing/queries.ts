import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { writingApi } from "./api";
import { CorrectWritingParams, TranslateWritingParams } from "./types";

// Writing 질문들 조회
export const useWritingQuestions = () => {
  return useQuery({
    queryKey: ["writingQuestions"],
    queryFn: writingApi.getWritingQuestions,
  });
};

// 특정 Writing 질문 조회
export const useWritingQuestion = (writingQuestionId: number) => {
  return useQuery({
    queryKey: ["writingQuestion", writingQuestionId],
    queryFn: () => writingApi.getWritingQuestion(writingQuestionId),
    enabled: !!writingQuestionId,
  });
};

// 사용자의 Writing 기록 조회
export const useWritingRecords = (userId: number) => {
  return useQuery({
    queryKey: ["writingRecords", userId],
    queryFn: () => writingApi.getWritingRecords(userId),
    enabled: !!userId,
  });
};

// 특정 질문에 대한 사용자의 Writing 기록 조회
export const useWritingRecordsByQuestion = (
  userId: number,
  writingQuestionId: number
) => {
  return useQuery({
    queryKey: ["writingRecords", userId, writingQuestionId],
    queryFn: () =>
      writingApi.getWritingRecordsByQuestion(userId, writingQuestionId),
    enabled: !!userId && !!writingQuestionId,
  });
};

// 문장 첨삭
export const useCorrectWriting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CorrectWritingParams) =>
      writingApi.correctWriting(params),
    onSuccess: (data, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["writingRecords", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "writingRecords",
          variables.userId,
          variables.writingQuestionId,
        ],
      });
    },
  });
};

// 한국어 → 영어 번역
export const useTranslateWriting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: TranslateWritingParams) =>
      writingApi.translateWriting(params),
    onSuccess: (data, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["writingRecords", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "writingRecords",
          variables.userId,
          variables.writingQuestionId,
        ],
      });
    },
  });
};
