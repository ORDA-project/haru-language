import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetQuestionsByUserId } from "../../entities/questions/queries";
import { Question } from "../../entities/questions/types";
import NavBar from "../Templates/Navbar";

const QuestionDetail = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);

  // 보안: JWT 기반 인증 사용 - URL에서 userId 제거
  // 해당 날짜의 질문들 가져오기 (현재 로그인한 사용자)
  const { data: questionsData, isLoading: questionsLoading } =
    useGetQuestionsByUserId();

  useEffect(() => {
    if (questionsData?.data) {
      // 해당 날짜의 질문들만 필터링
      const dateQuestions = questionsData.data.filter(
        (q) =>
          new Date(q.created_at).toDateString() ===
          new Date(date || "").toDateString()
      );
      setQuestions(dateQuestions);
    }
  }, [questionsData, date]);

  const handleBack = () => {
    navigate(-1);
  };

  if (questionsLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#F7F8FB]">
        <div className="text-[16px] text-[#666]">
          학습 기록을 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-72px)] flex flex-col max-w-[440px] mx-auto bg-[#F7F8FB] shadow-[0_0_10px_0_rgba(0,0,0,0.1)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <button
          onClick={handleBack}
          className="w-8 h-8 flex items-center justify-center"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-800">
            {new Date(date || "").toLocaleDateString("ko-KR", {
              month: "2-digit",
              day: "2-digit",
              weekday: "short",
            })}
          </h1>
        </div>
        <div className="w-8"></div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {questions.map((question, index) => (
          <div key={question.id} className="space-y-4">
            {/* User Question */}
            <div className="flex justify-end">
              <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {question.content}
                </p>
              </div>
            </div>

            {/* AI Response */}
            {question.Answers && question.Answers.length > 0 && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100">
                  <div className="text-sm leading-relaxed">
                    {question.Answers[0].content.includes(
                      "회화, 독해, 문법분석"
                    ) ? (
                      // 버튼 형태의 응답
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 mb-3">
                          {question.Answers[0].content}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button className="px-3 py-2 bg-[#00DAAA] text-white text-xs rounded-full">
                            회화
                          </button>
                          <button className="px-3 py-2 bg-white text-gray-700 text-xs rounded-full border border-gray-300">
                            독해
                          </button>
                          <button className="px-3 py-2 bg-white text-gray-700 text-xs rounded-full border border-gray-300">
                            문법분석
                          </button>
                          <button className="px-3 py-2 bg-white text-gray-700 text-xs rounded-full border border-gray-300">
                            비즈니스
                          </button>
                          <button className="px-3 py-2 bg-white text-gray-700 text-xs rounded-full border border-gray-300">
                            어휘
                          </button>
                        </div>
                      </div>
                    ) : question.Answers[0].content.includes(
                        "채팅 또는 카메라"
                      ) ? (
                      // 채팅/카메라 선택 버튼
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 mb-3">
                          {question.Answers[0].content}
                        </p>
                        <div className="flex gap-2">
                          <button className="px-4 py-2 bg-white text-gray-700 text-sm rounded-full border border-gray-300">
                            채팅
                          </button>
                          <button className="px-4 py-2 bg-[#00DAAA] text-white text-sm rounded-full">
                            카메라
                          </button>
                        </div>
                      </div>
                    ) : question.Answers[0].content.includes(
                        "How Do You Feel Today"
                      ) ? (
                      // 이미지와 상세 설명이 포함된 응답
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h3 className="font-semibold text-gray-800 mb-3">
                            How Do You Feel Today?
                          </h3>
                          <div className="bg-gray-100 rounded-lg p-4 mb-3">
                            <div className="text-sm text-gray-600 space-y-2">
                              <p>A: How do you feel today?</p>
                              <p>B: Not so good.</p>
                              <p>A: What's the matter?</p>
                              <p>B: I have a headache.</p>
                              <p>A: I'm sorry to hear that.</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 leading-relaxed">
                          <p className="mb-3">
                            <strong>'How do you feel today?'</strong>는 한국어로{" "}
                            <strong>'오늘 기분이 어때?'</strong> 또는{" "}
                            <strong>'오늘은 어떻게 느껴?'</strong>로 번역됩니다.
                            주로 상대방의 감정이나 컨디션에 대해 묻는 표현으로,
                            친근하고 일상적인 대화에서 자주 사용됩니다.
                          </p>
                          <div className="bg-[#E8F5E8] rounded-lg p-3 border border-[#4A7C59]">
                            <h4 className="font-semibold text-[#2D5A2D] mb-2">
                              컨디션을 물을 때
                            </h4>
                            <div className="text-sm text-[#2D5A2D] space-y-1">
                              <p>
                                A: You looked tired yesterday. How do you feel
                                today?
                              </p>
                              <p>A: 어제 피곤해 보이던데, 오늘은 어때?</p>
                              <p>B: Much better, I got some good rest.</p>
                              <p>B: 훨씬 나아졌어. 푹 쉬었거든.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // 일반 텍스트 응답
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {question.Answers[0].content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {questions.length === 0 && (
          <div className="flex justify-center items-center py-8">
            <div className="text-center text-gray-500">
              <p className="text-sm">이 날짜에는 학습 기록이 없습니다.</p>
              <p className="text-xs mt-1">새로운 질문을 해보세요!</p>
            </div>
          </div>
        )}
      </div>

      <NavBar currentPage={"QuestionDetail"} />
    </div>
  );
};

export default QuestionDetail;
