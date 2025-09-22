import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../Elements/Icons";
import Navbar from "../Templates/Navbar";
import {
  useWritingQuestions,
  useCorrectWriting,
  useTranslateWriting,
} from "../../entities/writing/queries";
import { WritingQuestion } from "../../entities/writing/types";
import { useGenerateTTS } from "../../entities/tts/queries";

type Step =
  | "question"
  | "korean-input"
  | "english-input"
  | "correction"
  | "translation"
  | "result";

type LanguageMode = "korean" | "english";

const DailySentence = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("question");
  const [languageMode, setLanguageMode] = useState<LanguageMode>("korean");
  const [currentQuestion, setCurrentQuestion] =
    useState<WritingQuestion | null>(null);
  const [koreanText, setKoreanText] = useState("");
  const [englishText, setEnglishText] = useState("");
  const [correctionResult, setCorrectionResult] = useState<any>(null);
  const [translationResult, setTranslationResult] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // TODO: Get actual user ID from auth context
  const userId = 1;

  const { data: questionsData, isLoading: questionsLoading } =
    useWritingQuestions();
  const correctWritingMutation = useCorrectWriting();
  const translateWritingMutation = useTranslateWriting();
  const ttsMutation = useGenerateTTS();

  useEffect(() => {
    if (questionsData?.data && questionsData.data.length > 0) {
      setCurrentQuestion(questionsData.data[0]);
    }
  }, [questionsData]);

  const playAudio = async () => {
    if (!currentQuestion) return;

    try {
      setIsPlaying(true);
      
      // 현재 모드에 따라 읽을 텍스트 결정
      const textToRead = languageMode === "korean" 
        ? currentQuestion.englishQuestion 
        : currentQuestion.koreanQuestion;

      // TTS API 호출
      const response = await ttsMutation.mutateAsync({
        text: textToRead,
        speed: 1.0
      });

      // Base64 오디오 데이터를 Blob으로 변환
      const audioBlob = new Blob([
        Uint8Array.from(atob(response.audioContent), c => c.charCodeAt(0))
      ], { type: 'audio/mpeg' });

      // 오디오 URL 생성 및 재생
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl); // 메모리 정리
      };
      
      audio.onerror = () => {
        console.error("오디오 재생 실패");
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error("음성 재생 실패:", error);
      setIsPlaying(false);
    }
  };

  const handleStartWriting = () => {
    if (languageMode === "korean") {
      setCurrentStep("korean-input");
    } else {
      setCurrentStep("english-input");
    }
  };

  const handleKoreanSubmit = () => {
    if (!koreanText.trim()) return;
    setCurrentStep("english-input");
  };

  const handleEnglishSubmit = async () => {
    if (!englishText.trim() || !currentQuestion) return;

    try {
      // 문장 첨삭
      const correctionResponse = await correctWritingMutation.mutateAsync({
        text: englishText,
        userId,
        writingQuestionId: currentQuestion.id,
      });
      setCorrectionResult(correctionResponse.data);

      // 한국어 번역 (한국어 모드에서만)
      if (languageMode === "korean") {
        const translationResponse = await translateWritingMutation.mutateAsync({
          text: koreanText,
          userId,
          writingQuestionId: currentQuestion.id,
        });
        setTranslationResult(translationResponse.data);
      }

      setCurrentStep("result");
    } catch (error) {
      console.error("처리 중 오류:", error);
    }
  };

  const handleRestart = () => {
    setCurrentStep("question");
    setKoreanText("");
    setEnglishText("");
    setCorrectionResult(null);
    setTranslationResult(null);
  };

  const handleModeChange = (mode: LanguageMode) => {
    setLanguageMode(mode);
    setCurrentStep("question");
    setKoreanText("");
    setEnglishText("");
    setCorrectionResult(null);
    setTranslationResult(null);
  };

  const formatDate = () => {
    const today = new Date();
    return `${today.getMonth() + 1}월 ${today.getDate()}일`;
  };

  if (questionsLoading || !currentQuestion) {
    return (
      <div className="min-h-screen bg-[#F7F8FB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#00DAAA] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">질문을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FB] flex justify-center">
      <div className="w-full max-w-[440px] bg-white shadow-lg relative">
        <Navbar currentPage="daily-sentence" />

        {/* Header */}
        <div className="bg-white px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="p-2">
              <Icons.arrowLeft />
            </button>
            <h1 className="text-lg font-bold text-gray-800">
              오늘의 한줄 영어
            </h1>
            <div className="w-8" />
          </div>

          {/* Language Mode Toggle */}
          <div className="flex justify-center mt-4">
            <div className="bg-gray-100 rounded-full p-1 flex">
              <button
                onClick={() => handleModeChange("korean")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  languageMode === "korean"
                    ? "bg-white text-[#00DAAA] shadow-sm"
                    : "text-gray-600"
                }`}
              >
                한국어 모드
              </button>
              <button
                onClick={() => handleModeChange("english")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  languageMode === "english"
                    ? "bg-white text-[#00DAAA] shadow-sm"
                    : "text-gray-600"
                }`}
              >
                영어 모드
              </button>
            </div>
          </div>
        </div>

        <div className="pb-20">
          {/* Progress Indicator */}
          <div className="px-4 py-4">
            <div className="flex items-center justify-center space-x-2">
              {languageMode === "korean"
                ? ["question", "korean-input", "english-input", "result"].map(
                    (step, index) => (
                      <div key={step} className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            currentStep === step
                              ? "bg-[#00DAAA] text-white"
                              : [
                                  "question",
                                  "korean-input",
                                  "english-input",
                                  "result",
                                ].indexOf(currentStep) > index
                              ? "bg-[#00DAAA] text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {index + 1}
                        </div>
                        {index < 3 && (
                          <div
                            className={`w-8 h-0.5 ${
                              [
                                "question",
                                "korean-input",
                                "english-input",
                                "result",
                              ].indexOf(currentStep) > index
                                ? "bg-[#00DAAA]"
                                : "bg-gray-200"
                            }`}
                          />
                        )}
                      </div>
                    )
                  )
                : ["question", "english-input", "result"].map((step, index) => (
                    <div key={step} className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep === step
                            ? "bg-[#00DAAA] text-white"
                            : ["question", "english-input", "result"].indexOf(
                                currentStep
                              ) > index
                            ? "bg-[#00DAAA] text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {index + 1}
                      </div>
                      {index < 2 && (
                        <div
                          className={`w-8 h-0.5 ${
                            ["question", "english-input", "result"].indexOf(
                              currentStep
                            ) > index
                              ? "bg-[#00DAAA]"
                              : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                  ))}
            </div>
          </div>

          {/* Step 1: Question Display */}
          {currentStep === "question" && (
            <div className="px-4 py-6">
              <div className="bg-white rounded-3xl p-6 shadow-lg border-4 border-[#00DAAA]">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-[#00E8B6] px-4 py-2 rounded-full">
                    <span className="text-sm font-bold text-gray-800">
                      오늘의 문장
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 font-medium">
                    {formatDate()}
                  </span>
                </div>

                <div className="space-y-6 mb-8">
                  {languageMode === "korean" ? (
                    <>
                      <div className="text-2xl font-bold text-gray-900 leading-relaxed">
                        {currentQuestion.englishQuestion}
                      </div>
                      <div className="text-lg text-gray-600 leading-relaxed">
                        {currentQuestion.koreanQuestion}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-gray-900 leading-relaxed">
                        {currentQuestion.koreanQuestion}
                      </div>
                      <div className="text-lg text-gray-600 leading-relaxed">
                        {currentQuestion.englishQuestion}
                      </div>
                    </>
                  )}
                </div>

              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={playAudio}
                  disabled={isPlaying || ttsMutation.isPending}
                  className="flex items-center space-x-2 bg-[#00DAAA] text-white px-6 py-3 rounded-full disabled:opacity-50 shadow-md"
                >
                  <Icons.speaker />
                  <span className="text-sm font-medium">
                    {isPlaying || ttsMutation.isPending ? "재생 중..." : "발음 듣기"}
                  </span>
                </button>

                  <button className="flex items-center space-x-2 bg-gray-100 px-6 py-3 rounded-full shadow-md">
                    <Icons.download />
                    <span className="text-sm font-medium">저장</span>
                  </button>
                </div>

                <button
                  onClick={handleStartWriting}
                  className="w-full bg-[#00DAAA] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
                >
                  시작하기
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Korean Input (Korean Mode Only) */}
          {currentStep === "korean-input" && languageMode === "korean" && (
            <div className="px-4 py-6">
              <div className="bg-white rounded-3xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-gray-900">
                  한국어로 답해보세요
                </h2>
                <p className="text-gray-600 mb-8 text-lg">
                  {currentQuestion.koreanQuestion}
                </p>

                <textarea
                  value={koreanText}
                  onChange={(e) => setKoreanText(e.target.value)}
                  placeholder="여기에 한국어로 답변을 작성해주세요..."
                  className="w-full h-40 p-5 border-2 border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#00DAAA] focus:border-transparent text-lg"
                />

                <button
                  onClick={handleKoreanSubmit}
                  disabled={!koreanText.trim()}
                  className="w-full bg-[#00DAAA] text-white py-4 rounded-2xl font-bold text-lg mt-6 disabled:opacity-50 shadow-lg hover:shadow-xl transition-shadow"
                >
                  다음 단계
                </button>
              </div>
            </div>
          )}

          {/* Step 2/3: English Input */}
          {currentStep === "english-input" && (
            <div className="px-4 py-6">
              <div className="bg-white rounded-3xl p-6 shadow-lg">
                {languageMode === "korean" ? (
                  <>
                    <h2 className="text-2xl font-bold mb-2 text-gray-900">
                      영어로 번역해보세요
                    </h2>
                    <p className="text-gray-600 mb-3 text-lg">한국어 답변:</p>
                    <p className="text-gray-800 mb-8 p-4 bg-gray-50 rounded-2xl text-lg leading-relaxed">
                      {koreanText}
                    </p>
                    <textarea
                      value={englishText}
                      onChange={(e) => setEnglishText(e.target.value)}
                      placeholder="위의 한국어를 영어로 번역해주세요..."
                      className="w-full h-40 p-5 border-2 border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#00DAAA] focus:border-transparent text-lg"
                    />
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold mb-2 text-gray-900">
                      영어로 답해보세요
                    </h2>
                    <p className="text-gray-600 mb-8 text-lg">
                      {currentQuestion.englishQuestion}
                    </p>
                    <textarea
                      value={englishText}
                      onChange={(e) => setEnglishText(e.target.value)}
                      placeholder="여기에 영어로 답변을 작성해주세요..."
                      className="w-full h-40 p-5 border-2 border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#00DAAA] focus:border-transparent text-lg"
                    />
                  </>
                )}

                <button
                  onClick={handleEnglishSubmit}
                  disabled={
                    !englishText.trim() ||
                    correctWritingMutation.isPending ||
                    translateWritingMutation.isPending
                  }
                  className="w-full bg-[#00DAAA] text-white py-4 rounded-2xl font-bold text-lg mt-6 disabled:opacity-50 shadow-lg hover:shadow-xl transition-shadow"
                >
                  {correctWritingMutation.isPending ||
                  translateWritingMutation.isPending
                    ? "처리 중..."
                    : "결과 확인"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3/4: Result */}
          {currentStep === "result" && correctionResult && (
            <div className="px-4 py-6 pb-6">
              {/* Correction Result */}
              <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
                <h3 className="text-xl font-bold mb-6 text-[#00DAAA]">
                  문법 첨삭 결과
                </h3>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-2 font-medium">
                      원본 문장:
                    </p>
                    <p className="text-gray-800 text-lg leading-relaxed p-3 bg-gray-50 rounded-xl">
                      {correctionResult.originalText}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2 font-medium">
                      수정된 문장:
                    </p>
                    <p className="text-gray-800 font-semibold text-lg leading-relaxed p-3 bg-green-50 rounded-xl border border-green-200">
                      {correctionResult.processedText}
                    </p>
                  </div>

                  {correctionResult.hasErrors && (
                    <div>
                      <p className="text-sm text-gray-600 mb-3 font-medium">
                        피드백:
                      </p>
                      <ul className="space-y-3">
                        {correctionResult.feedback.map(
                          (feedback: string, index: number) => (
                            <li
                              key={index}
                              className="text-sm text-gray-700 bg-yellow-50 p-4 rounded-xl border border-yellow-200"
                            >
                              • {feedback}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Translation Result (Korean Mode Only) */}
              {languageMode === "korean" && translationResult && (
                <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
                  <h3 className="text-xl font-bold mb-6 text-[#00DAAA]">
                    번역 결과
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-2 font-medium">
                        원본 한국어:
                      </p>
                      <p className="text-gray-800 text-lg leading-relaxed p-3 bg-gray-50 rounded-xl">
                        {translationResult.originalText}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-3 font-medium">
                        번역된 영어:
                      </p>
                      {translationResult.sentencePairs.map(
                        (pair: any, index: number) => (
                          <div key={index} className="mb-6">
                            <p className="text-gray-800 font-semibold mb-3 text-lg leading-relaxed p-3 bg-blue-50 rounded-xl border border-blue-200">
                              {pair.originalSentence}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {pair.shuffledWords.map(
                                (word: string, wordIndex: number) => (
                                  <span
                                    key={wordIndex}
                                    className="bg-[#00DAAA] text-white px-4 py-2 rounded-full text-sm font-medium shadow-md"
                                  >
                                    {word}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-3 font-medium">
                        번역 피드백:
                      </p>
                      <ul className="space-y-3">
                        {translationResult.feedback.map(
                          (feedback: string, index: number) => (
                            <li
                              key={index}
                              className="text-sm text-gray-700 bg-blue-50 p-4 rounded-xl border border-blue-200"
                            >
                              • {feedback}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleRestart}
                className="w-full bg-[#00DAAA] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
              >
                다시 시작하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailySentence;
