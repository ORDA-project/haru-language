import { http } from "../../utils/http";
import {
  CorrectWritingParams,
  CorrectWritingResponse,
  TranslateWritingParams,
  TranslateWritingResponse,
  GetWritingQuestionsResponse,
  GetWritingQuestionResponse,
  GetWritingRecordsResponse,
} from "./types";

export const writingApi = {
  // 모든 Writing 질문 조회
  getWritingQuestions: (): Promise<GetWritingQuestionsResponse> => {
    return http.get("/writing/questions");
  },

  // 특정 Writing 질문 조회
  getWritingQuestion: (
    writingQuestionId: number
  ): Promise<GetWritingQuestionResponse> => {
    return http.get(`/writing/question/${writingQuestionId}`);
  },

  // 문장 첨삭
  correctWriting: (
    params: CorrectWritingParams
  ): Promise<CorrectWritingResponse> => {
    return http.post("/writing/correct", { json: params });
  },

  // 한국어 → 영어 번역
  translateWriting: (
    params: TranslateWritingParams
  ): Promise<TranslateWritingResponse> => {
    return http.post("/writing/translate", { json: params });
  },

  // 영어 → 한국어 번역
  translateEnglishToKorean: (
    params: TranslateWritingParams
  ): Promise<TranslateWritingResponse> => {
    return http.post("/writing/translate-english", { json: params });
  },

  // 사용자의 모든 Writing 기록 조회
  getWritingRecords: (): Promise<GetWritingRecordsResponse> => {
    return http.get("/writing/records");
  },

  // 특정 Writing 질문에 대한 사용자의 기록 조회
  getWritingRecordsByQuestion: (
    userId: number,
    writingQuestionId: number
  ): Promise<GetWritingRecordsResponse> => {
    return http.get(`/writing-question/records/${userId}/${writingQuestionId}`);
  },
};
