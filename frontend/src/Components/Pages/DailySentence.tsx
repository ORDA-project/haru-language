import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Icons } from "../Elements/Icons";
import Navbar from "../Templates/Navbar";

interface WritingQuestion {
  id: number;
  englishQuestion: string;
  koreanQuestion: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const OneSentence = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] =
    useState<WritingQuestion | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Writing 질문들 조회
  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ["writingQuestions"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/writing/questions`);
      if (!response.ok) throw new Error("Failed to fetch writing questions");
      return response.json();
    },
  });

  useEffect(() => {
    if (questionsData?.data && questionsData.data.length > 0) {
      // 첫 번째 질문을 오늘의 문장으로 설정
      setCurrentQuestion(questionsData.data[0]);
    }
  }, [questionsData]);

  const recentQuestions = questionsData?.data
    ? questionsData.data.slice(1, 6)
    : []; // 최근 5개

  const playAudio = async () => {
    if (!currentQuestion) return;

    try {
      setIsPlaying(true);
      // 실제로는 TTS API를 호출하여 음성을 생성
      // 여기서는 임시로 음성 재생 시뮬레이션
      setTimeout(() => {
        setIsPlaying(false);
      }, 2000);
    } catch (error) {
      console.error("음성 재생 실패:", error);
      setIsPlaying(false);
    }
  };

  const formatDate = () => {
    const today = new Date();
    return `${today.getMonth() + 1}월 ${today.getDate()}일`;
  };

  if (questionsLoading || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="daily-sentence" />

      {/* Header */}
      <div className="bg-white px-4 py-4 border-b">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2">
            <Icons.arrowLeft />
          </button>
          <h1 className="text-lg font-bold">오늘의 한줄 영어</h1>
          <div className="w-8" />
        </div>
      </div>

      {/* Today's Sentence */}
      <div className="px-4 py-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border-4 border-[#00DAAA]">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-[#00E8B6] px-3 py-1 rounded-full">
              <span className="text-sm font-bold">오늘의 문장</span>
            </div>
            <span className="text-sm text-gray-500">{formatDate()}</span>
          </div>

          <div className="space-y-4 mb-6">
            <div className="text-2xl font-bold text-gray-900">
              {currentQuestion.englishQuestion}
            </div>
            <div className="text-xl text-gray-700">
              {currentQuestion.koreanQuestion}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={playAudio}
              disabled={isPlaying}
              className="flex items-center space-x-2 bg-[#00DAAA] text-white px-4 py-2 rounded-full disabled:opacity-50"
            >
              <Icons.speaker />
              <span className="text-sm font-medium">
                {isPlaying ? "재생 중..." : "발음 듣기"}
              </span>
            </button>

            <button className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-full">
              <Icons.download />
              <span className="text-sm font-medium">저장</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Questions */}
      <div className="px-4 pb-6">
        <h2 className="text-lg font-bold mb-4">최근 문장</h2>
        <div className="space-y-3">
          {recentQuestions.map((question: WritingQuestion) => (
            <div
              key={question.id}
              className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setCurrentQuestion(question)}
            >
              <div className="space-y-2">
                <div className="text-lg font-semibold text-gray-900">
                  {question.englishQuestion}
                </div>
                <div className="text-base text-gray-600">
                  {question.koreanQuestion}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => navigate("/quiz")}
          className="bg-[#00DAAA] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <Icons.quiz />
        </button>
      </div>
    </div>
  );
};

export default OneSentence;
