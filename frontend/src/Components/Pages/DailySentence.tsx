import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../Elements/Icons";
import Navbar from "../Templates/Navbar";
import {
  useWritingQuestions,
  useCorrectWriting,
  useTranslateWriting,
  useTranslateEnglishToKorean,
} from "../../entities/writing/queries";
import { WritingQuestion } from "../../entities/writing/types";
import { useGenerateTTS } from "../../entities/tts/queries";

type Step = "question" | "user-answer" | "sentence-construction" | "result";

type LanguageMode = "korean" | "english";

const DailySentence = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("question");
  const [languageMode, setLanguageMode] = useState<LanguageMode>("korean");
  const [currentQuestion, setCurrentQuestion] =
    useState<WritingQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [translationResult, setTranslationResult] = useState<any>(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [completedSentences, setCompletedSentences] = useState<boolean[]>([]);

  // TODO: Get actual user ID from auth context
  const userId = 1;

  const { data: questionsData, isLoading: questionsLoading } =
    useWritingQuestions();
  const translateWritingMutation = useTranslateWriting();
  const translateEnglishToKoreanMutation = useTranslateEnglishToKorean();
  const ttsMutation = useGenerateTTS();

  useEffect(() => {
    if (questionsData?.data && questionsData.data.length > 0) {
      setCurrentQuestion(questionsData.data[0]);
    }
  }, [questionsData]);

  const playAudio = useCallback(async () => {
    if (!currentQuestion) return;

    try {
      setIsPlaying(true);

      // 현재 모드에 따라 읽을 텍스트 결정
      const textToRead =
        languageMode === "korean"
          ? currentQuestion.englishQuestion
          : currentQuestion.koreanQuestion;

      // TTS API 호출
      const response = await ttsMutation.mutateAsync({
        text: textToRead,
        speed: 1.0,
      });

      // Base64 오디오 데이터를 Blob으로 변환
      let audioUrl;
      
      if (response.audioContent.startsWith('data:audio/')) {
        // 더미 데이터의 경우 (data URL 형식)
        audioUrl = response.audioContent;
      } else {
        // 실제 API 응답의 경우 (Base64 문자열)
        const audioBlob = new Blob(
          [Uint8Array.from(atob(response.audioContent), (c) => c.charCodeAt(0))],
          { type: "audio/mpeg" }
        );
        audioUrl = URL.createObjectURL(audioBlob);
      }
      
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setIsPlaying(false);
        // Blob URL의 경우에만 메모리 정리
        if (!response.audioContent.startsWith('data:audio/')) {
          URL.revokeObjectURL(audioUrl);
        }
      };

      audio.onerror = () => {
        console.error("오디오 재생 실패");
        setIsPlaying(false);
        // Blob URL의 경우에만 메모리 정리
        if (!response.audioContent.startsWith('data:audio/')) {
          URL.revokeObjectURL(audioUrl);
        }
      };

      await audio.play();
    } catch (error) {
      console.error("음성 재생 실패:", error);
      setIsPlaying(false);
    }
  }, [currentQuestion, languageMode, ttsMutation]);

  const handleStartWriting = useCallback(() => {
    setCurrentStep("user-answer");
  }, []);

  const handleUserAnswerSubmit = useCallback(async () => {
    if (!userAnswer.trim() || !currentQuestion) return;

    try {
      let translationResponse;
      
      if (languageMode === "korean") {
        // 한국어 모드: 한국어 → 영어 번역
        translationResponse = await translateWritingMutation.mutateAsync({
          text: userAnswer,
          userId,
          writingQuestionId: currentQuestion.id,
        });
      } else {
        // 영어 모드: 영어 → 한국어 번역
        translationResponse = await translateEnglishToKoreanMutation.mutateAsync({
          text: userAnswer,
          userId,
          writingQuestionId: currentQuestion.id,
        });
      }
      
      setTranslationResult(translationResponse.data);
      setCurrentSentenceIndex(0);
      // 완료된 문장 배열 초기화
      setCompletedSentences(new Array(translationResponse.data.sentencePairs.length).fill(false));
      // 첫 번째 문장의 단어들로 초기화
      if (translationResponse.data.sentencePairs[0]) {
        setAvailableWords([
          ...translationResponse.data.sentencePairs[0].shuffledWords,
        ]);
        setSelectedWords([]);
      }
      setCurrentStep("sentence-construction");
    } catch (error) {
      console.error("처리 중 오류:", error);
    }
  }, [userAnswer, currentQuestion, translateWritingMutation, translateEnglishToKoreanMutation, userId, languageMode]);

  const handleNextSentence = useCallback(() => {
    // 현재 문장을 완료로 표시
    setCompletedSentences(prev => {
      const newCompleted = [...prev];
      newCompleted[currentSentenceIndex] = true;
      return newCompleted;
    });

    if (
      translationResult &&
      currentSentenceIndex < translationResult.sentencePairs.length - 1
    ) {
      const nextIndex = currentSentenceIndex + 1;
      setCurrentSentenceIndex(nextIndex);
      // 다음 문장의 단어들로 초기화
      if (translationResult.sentencePairs[nextIndex]) {
        setAvailableWords([
          ...translationResult.sentencePairs[nextIndex].shuffledWords,
        ]);
        setSelectedWords([]);
      }
    } else {
      setCurrentStep("result");
    }
  }, [translationResult, currentSentenceIndex]);

  const handleRestart = useCallback(() => {
    setCurrentStep("question");
    setUserAnswer("");
    setTranslationResult(null);
    setCurrentSentenceIndex(0);
    setSelectedWords([]);
    setAvailableWords([]);
    setCompletedSentences([]);
  }, []);

  const handleModeChange = useCallback((mode: LanguageMode) => {
    setLanguageMode(mode);
    setCurrentStep("question");
    setUserAnswer("");
    setTranslationResult(null);
    setCurrentSentenceIndex(0);
    setSelectedWords([]);
    setAvailableWords([]);
    setCompletedSentences([]);
  }, []);

  // 단어를 선택된 영역에 추가
  const handleWordSelect = useCallback((word: string) => {
    setSelectedWords((prev) => [...prev, word]);
    setAvailableWords((prev) => prev.filter((w) => w !== word));
  }, []);

  // 단어를 선택된 영역에서 제거
  const handleWordRemove = useCallback((word: string, index: number) => {
    setSelectedWords((prev) => prev.filter((_, i) => i !== index));
    setAvailableWords((prev) => [...prev, word]);
  }, []);

  // 정답 확인
  const isCorrectAnswer = useCallback(() => {
    if (
      !translationResult ||
      !translationResult.sentencePairs[currentSentenceIndex]
    ) {
      return false;
    }
    const correctSentence =
      translationResult.sentencePairs[currentSentenceIndex].originalSentence;
    const correctWords = correctSentence.split(" ");
    return (
      selectedWords.length === correctWords.length &&
      selectedWords.every((word, index) => word === correctWords[index])
    );
  }, [translationResult, currentSentenceIndex, selectedWords]);

  // 단계 이동 함수
  const handleStepNavigation = useCallback(
    (targetStep: Step) => {
      const steps = [
        "question",
        "user-answer",
        "sentence-construction",
        "result",
      ];
      const currentIndex = steps.indexOf(currentStep);
      const targetIndex = steps.indexOf(targetStep);

      // 이전 단계로만 이동 가능 (데이터 손실 방지)
      if (targetIndex <= currentIndex) {
        setCurrentStep(targetStep);

        // 각 단계별 상태 초기화
        if (targetStep === "question") {
          setUserAnswer("");
          setTranslationResult(null);
          setCurrentSentenceIndex(0);
          setSelectedWords([]);
          setAvailableWords([]);
          setCompletedSentences([]);
        } else if (targetStep === "user-answer") {
          setTranslationResult(null);
          setCurrentSentenceIndex(0);
          setSelectedWords([]);
          setAvailableWords([]);
          setCompletedSentences([]);
        } else if (targetStep === "sentence-construction") {
          setSelectedWords([]);
          setAvailableWords([]);
          // translationResult가 있으면 첫 번째 문장으로 초기화
          if (translationResult && translationResult.sentencePairs[0]) {
            setAvailableWords([
              ...translationResult.sentencePairs[0].shuffledWords,
            ]);
            setCurrentSentenceIndex(0);
            // 완료 상태를 다시 초기화
            setCompletedSentences(new Array(translationResult.sentencePairs.length).fill(false));
          }
        }
      }
    },
    [currentStep, translationResult]
  );

  // 이전 단계로 이동
  const handlePreviousStep = useCallback(() => {
    const steps = [
      "question",
      "user-answer",
      "sentence-construction",
      "result",
    ];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      const previousStep = steps[currentIndex - 1] as Step;
      handleStepNavigation(previousStep);
    }
  }, [currentStep, handleStepNavigation]);

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
              {[
                "question",
                "user-answer",
                "sentence-construction",
                "result",
              ].map((step, index) => {
                const steps = [
                  "question",
                  "user-answer",
                  "sentence-construction",
                  "result",
                ];
                const currentIndex = steps.indexOf(currentStep);
                const isCompleted = currentIndex > index;
                const isCurrent = currentStep === step;
                const isClickable = index <= currentIndex; // 이전 단계로만 이동 가능

                return (
                  <div key={step} className="flex items-center">
                    <div
                      onClick={() =>
                        isClickable && handleStepNavigation(step as Step)
                      }
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                        isCurrent
                          ? "bg-[#00DAAA] text-white"
                          : isCompleted
                          ? "bg-[#00DAAA] text-white cursor-pointer hover:bg-[#00C299]"
                          : "bg-gray-200 text-gray-500"
                      } ${isClickable ? "cursor-pointer" : "cursor-default"}`}
                    >
                      {index + 1}
                    </div>
                    {index < 3 && (
                      <div
                        className={`w-8 h-0.5 ${
                          isCompleted ? "bg-[#00DAAA]" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
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
                      {isPlaying || ttsMutation.isPending
                        ? "재생 중..."
                        : "발음 듣기"}
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

          {/* Step 2: User Answer Input */}
          {currentStep === "user-answer" && (
            <div className="px-4 py-6">
              <div className="bg-white rounded-3xl p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  <button
                    onClick={handlePreviousStep}
                    className="flex items-center space-x-2 text-gray-600 hover:text-[#00DAAA] transition-colors"
                  >
                    <Icons.arrowLeft />
                    <span className="text-sm font-medium">이전 단계</span>
                  </button>
                </div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900">
                  자유롭게 답해보세요
                </h2>
                <p className="text-gray-600 mb-4 text-lg">
                  {languageMode === "korean"
                    ? currentQuestion?.koreanQuestion
                    : currentQuestion?.englishQuestion}
                </p>

                {/* 예시 답변 - 서버에서 온 데이터 사용 */}
                {currentQuestion?.example && (
                  <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      📝 예시 답변
                    </h3>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      {languageMode === "korean" ? (
                        <div>
                          <p className="mb-2">
                            <strong>한국어:</strong> "{currentQuestion.example.korean}"
                          </p>
                          <p className="text-xs text-gray-500">
                            💡 팁: 자연스러운 한국어로 자유롭게 답변해보세요!
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="mb-2">
                            <strong>영어:</strong> "{currentQuestion.example.english}"
                          </p>
                          <p className="text-xs text-gray-500">
                            💡 Tip: Answer naturally in English!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder={
                    languageMode === "korean"
                      ? "여기에 한국어로 답변을 작성해주세요..."
                      : "Please write your answer in English here..."
                  }
                  className="w-full h-40 p-5 border-2 border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#00DAAA] focus:border-transparent text-lg"
                />

                <button
                  onClick={handleUserAnswerSubmit}
                  disabled={
                    !userAnswer.trim() || 
                    translateWritingMutation.isPending || 
                    translateEnglishToKoreanMutation.isPending
                  }
                  className="w-full bg-[#00DAAA] text-white py-4 rounded-2xl font-bold text-lg mt-6 disabled:opacity-50 shadow-lg hover:shadow-xl transition-shadow"
                >
                  {(translateWritingMutation.isPending || translateEnglishToKoreanMutation.isPending)
                    ? "처리 중..."
                    : "다음 단계"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Sentence Construction */}
          {currentStep === "sentence-construction" && translationResult && (
            <div className="px-4 py-6">
              <div className="bg-white rounded-3xl p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  <button
                    onClick={handlePreviousStep}
                    className="flex items-center space-x-2 text-gray-600 hover:text-[#00DAAA] transition-colors"
                  >
                    <Icons.arrowLeft />
                    <span className="text-sm font-medium">이전 단계</span>
                  </button>
                </div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900">
                  {languageMode === "korean" 
                    ? "영어 문장을 올바른 순서로 배열해보세요"
                    : "한국어 문장을 올바른 순서로 배열해보세요"
                  }
                </h2>

                {/* 문장별 진행 상황 */}
                <div className="flex items-center justify-center space-x-2 mb-6">
                  {translationResult.sentencePairs.map((_: any, index: number) => {
                    const isCompleted = completedSentences[index];
                    const isCurrent = currentSentenceIndex === index;
                    
                    return (
                      <div key={index} className="flex items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 ${
                            isCurrent
                              ? "bg-[#FF6B35] text-white"
                              : isCompleted
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {isCompleted ? "✓" : index + 1}
                        </div>
                        {index < translationResult.sentencePairs.length - 1 && (
                          <div
                            className={`w-6 h-0.5 ${
                              isCompleted ? "bg-green-500" : "bg-gray-200"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 현재 문장 정보 */}
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">
                    문장 {currentSentenceIndex + 1} / {translationResult.sentencePairs.length}
                  </p>
                  <div className="bg-blue-50 rounded-xl p-3 mt-2 border border-blue-200">
                    <p className="text-sm text-gray-700 font-medium">
                      {languageMode === "korean" 
                        ? `한국어: "${translationResult.sentencePairs[currentSentenceIndex].koreanSentence || translationResult.originalText}"`
                        : `영어: "${translationResult.sentencePairs[currentSentenceIndex].englishSentence || translationResult.originalText}"`
                      }
                    </p>
                  </div>
                </div>

                {/* 현재 문장 */}
                {translationResult.sentencePairs[currentSentenceIndex] && (
                  <div className="mb-6">
                    {/* 선택된 단어들 영역 */}
                    <div className="bg-gray-100 rounded-2xl p-4 mb-4 min-h-[60px] border-2 border-dashed border-gray-300">
                      {selectedWords.length === 0 ? (
                        <p className="text-gray-500 text-center">
                          단어를 올바른 순서로 배열하세요
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {selectedWords.map((word, index) => (
                            <span
                              key={`selected-${index}`}
                              onClick={() => handleWordRemove(word, index)}
                              className="bg-[#00DAAA] text-white px-4 py-2 rounded-full text-sm font-medium shadow-md cursor-pointer hover:bg-[#00C299] transition-colors"
                            >
                              {word}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 사용 가능한 단어들 */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {availableWords.map((word, index) => (
                        <span
                          key={`available-${index}`}
                          onClick={() => handleWordSelect(word)}
                          className="bg-[#FF6B35] text-white px-4 py-2 rounded-full text-sm font-medium shadow-md cursor-pointer hover:bg-[#E55A2B] transition-colors"
                        >
                          {word}
                        </span>
                      ))}
                    </div>

                    {/* 정답 확인 메시지 */}
                    {selectedWords.length > 0 && (
                      <div className="mt-4 text-center">
                        {isCorrectAnswer() ? (
                          <p className="text-green-600 font-semibold">
                            ✅ 정답입니다!
                          </p>
                        ) : (
                          <p className="text-gray-500">
                            단어를 더 추가하거나 순서를 바꿔보세요
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleNextSentence}
                  disabled={!isCorrectAnswer()}
                  className="w-full bg-[#FF6B35] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentSentenceIndex <
                  translationResult.sentencePairs.length - 1
                    ? "다음 문장"
                    : "결과 확인"}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Result */}
          {currentStep === "result" && translationResult && (
            <div className="px-4 py-6 pb-6">
              {/* Back Button */}
              <div className="mb-4">
                <button
                  onClick={handlePreviousStep}
                  className="flex items-center space-x-2 text-gray-600 hover:text-[#00DAAA] transition-colors"
                >
                  <Icons.arrowLeft />
                  <span className="text-sm font-medium">이전 단계</span>
                </button>
              </div>

              {/* Success Message */}
              <div className="bg-white rounded-3xl p-6 shadow-lg mb-6 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🎉</span>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900">
                  전부 다 맞았어요!
                </h3>
                <p className="text-lg text-gray-600">훌륭합니다!</p>
              </div>

              {/* Translation Result */}
              <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
                <h3 className="text-xl font-bold mb-6 text-[#00DAAA]">
                  학습 결과
                </h3>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-2 font-medium">
                      원본 답변:
                    </p>
                    <p className="text-gray-800 text-lg leading-relaxed p-3 bg-gray-50 rounded-xl">
                      {translationResult.originalText}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-3 font-medium">
                      영어 문장들:
                    </p>
                    {translationResult.sentencePairs.map(
                      (pair: any, index: number) => (
                        <div key={index} className="mb-4">
                          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <p className="text-gray-800 font-semibold text-lg leading-relaxed">
                              {pair.originalSentence}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-3 font-medium">
                      학습 피드백:
                    </p>
                    <ul className="space-y-3">
                      {translationResult.feedback.map(
                        (feedback: string, index: number) => (
                          <li
                            key={index}
                            className="text-sm text-gray-700 bg-green-50 p-4 rounded-xl border border-green-200"
                          >
                            • {feedback}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </div>

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
