import React, { useState } from "react";
import { Example } from "../../types"; // Import Example type
import { API_ENDPOINTS } from "../../config/api";

interface StageResultProps {
  description: string;
  examples: Example[];
  errorMessage: string;
  setStage: React.Dispatch<React.SetStateAction<number>>;
}

const StageResult = ({
  description,
  examples,
  errorMessage,
  setStage,
}: StageResultProps) => {
  // currentIndex 상태 추가
  const [currentIndex, setCurrentIndex] = useState(0);

  // 다음 카드로 이동하는 함수
  const handleNextCard = () => {
    if (currentIndex < examples.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // 이전 카드로 이동하는 함수
  const handlePreviousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // 점을 클릭하여 특정 카드로 이동
  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  // tts 함수
  const handleTTS = async () => {
    const dialogueA = examples[currentIndex].dialogue.A.english;
    const dialogueB = examples[currentIndex].dialogue.B.english;

    // 두 텍스트를 결합
    const textToRead = `${dialogueA}\n${dialogueB}\n${dialogueA}\n${dialogueB}\n${dialogueA}\n${dialogueB}`;

    console.log(textToRead);

    try {
      const response = await fetch(API_ENDPOINTS.tts, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: textToRead }), // 두 텍스트를 결합하여 전송
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("TTS 요청에 실패했습니다.");
      }

      const { audioContent } = await response.json();
      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      audio.play();
      console.log(audioContent);
    } catch (error) {
      console.error("TTS 오류:", error);
    }
  };

  // Debug: 콘솔에 데이터 확인
  console.log("Description:", description);
  console.log("Examples:", examples);
  console.log("Examples length:", examples.length);
  console.log("Current example:", examples[currentIndex]);

  if (examples.length === 0) {
    return (
      <div className="w-full h-[calc(100vh-100px)] flex flex-col items-center justify-center">
        <div className="text-center p-8">
          <p className="text-lg text-gray-600">
            예문을 불러오는 중 문제가 발생했습니다.
          </p>
          <button
            onClick={() => setStage(1)}
            className="mt-4 px-6 py-3 bg-teal-400 text-white rounded-lg"
          >
            다시 시도하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#F7F8FB]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <button
          onClick={() => setStage(1)}
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
          <h1 className="text-lg font-semibold text-gray-800">예문 생성</h1>
        </div>
        <div className="w-8"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Description Section */}
        {description && (
          <div className="mb-6 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-800 text-center font-medium leading-relaxed">
              {description}
            </p>
          </div>
        )}

        {/* Examples Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Pagination Dots */}
          {examples.length > 1 && (
            <div className="flex justify-center py-4 border-b border-gray-100">
              {examples.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 mx-1 rounded-full transition-colors ${
                    index === currentIndex ? "bg-[#00DAAA]" : "bg-gray-300"
                  }`}
                  onClick={() => handleDotClick(index)}
                />
              ))}
            </div>
          )}

          {/* Context Badge */}
          <div className="p-4 text-center border-b border-gray-100">
            <span className="inline-block px-4 py-2 bg-[#00DAAA] text-white rounded-full text-sm font-medium">
              {examples[currentIndex]?.context}
            </span>
          </div>

          {/* Dialogue */}
          <div className="p-6 space-y-6">
            {/* A's dialogue */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-[#00DAAA] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium leading-relaxed text-base">
                    {examples[currentIndex]?.dialogue?.A?.english}
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    {examples[currentIndex]?.dialogue?.A?.korean}
                  </p>
                </div>
              </div>
            </div>

            {/* B's dialogue */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium leading-relaxed text-base">
                    {examples[currentIndex]?.dialogue?.B?.english}
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    {examples[currentIndex]?.dialogue?.B?.korean}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center p-6 border-t border-gray-100">
            {/* Previous Button */}
            <button
              onClick={handlePreviousCard}
              disabled={currentIndex === 0}
              className={`p-3 rounded-full transition-colors ${
                currentIndex === 0
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-gray-100 active:bg-gray-200"
              }`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="text-gray-600"
              >
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* TTS Button */}
            <button
              onClick={handleTTS}
              className="w-14 h-14 bg-[#00DAAA] hover:bg-[#00C495] active:bg-[#00B085] rounded-full flex items-center justify-center transition-colors shadow-lg"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4l-5 5H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            </button>

            {/* Next Button */}
            <button
              onClick={handleNextCard}
              disabled={currentIndex === examples.length - 1}
              className={`p-3 rounded-full transition-colors ${
                currentIndex === examples.length - 1
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-gray-100 active:bg-gray-200"
              }`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="text-gray-600"
              >
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Generate New Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setStage(1)}
            className="px-8 py-3 bg-[#00DAAA] hover:bg-[#00C495] active:bg-[#00B085] text-white font-semibold rounded-full transition-colors shadow-lg"
          >
            다른 예문 생성하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default StageResult;
