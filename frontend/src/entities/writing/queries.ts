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
      example: {
        korean:
          "나는 게임을 진짜 사랑한다고 생각해. 나는 보드게임을 좋아하지 않지만, 다른 게임들은 좋아해. 나는 독서도 좋아해.",
        english:
          "I like playing games like board game. I don't like playing any game. I like reading books.",
      },
    },
    {
      id: 2,
      englishQuestion: "Describe a memorable trip you have taken.",
      koreanQuestion: "당신이 기억에 남는 여행을 묘사해 주세요.",
      example: {
        korean: "나는 작년 여름에 일본을 여행했다. 정말 멋진 경험이었다.",
        english:
          "I traveled to Japan last summer. It was a wonderful experience.",
      },
    },
    {
      id: 3,
      englishQuestion:
        "What are the advantages and disadvantages of online learning?",
      koreanQuestion: "온라인 학습의 장점과 단점은 무엇인가요?",
      example: {
        korean: "온라인 학습은 편리하지만 집중하기 어렵다.",
        english: "Online learning is convenient but hard to concentrate.",
      },
    },
    {
      id: 4,
      englishQuestion:
        "If you could have any superpower, what would it be and why?",
      koreanQuestion:
        "어떤 초능력을 가질 수 있다면, 무엇을 선택하고 그 이유는 무엇인가요?",
      example: {
        korean:
          "나는 시간을 멈출 수 있는 능력을 원한다. 더 많은 일을 할 수 있기 때문이다.",
        english:
          "I want the ability to stop time. Because I can do more things.",
      },
    },
    {
      id: 5,
      englishQuestion:
        "Who is your role model and how have they influenced you?",
      koreanQuestion:
        "당신의 롤 모델은 누구이며, 그들은 당신에게 어떤 영향을 미쳤나요?",
      example: {
        korean:
          "나의 롤모델은 선생님이다. 그들은 나에게 인내심을 가르쳐주었다.",
        english: "My role model is my teacher. They taught me patience.",
      },
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
export const useWritingRecords = () => {
  return useQuery({
    queryKey: ["writingRecords"],
    queryFn: () => writingApi.getWritingRecords(),
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
        return {
          message: "더미 데이터로 표시됩니다",
          data: generateDummyCorrection(params.text),
        };
      }
    },
    onSuccess: (data, variables) => {
      // 관련 쿼리 무효화 (JWT에서 userId 가져오므로 queryKey에서 userId 제거)
      queryClient.invalidateQueries({
        queryKey: ["writingRecords"],
      });
      queryClient.invalidateQueries({
        queryKey: ["writingRecords", variables.writingQuestionId],
      });
    },
  });
};

// 더미 영어→한국어 번역 결과 생성
const generateDummyEnglishToKoreanTranslation = (
  englishText: string
): WritingTranslation => {
  // 사용자 입력을 문장 단위로 분할
  const sentences = englishText
    .split(/[.!?]\s*/)
    .filter((s) => s.trim().length > 0);

  // 각 문장을 한국어로 번역 (간단한 더미 번역)
  const sentencePairs = sentences.map((sentence, index) => {
    const trimmedSentence = sentence.trim();

    // 간단한 더미 번역 로직 (실제로는 GPT API를 사용해야 함)
    let koreanTranslation = "";

    if (trimmedSentence.includes("game")) {
      if (
        trimmedSentence.includes("casual") ||
        trimmedSentence.includes("simple")
      ) {
        koreanTranslation = "나는 사소한 게임만 한다.";
      } else if (trimmedSentence.includes("Animal Crossing")) {
        koreanTranslation = "나는 동물의 숲을 제일 좋아한다.";
      } else if (
        trimmedSentence.includes("people") ||
        trimmedSentence.includes("together")
      ) {
        koreanTranslation = "나는 사람이랑 같이 게임하는 것을 좋아하지 않는다.";
      } else {
        koreanTranslation = "나는 게임을 즐긴다.";
      }
    } else if (
      trimmedSentence.includes("book") ||
      trimmedSentence.includes("read")
    ) {
      koreanTranslation = "나는 책 읽기를 즐긴다.";
    } else if (trimmedSentence.includes("travel")) {
      koreanTranslation = "나는 여행을 사랑한다.";
    } else if (
      trimmedSentence.includes("food") ||
      trimmedSentence.includes("eat")
    ) {
      koreanTranslation = "나는 다양한 음식을 시도하는 것을 좋아한다.";
    } else {
      // 기본 번역
      koreanTranslation = `이것은 ${index + 1}번째 문장입니다.`;
    }

    // 한국어 문장을 단어로 분할하고 섞기
    const words = koreanTranslation.split(" ");
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);

    return {
      englishSentence: trimmedSentence,
      originalSentence: koreanTranslation, // 백엔드 API 구조: originalSentence가 번역된 문장
      shuffledWords: shuffledWords,
    };
  });

  return {
    originalText: englishText,
    sentencePairs: sentencePairs,
    feedback: [
      "영어 문장을 자연스러운 한국어로 잘 번역했습니다!",
      "한국어 문장 구조를 올바르게 이해하고 있어요.",
    ],
    example: {
      korean:
        "나는 게임을 진짜 사랑한다고 생각해. 나는 보드게임을 좋아하지 않지만, 다른 게임들은 좋아해. 나는 독서도 좋아해.",
      english:
        "I like playing games like board game. I don't like playing any game. I like reading books.",
    },
  };
};

// 한국어 → 영어 번역
export const useTranslateWriting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TranslateWritingParams) => {
      const result = await writingApi.translateWriting(params);
      return result;
    },
    onSuccess: (data, variables) => {
      // 관련 쿼리 무효화 (JWT에서 userId 가져오므로 queryKey에서 userId 제거)
      queryClient.invalidateQueries({
        queryKey: ["writingRecords"],
      });
      queryClient.invalidateQueries({
        queryKey: ["writingRecords", variables.writingQuestionId],
      });
    },
  });
};

// 영어 → 한국어 번역
export const useTranslateEnglishToKorean = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TranslateWritingParams) => {
      const result = await writingApi.translateEnglishToKorean(params);
      return result;
    },
    onSuccess: (data, variables) => {
      // 관련 쿼리 무효화 (JWT에서 userId 가져오므로 queryKey에서 userId 제거)
      queryClient.invalidateQueries({
        queryKey: ["writingRecords"],
      });
      queryClient.invalidateQueries({
        queryKey: ["writingRecords", variables.writingQuestionId],
      });
    },
  });
};
