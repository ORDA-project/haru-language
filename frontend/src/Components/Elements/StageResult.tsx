import React, { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { Example } from "../../types";
import { API_ENDPOINTS } from "../../config/api";
import { isLargeTextModeAtom } from "../../store/dataStore";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StageResultProps {
  description: string;
  examples: Example[];
  extractedText?: string;
  uploadedImage?: string | null;
  errorMessage: string;
  setStage: React.Dispatch<React.SetStateAction<number>>;
}

const StageResult = ({
  description,
  examples,
  extractedText,
  uploadedImage,
  errorMessage,
  setStage,
}: StageResultProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  
  // 큰글씨 모드에 따른 텍스트 크기 (px 단위로 명시적 설정)
  const baseFontSize = isLargeTextMode ? 20 : 16;
  const smallFontSize = isLargeTextMode ? 18 : 14;
  const xSmallFontSize = isLargeTextMode ? 16 : 12;
  const headerFontSize = isLargeTextMode ? 24 : 20;
  
  // 스타일 객체 생성
  const baseTextStyle: React.CSSProperties = { 
    fontSize: `${baseFontSize}px`, 
    wordBreak: 'keep-all', 
    overflowWrap: 'break-word' as const 
  };
  const smallTextStyle: React.CSSProperties = { 
    fontSize: `${smallFontSize}px`, 
    wordBreak: 'keep-all', 
    overflowWrap: 'break-word' as const 
  };
  const xSmallTextStyle: React.CSSProperties = { 
    fontSize: `${xSmallFontSize}px`, 
    wordBreak: 'keep-all', 
    overflowWrap: 'break-word' as const 
  };
  const headerTextStyle: React.CSSProperties = { 
    fontSize: `${headerFontSize}px` 
  };

  const stopCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCurrentAudio();
    };
  }, []);

  const handleNextCard = () => {
    if (currentIndex < examples.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePreviousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  const handleTTS = async () => {
    const dialogueA = examples[currentIndex].dialogue.A.english;
    const dialogueB = examples[currentIndex].dialogue.B.english;

    stopCurrentAudio();

    const textToRead = `${dialogueA}\n${dialogueB}`;

    try {
      const response = await fetch(API_ENDPOINTS.tts, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: textToRead }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("TTS 요청에 실패했습니다.");
      }

      const { audioContent } = await response.json();
      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);

      audioRef.current = audio;
      audio.onended = () => {
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
      };
      audio.onerror = () => {
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
      };

      await audio.play();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("TTS 오류:", error);
      }
      stopCurrentAudio();
    }
  };

  if (examples.length === 0) {
    return (
      <div className="w-full h-[calc(100vh-100px)] flex flex-col items-center justify-center">
        <div className="text-center p-8">
          <p className="text-gray-600" style={baseTextStyle}>
            예문을 불러오는 중 문제가 발생했습니다.
          </p>
          <button
            onClick={() => setStage(1)}
            className={`mt-4 ${isLargeTextMode ? "px-8 py-4" : "px-6 py-3"} bg-teal-400 text-white rounded-lg`}
            style={baseTextStyle}
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
      <div className={`flex items-center justify-between ${isLargeTextMode ? "p-5" : "p-4"} bg-white border-b border-gray-200`}>
        <button
          onClick={() => setStage(1)}
          className={`${isLargeTextMode ? "w-10 h-10" : "w-8 h-8"} flex items-center justify-center`}
        >
          <ChevronLeft className={`${isLargeTextMode ? "w-6 h-6" : "w-5 h-5"} text-gray-600`} />
        </button>
        <div className="text-center">
          <h1 className="font-semibold text-gray-800" style={headerTextStyle}>예문 생성</h1>
        </div>
        <div className={isLargeTextMode ? "w-10" : "w-8"}></div>
      </div>

      {/* Chat Messages */}
      <div className={`flex-1 overflow-y-auto ${isLargeTextMode ? "p-5" : "p-4"} ${isLargeTextMode ? "space-y-5" : "space-y-4"}`}>
        {/* AI message: 챕터 명, 예문문장이 잘 보이게 찍어주세요! */}
        <div className="flex justify-start">
          <div className={`max-w-[80%] ${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"} rounded-2xl bg-[#00DAAA] text-gray-900`}>
            <p 
              className="leading-relaxed"
              style={baseTextStyle}
            >
              챕터 명, 예문문장이 잘 보이게 찍어주세요!
            </p>
          </div>
        </div>

        {/* User message: Image and Extracted text */}
        {(uploadedImage || extractedText) && (
          <div className="flex justify-end">
            <div className={`max-w-[80%] ${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"} rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100`}>
              {uploadedImage && (
                <div className={isLargeTextMode ? "mb-4" : "mb-3"}>
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="w-full rounded-lg object-contain max-h-64"
                  />
                </div>
              )}
              {extractedText && (
                <p 
                  className="leading-relaxed whitespace-pre-wrap"
                  style={baseTextStyle}
                >
                  {extractedText}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Bot message: Example carousel */}
        <div className="flex justify-start">
          <div className="max-w-[90%] w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Pagination Dots */}
            {examples.length > 1 && (
              <div className={`flex justify-center ${isLargeTextMode ? "py-4" : "py-3"} border-b border-gray-100`}>
                {examples.map((_, index) => (
                  <button
                    key={index}
                    className={`${isLargeTextMode ? "w-2 h-2" : "w-1.5 h-1.5"} mx-1 rounded-full transition-colors ${
                      index === currentIndex ? "bg-[#00DAAA]" : "bg-gray-300"
                    }`}
                    onClick={() => handleDotClick(index)}
                  />
                ))}
              </div>
            )}

            {/* Context Badge */}
            <div className={`${isLargeTextMode ? "p-5" : "p-4"} text-left border-b border-gray-100`}>
              <span 
                className={`inline-block ${isLargeTextMode ? "px-5 py-2" : "px-4 py-1.5"} bg-[#00DAAA] text-gray-900 rounded-full font-medium`}
                style={xSmallTextStyle}
              >
                {examples[currentIndex]?.context}
              </span>
            </div>

            {/* Dialogue */}
            <div className={`${isLargeTextMode ? "p-5" : "p-4"} ${isLargeTextMode ? "space-y-5" : "space-y-4"}`}>
              {/* A's dialogue */}
              <div className={`flex items-start ${isLargeTextMode ? "space-x-4" : "space-x-3"}`}>
                <div className={`${isLargeTextMode ? "w-12 h-12" : "w-10 h-10"} bg-[#00DAAA] rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white font-bold" style={smallTextStyle}>A</span>
                </div>
                <div className="flex-1">
                  <p 
                    className="text-gray-900 font-medium leading-relaxed"
                    style={baseTextStyle}
                  >
                    {examples[currentIndex]?.dialogue?.A?.english}
                  </p>
                  <p 
                    className={`text-gray-600 ${isLargeTextMode ? "mt-2" : "mt-1"}`}
                    style={xSmallTextStyle}
                  >
                    {examples[currentIndex]?.dialogue?.A?.korean}
                  </p>
                </div>
              </div>

              {/* B's dialogue */}
              <div className={`flex items-start ${isLargeTextMode ? "space-x-4" : "space-x-3"}`}>
                <div className={`${isLargeTextMode ? "w-12 h-12" : "w-10 h-10"} bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white font-bold" style={smallTextStyle}>B</span>
                </div>
                <div className="flex-1">
                  <p 
                    className="text-gray-900 font-medium leading-relaxed"
                    style={baseTextStyle}
                  >
                    {examples[currentIndex]?.dialogue?.B?.english}
                  </p>
                  <p 
                    className={`text-gray-600 ${isLargeTextMode ? "mt-2" : "mt-1"}`}
                    style={xSmallTextStyle}
                  >
                    {examples[currentIndex]?.dialogue?.B?.korean}
                  </p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className={`flex justify-between items-center ${isLargeTextMode ? "p-5" : "p-4"} border-t border-gray-100`}>
              {/* Previous Button */}
              <button
                onClick={handlePreviousCard}
                disabled={currentIndex === 0}
                className={`${isLargeTextMode ? "p-3" : "p-2"} rounded-full transition-colors ${
                  currentIndex === 0
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:bg-gray-100 active:bg-gray-200"
                }`}
              >
                <ChevronLeft className={`${isLargeTextMode ? "w-6 h-6" : "w-5 h-5"} text-gray-600`} />
              </button>

              {/* TTS Button */}
              <button
                onClick={handleTTS}
                className={`${isLargeTextMode ? "w-14 h-14" : "w-12 h-12"} bg-[#00DAAA] hover:bg-[#00C495] active:bg-[#00B085] rounded-full flex items-center justify-center transition-colors shadow-lg`}
              >
                <svg width={isLargeTextMode ? "24" : "20"} height={isLargeTextMode ? "24" : "20"} viewBox="0 0 24 24" fill="#1F2937">
                  <path d="M3 9v6h4l5 5V4l-5 5H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              </button>

              {/* Next Button */}
              <button
                onClick={handleNextCard}
                disabled={currentIndex === examples.length - 1}
                className={`${isLargeTextMode ? "p-3" : "p-2"} rounded-full transition-colors ${
                  currentIndex === examples.length - 1
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:bg-gray-100 active:bg-gray-200"
                }`}
              >
                <ChevronRight className={`${isLargeTextMode ? "w-6 h-6" : "w-5 h-5"} text-gray-600`} />
              </button>
            </div>
          </div>
        </div>

        {/* Generate New Button */}
        <div className={`flex justify-center ${isLargeTextMode ? "mt-4" : "mt-2"}`}>
          <button
            onClick={() => setStage(1)}
            className={`${isLargeTextMode ? "px-8 py-3" : "px-6 py-2.5"} bg-[#00DAAA] hover:bg-[#00C495] active:bg-[#00B085] text-gray-900 font-semibold rounded-full transition-colors shadow-lg`}
            style={baseTextStyle}
          >
            다른 예문 생성하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default StageResult;
