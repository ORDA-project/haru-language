import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { writingApi } from "./api";
import {
  CorrectWritingParams,
  TranslateWritingParams,
  WritingQuestion,
  WritingCorrection,
  WritingTranslation,
} from "./types";

// 더미 데이터 생성 함수 (API 문서 예시 기반)
const generateDummyWritingQuestions = (): WritingQuestion[] => {
  return [
    {
      id: 1,
      englishQuestion: "What is your favorite hobby and why?",
      koreanQuestion:
        "당신이 가장 좋아하는 취미는 무엇이며, 그 이유는 무엇인가요?",
    },
    {
      id: 2,
      englishQuestion: "Describe a memorable trip you have taken.",
      koreanQuestion: "당신이 기억에 남는 여행을 묘사해 주세요.",
    },
    {
      id: 3,
      englishQuestion:
        "What are the advantages and disadvantages of online learning?",
      koreanQuestion: "온라인 학습의 장점과 단점은 무엇인가요?",
    },
    {
      id: 4,
      englishQuestion:
        "If you could have any superpower, what would it be and why?",
      koreanQuestion:
        "어떤 초능력을 가질 수 있다면, 무엇을 선택하고 그 이유는 무엇인가요?",
    },
    {
      id: 5,
      englishQuestion:
        "Who is your role model and how have they influenced you?",
      koreanQuestion:
        "당신의 롤 모델은 누구이며, 그들은 당신에게 어떤 영향을 미쳤나요?",
    },
  ];
};

// Writing 질문들 조회
export const useWritingQuestions = () => {
  const query = useQuery({
    queryKey: ["writingQuestions"],
    queryFn: writingApi.getWritingQuestions,
  });

  // API 오류 시 더미 데이터 반환
  if (
    query.isError ||
    (query.data && (!query.data.data || query.data.data.length === 0))
  ) {
    return {
      ...query,
      data: {
        message: "더미 데이터로 표시됩니다",
        data: generateDummyWritingQuestions(),
      },
    };
  }

  return query;
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

// 더미 첨삭 결과 생성
const generateDummyCorrection = (originalText: string): WritingCorrection => {
  return {
    originalText: originalText,
    processedText: originalText
      .replace(/i /g, "I ")
      .replace(/i'm/g, "I'm")
      .replace(/i've/g, "I've"),
    hasErrors:
      originalText !==
      originalText
        .replace(/i /g, "I ")
        .replace(/i'm/g, "I'm")
        .replace(/i've/g, "I've"),
    feedback: [
      "대문자 사용을 확인해주세요. 문장의 첫 글자와 'I'는 항상 대문자로 써야 합니다.",
      "전반적으로 좋은 문장입니다! 더 자연스러운 표현을 위해 동사 시제를 확인해보세요.",
    ],
  };
};

// 문장 첨삭
export const useCorrectWriting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CorrectWritingParams) => {
      try {
        return await writingApi.correctWriting(params);
      } catch (error) {
        // API 오류 시 더미 데이터 반환
        console.log("API 오류 발생, 더미 데이터 사용");
        return {
          message: "더미 데이터로 표시됩니다",
          data: generateDummyCorrection(params.text),
        };
      }
    },
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

// 더미 번역 결과 생성 (API 문서 예시 기반)
const generateDummyTranslation = (koreanText: string): WritingTranslation => {
  // 사용자 답변을 기반으로 문장 단위로 나누어서 단어 배열 연습 제공
  let sentencePairs: any[] = [];

  if (koreanText.includes("아침") && koreanText.includes("저녁")) {
    // API 문서 예시: "나는 아침에 커피를 마시고, 저녁에는 산책을 한다."
    sentencePairs = [
      {
        originalSentence: "I drink coffee in the morning.",
        shuffledWords: ["coffee", "I", "morning.", "in", "drink", "the"],
      },
      {
        originalSentence: "I take a walk in the evening.",
        shuffledWords: ["walk", "in", "the", "evening.", "I", "take", "a"],
      },
    ];
  } else if (koreanText.includes("취미")) {
    sentencePairs = [
      {
        originalSentence: "My favorite hobby is reading books.",
        shuffledWords: ["My", "favorite", "hobby", "is", "reading", "books."],
      },
      {
        originalSentence: "I enjoy it because it helps me relax.",
        shuffledWords: [
          "I",
          "enjoy",
          "it",
          "because",
          "it",
          "helps",
          "me",
          "relax.",
        ],
      },
    ];
  } else if (koreanText.includes("여행")) {
    sentencePairs = [
      {
        originalSentence: "I went to Japan last summer.",
        shuffledWords: ["I", "went", "to", "Japan", "last", "summer."],
      },
      {
        originalSentence: "It was an amazing experience.",
        shuffledWords: ["It", "was", "an", "amazing", "experience."],
      },
    ];
  } else {
    // 기본 예시
    sentencePairs = [
      {
        originalSentence: "I think this is a great opportunity.",
        shuffledWords: [
          "I",
          "think",
          "this",
          "is",
          "a",
          "great",
          "opportunity.",
        ],
      },
    ];
  }

  return {
    originalText: koreanText,
    sentencePairs: sentencePairs,
    feedback: [
      "번역이 정확합니다! 자연스러운 영어 표현을 잘 사용했어요.",
      "문법적으로 올바른 문장입니다. 더 다양한 표현을 시도해보세요.",
    ],
  };
};

// 한국어 → 영어 번역
export const useTranslateWriting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TranslateWritingParams) => {
      try {
        return await writingApi.translateWriting(params);
      } catch (error) {
        // API 오류 시 더미 데이터 반환
        console.log("API 오류 발생, 더미 데이터 사용");
        return {
          message: "더미 데이터로 표시됩니다",
          data: generateDummyTranslation(params.text),
        };
      }
    },
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
