import { useGetQuery, usePostMutation } from "../../hooks/useQuery";
import {
  CreateQuestionParams,
  CreateQuestionResponse,
  GetQuestionsResponse,
  Question,
} from "./types";

// 더미 데이터 생성 함수
const generateDummyQuestions = (): Question[] => {
  const questions: Question[] = [];

  // 이미지와 동일한 고정된 더미 데이터 (구체적인 학습 내용 포함)
  const dummyData = [
    // 2024-09-30
    {
      date: "2024-09-30",
      content: "오늘 학습의 관심사가 무엇인가요?",
      answer: "회화, 독해, 문법분석, 비즈니스, 어휘 중에서 선택해주세요.",
    },
    {
      date: "2024-09-30",
      content: "어떻게 학습하고 싶으신가요?",
      answer: "채팅 또는 카메라를 선택해주세요.",
    },
    {
      date: "2024-09-30",
      content: "챕터 명, 예문문장이 잘 보이게 찍어주세요!",
      answer:
        "How Do You Feel Today? 이미지 분석 결과: 'How do you feel today?'는 한국어로 '오늘 기분이 어때?' 또는 '오늘은 어떻게 느껴?'로 번역됩니다. 주로 상대방의 감정이나 컨디션에 대해 묻는 표현으로, 친근하고 일상적인 대화에서 자주 사용됩니다. 컨디션을 물을 때: A: You looked tired yesterday. How do you feel today? / A: 어제 피곤해 보이던데, 오늘은 어때? / B: Much better, I got some good rest. / B: 훨씬 나아졌어. 푹 쉬었거든.",
    },
    // 2024-09-24
    {
      date: "2024-09-24",
      content: "how do you feel today?",
      answer: "'밥 먹었냐?'와 비슷한 표현",
    },
    {
      date: "2024-09-24",
      content: "What's the weather like?",
      answer: "날씨가 어떤가요?",
    },
    // 2024-09-18
    {
      date: "2024-09-18",
      content: "나 일 한지 벌써 1년 되었어.",
      answer: "Since, During, After, Up...",
    },
    {
      date: "2024-09-18",
      content: "I've been working here for a year.",
      answer: "여기서 일한 지 1년이 되었어요.",
    },
    // 2024-09-10
    {
      date: "2024-09-10",
      content: "내 취미는 차 마시기야.",
      answer: "Work out, Bake, Go to a...",
    },
    {
      date: "2024-09-10",
      content: "My hobby is drinking tea.",
      answer: "제 취미는 차 마시기입니다.",
    },
    // 2024-09-05
    {
      date: "2024-09-05",
      content: "Do you like sweets?",
      answer: "I don't like. I like bitter t...",
    },
    {
      date: "2024-09-05",
      content: "What's your favorite dessert?",
      answer: "좋아하는 디저트가 뭐예요?",
    },
    // 2024-08-29
    {
      date: "2024-08-29",
      content: "요즘 유행하는",
      answer: "What's popular these da...",
    },
    {
      date: "2024-08-29",
      content: "What's trending these days?",
      answer: "요즘 트렌드가 뭐예요?",
    },
  ];

  dummyData.forEach((item, index) => {
    questions.push({
      id: index + 1,
      content: item.content,
      created_at: item.date + "T10:00:00.000Z",
      Answers: [
        {
          content: item.answer,
        },
      ],
    });
  });

  return questions.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

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
