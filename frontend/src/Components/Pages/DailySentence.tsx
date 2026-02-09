import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { isLoggedInAtom } from "../../store/authStore";
import { isLargeTextModeAtom } from "../../store/dataStore";
import { Icons } from "../Elements/Icons";
import { Tooltip } from "../Elements/Tooltip";
import { getTodayStringBy4AM, hashDateString } from "../../utils/dateUtils";
import { shouldShowFeatureTooltip, markTooltipAsSeen, TOOLTIP_KEYS } from "../../utils/tooltipUtils";

import Navbar from "../Templates/Navbar";
import {
  useWritingQuestions,
  useCorrectWriting,
  useTranslateWriting,
} from "../../entities/writing/queries";
import { WritingQuestion } from "../../entities/writing/types";
import { LanguageModeToggle } from "./DailySentence/components/LanguageModeToggle";
import { ProgressIndicator } from "./DailySentence/components/ProgressIndicator";
import { QuestionStep } from "./DailySentence/components/QuestionStep";
import { SentenceConstructionStep } from "./DailySentence/components/SentenceConstructionStep";
import { ResultStep } from "./DailySentence/components/ResultStep";
import { ConfirmPopup } from "./DailySentence/components/ConfirmPopup";

type Step = "question" | "sentence-construction" | "result";

type LanguageMode = "korean" | "english";

const DailySentence = () => {
  const navigate = useNavigate();
  const [isLoggedIn] = useAtom(isLoggedInAtom);
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  const [currentStep, setCurrentStep] = useState<Step>("question");
  const [languageMode, setLanguageMode] = useState<LanguageMode>("korean");
  const [currentQuestion, setCurrentQuestion] =
    useState<WritingQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [translationResult, setTranslationResult] = useState<any>(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [completedSentences, setCompletedSentences] = useState<boolean[]>([]);
  const [showConfirmPopup, setShowConfirmPopup] = useState<boolean>(false);
  const [englishQuestionFontSize, setEnglishQuestionFontSize] = useState<number | null>(null);
  const englishQuestionRef = useRef<HTMLDivElement>(null);
  const englishQuestionContainerRef = useRef<HTMLDivElement>(null);
  const languageModeRef = useRef<HTMLDivElement>(null);
  const [showLanguageModeTooltip, setShowLanguageModeTooltip] = useState(false);
  const [languageModeTooltipPosition, setLanguageModeTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // 큰글씨 모드에 따른 텍스트 크기 (중년층용)
  const baseFontSize = isLargeTextMode ? 18 : 16;
  const smallFontSize = isLargeTextMode ? 16 : 14;
  const xSmallFontSize = isLargeTextMode ? 14 : 12;
  const headerFontSize = isLargeTextMode ? 22 : 18;
  // 문장 첨삭/예문 생성 텍스트: 큰글씨 모드일 때 14px, 아닐 때 12px
  const correctionTextSize = isLargeTextMode ? 14 : 12;
  // 피드백 텍스트: 큰글씨 모드일 때 16px, 아닐 때 14px
  const feedbackTextSize = isLargeTextMode ? 16 : 14;
  
  const baseTextStyle: React.CSSProperties = { 
    fontSize: `${baseFontSize}px`, 
    wordBreak: 'break-word' as const, 
    overflowWrap: 'anywhere' as const,
    maxWidth: '100%'
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
    fontSize: `${headerFontSize}px`,
    wordBreak: 'keep-all',
    overflowWrap: 'break-word' as const
  };
  const correctionTextStyle: React.CSSProperties = {
    fontSize: `${correctionTextSize}px`,
    wordBreak: 'keep-all',
    overflowWrap: 'break-word' as const
  };
  const feedbackTextStyle: React.CSSProperties = {
    fontSize: `${feedbackTextSize}px`,
    wordBreak: 'keep-all',
    overflowWrap: 'break-word' as const
  };

  // 보안: userId는 JWT 토큰에서 자동으로 가져옴 (전달 불필요)
  
  // 로그인 확인 - useEffect에서 navigate 대신 window.location 사용 (렌더링 중 업데이트 방지)
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!isLoggedIn || !token) {
      console.warn("[DailySentence] 로그인이 필요합니다. 로그인 페이지로 리다이렉트합니다.");
      // navigate 대신 window.location 사용하여 렌더링 중 업데이트 방지
      window.location.href = '/';
      return;
    }
  }, [isLoggedIn]);

  const { data: questionsData, isLoading: questionsLoading } =
    useWritingQuestions();
  const translateWritingMutation = useTranslateWriting();
  const correctWritingMutation = useCorrectWriting();

  useEffect(() => {
    if (
      questionsData?.data &&
      questionsData.data.length > 0 &&
      !currentQuestion
    ) {
      // 오전 4시 기준 날짜 기반 해시로 질문 선택 (같은 날에는 같은 질문)
      const dateString = getTodayStringBy4AM();
      
      // 날짜 문자열을 해시하여 질문 인덱스 결정
      const hash = hashDateString(dateString);
      
      // 해시 값을 양수로 변환하고 질문 개수로 나눈 나머지
      const questionIndex = hash % questionsData.data.length;
      setCurrentQuestion(questionsData.data[questionIndex]);
    }
  }, [questionsData?.data, currentQuestion]);

  // 영어 문장 자동 폰트 크기 조절
  useEffect(() => {
    if (!currentQuestion || !englishQuestionRef.current || !englishQuestionContainerRef.current || currentStep !== "question") {
      setEnglishQuestionFontSize(null);
      return;
    }

    const adjustFontSize = () => {
      const container = englishQuestionContainerRef.current;
      const textElement = englishQuestionRef.current;
      
      if (!container || !textElement) return;

      // 영어 모드일 때와 동일하게 항상 영어 질문을 기준으로 측정
      const englishText = currentQuestion.englishQuestion;
      
      if (!englishText) return;

      // 문장 개수 계산 (., !, ?로 끝나는 문장)
      const sentenceCount = (englishText.match(/[.!?]+/g) || []).length || 1;
      const targetLines = sentenceCount;

      // 초기 폰트 크기 설정 (영어 모드와 동일)
      const baseSize = isLargeTextMode ? 18 : 16;
      let fontSize = baseSize;
      const minFontSize = 12;
      const maxFontSize = baseSize;

      // 컨테이너 너비 가져오기
      const containerWidth = container.offsetWidth - 32; // padding 고려

      // 임시 요소로 텍스트 너비 측정
      const measureElement = document.createElement('div');
      measureElement.style.position = 'absolute';
      measureElement.style.visibility = 'hidden';
      measureElement.style.whiteSpace = 'nowrap';
      measureElement.style.fontFamily = window.getComputedStyle(textElement).fontFamily;
      measureElement.style.fontWeight = window.getComputedStyle(textElement).fontWeight;
      document.body.appendChild(measureElement);

      // 이진 탐색으로 적절한 폰트 크기 찾기
      let low = minFontSize;
      let high = maxFontSize;
      let bestSize = baseSize;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        measureElement.style.fontSize = `${mid}px`;
        measureElement.textContent = englishText;
        
        const textWidth = measureElement.offsetWidth;
        const estimatedLines = Math.ceil(textWidth / containerWidth);
        
        if (estimatedLines <= targetLines) {
          bestSize = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      document.body.removeChild(measureElement);
      setEnglishQuestionFontSize(bestSize);
    };

    // 초기 조정
    adjustFontSize();

    // 리사이즈 이벤트 리스너
    const resizeObserver = new ResizeObserver(() => {
      adjustFontSize();
    });

    if (englishQuestionContainerRef.current) {
      resizeObserver.observe(englishQuestionContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [currentQuestion, languageMode, currentStep, isLargeTextMode]);

  // 완료 버튼 클릭 시 팝업 표시
  const handleCompleteClick = useCallback(() => {
    if (!userAnswer.trim() || !currentQuestion) return;
    setShowConfirmPopup(true);
  }, [userAnswer, currentQuestion]);

  // 팝업에서 "네" 클릭 시 실제 처리
  const handleConfirmSubmit = useCallback(async () => {
    if (!userAnswer.trim() || !currentQuestion) return;

    setShowConfirmPopup(false);

    try {
      let translationResponse;

      if (languageMode === "korean") {
        // 한국어 모드: 한국어 → 영어 번역
        translationResponse = await translateWritingMutation.mutateAsync({
          text: userAnswer,
          writingQuestionId: currentQuestion.id,
        });

        setTranslationResult(translationResponse.data);
        setCurrentSentenceIndex(0);
        // 완료된 문장 배열 초기화
        setCompletedSentences(
          new Array(translationResponse.data.sentencePairs.length).fill(false)
        );
        // 첫 번째 문장의 번역된 문장 단어들로 초기화
        if (translationResponse.data.sentencePairs[0]) {
          const firstSentence = translationResponse.data.sentencePairs[0];
          // 백엔드 API 응답 구조: originalSentence가 번역된 문장, shuffledWords가 이미 섞인 단어들
          if (
            firstSentence.shuffledWords &&
            firstSentence.shuffledWords.length > 0
          ) {
            setAvailableWords([...firstSentence.shuffledWords]);
            setSelectedWords([]);
          }
        }
        setCurrentStep("sentence-construction");
      } else {
        // 영어 모드: 영어 어법 체크 (sentence-construction 건너뛰고 바로 result로)
        const correctionResponse = await correctWritingMutation.mutateAsync({
          text: userAnswer,
          writingQuestionId: currentQuestion.id,
        });

        // correctWriting 응답을 translateWriting과 유사한 구조로 변환
        setTranslationResult({
          originalText: correctionResponse.data.originalText,
          processedText: correctionResponse.data.processedText,
          hasErrors: correctionResponse.data.hasErrors,
          feedback: correctionResponse.data.feedback,
          isCorrection: true, // correction 결과임을 표시
        });
        setCurrentStep("result");
      }
    } catch (error) {
      console.error("처리 중 오류:", error);
    }
  }, [
    userAnswer,
    currentQuestion,
    translateWritingMutation,
    correctWritingMutation,
    languageMode,
  ]);

  // 팝업에서 "아니요" 클릭 시 언어 모드 변경
  const handlePopupNo = useCallback(() => {
    setShowConfirmPopup(false);
    if (languageMode === "korean") {
      setLanguageMode("english");
    } else {
      setLanguageMode("korean");
    }
  }, [languageMode]);

  const handleNextSentence = useCallback(() => {
    // 한국어 모드에서만 사용되는 함수
    if (!translationResult || !translationResult.sentencePairs) return;

    // 현재 문장을 완료로 표시
    setCompletedSentences((prev) => {
      const newCompleted = [...prev];
      newCompleted[currentSentenceIndex] = true;
      return newCompleted;
    });

    if (
      currentSentenceIndex < translationResult.sentencePairs.length - 1
    ) {
      const nextIndex = currentSentenceIndex + 1;
      setCurrentSentenceIndex(nextIndex);
      // 다음 문장의 번역된 문장 단어들로 초기화
      if (translationResult.sentencePairs[nextIndex]) {
        const nextSentence = translationResult.sentencePairs[nextIndex];
        // 백엔드 API 응답 구조: shuffledWords가 이미 섞인 단어들
        if (
          nextSentence.shuffledWords &&
          nextSentence.shuffledWords.length > 0
        ) {
          setAvailableWords([...nextSentence.shuffledWords]);
          setSelectedWords([]);
        }
      }
    } else {
      setCurrentStep("result");
    }
  }, [translationResult, currentSentenceIndex, languageMode]);

  const handleRestart = useCallback(() => {
    setCurrentStep("question");
    setUserAnswer("");
    setTranslationResult(null);
    setCurrentSentenceIndex(0);
    setSelectedWords([]);
    setAvailableWords([]);
    setCompletedSentences([]);
  }, []);

  const handleModeChange = useCallback(
    (mode: LanguageMode) => {
      // 현재 모드와 같으면 아무것도 하지 않음
      if (mode === languageMode) return;

      setLanguageMode(mode);
      setCurrentStep("question");
      setUserAnswer("");
      setTranslationResult(null);
      setCurrentSentenceIndex(0);
      setSelectedWords([]);
      setAvailableWords([]);
      setCompletedSentences([]);
    },
    [languageMode]
  );

  // 단어를 선택된 영역에 추가
  const handleWordSelect = useCallback((word: string, wordIndex: number) => {
    setSelectedWords((prev) => [...prev, word]);
    setAvailableWords((prev) => prev.filter((_, i) => i !== wordIndex));
  }, []);

  // 단어를 선택된 영역에서 제거
  const handleWordRemove = useCallback((word: string, index: number) => {
    setSelectedWords((prev) => prev.filter((_, i) => i !== index));
    setAvailableWords((prev) => [...prev, word]);
  }, []);

  // 정답 확인 - 번역된 문장을 기준으로 확인 (한국어 모드에서만 사용)
  const isCorrectAnswer = useCallback(() => {
    if (
      !translationResult ||
      !translationResult.sentencePairs ||
      !translationResult.sentencePairs[currentSentenceIndex]
    ) {
      return false;
    }

    // 백엔드 API 응답 구조: originalSentence가 번역된 문장
    const correctSentence =
      translationResult.sentencePairs[currentSentenceIndex].originalSentence;

    if (!correctSentence) return false;

    const correctWords = correctSentence.split(" ");
    return (
      selectedWords.length === correctWords.length &&
      selectedWords.every((word, index) => word === correctWords[index])
    );
  }, [translationResult, currentSentenceIndex, selectedWords]);

  // 단계 이동 함수
  const handleStepNavigation = useCallback(
    (targetStep: Step) => {
      // 언어 모드에 따라 사용 가능한 단계 결정
      const steps =
        languageMode === "korean"
          ? ["question", "sentence-construction", "result"]
          : ["question", "result"];
      
      const currentIndex = steps.indexOf(currentStep);
      const targetIndex = steps.indexOf(targetStep);

      // 현재 단계와 같으면 아무것도 하지 않음
      if (targetStep === currentStep) return;

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
        } else if (targetStep === "sentence-construction") {
          // 한국어 모드에서만 사용되는 단계
          if (languageMode === "korean" && translationResult?.sentencePairs) {
            setSelectedWords([]);
            setAvailableWords([]);
            // translationResult가 있으면 첫 번째 문장으로 초기화
            if (translationResult.sentencePairs[0]) {
              const firstSentence = translationResult.sentencePairs[0];
              // 백엔드 API 응답 구조: shuffledWords가 이미 섞인 단어들
              if (
                firstSentence.shuffledWords &&
                firstSentence.shuffledWords.length > 0
              ) {
                setAvailableWords([...firstSentence.shuffledWords]);
              }
            }
            setCurrentSentenceIndex(0);
            // 완료 상태를 다시 초기화
            setCompletedSentences(
              new Array(translationResult.sentencePairs.length).fill(false)
            );
          }
        }
      }
    },
    [currentStep, translationResult, languageMode]
  );

  // 이전 단계로 이동
  const handlePreviousStep = useCallback(() => {
    const steps = ["question", "sentence-construction", "result"];
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

  // 언어 모드 전환 툴팁 표시
  useEffect(() => {
    if (currentStep === "question" && shouldShowFeatureTooltip(TOOLTIP_KEYS.DAILY_SENTENCE_LANGUAGE_MODE)) {
      setShowLanguageModeTooltip(true);
      updateLanguageModeTooltipPosition();
    }
  }, [currentStep]);

  useEffect(() => {
    if (showLanguageModeTooltip && languageModeRef.current) {
      updateLanguageModeTooltipPosition();
      const handleResize = () => updateLanguageModeTooltipPosition();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [showLanguageModeTooltip]);

  const updateLanguageModeTooltipPosition = () => {
    if (languageModeRef.current) {
      const rect = languageModeRef.current.getBoundingClientRect();
      setLanguageModeTooltipPosition({
        top: rect.top - 10,
        left: rect.left + rect.width / 2,
      });
    }
  };

  const handleCloseLanguageModeTooltip = () => {
    setShowLanguageModeTooltip(false);
    markTooltipAsSeen(TOOLTIP_KEYS.DAILY_SENTENCE_LANGUAGE_MODE);
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
    <div className="w-full h-full flex flex-col items-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#F7F8FB] dark:bg-gray-900">
      <div className="w-full max-w-[440px] bg-white dark:bg-gray-800 shadow-lg">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="p-2 text-gray-800 dark:text-gray-200">
              <Icons.arrowLeft />
            </button>
            <h1 className="font-bold text-gray-800 dark:text-gray-200" style={headerTextStyle}>
              오늘의 한줄 영어
            </h1>
            <div className="w-8" />
          </div>

          {/* Language Mode Toggle */}
          <LanguageModeToggle
            languageMode={languageMode}
            onModeChange={handleModeChange}
            smallTextStyle={smallTextStyle}
            languageModeRef={languageModeRef}
          />
        </div>

        <div className="min-h-[calc(100vh-180px)] overflow-y-auto pb-[72px]">
          {/* Progress Indicator */}
          <ProgressIndicator
            currentStep={currentStep}
            languageMode={languageMode}
            onStepClick={handleStepNavigation}
            xSmallTextStyle={xSmallTextStyle}
          />

          {/* Step 1: Question Display */}
          {currentStep === "question" && currentQuestion && (
            <QuestionStep
              currentQuestion={currentQuestion}
              userAnswer={userAnswer}
              languageMode={languageMode}
              isLargeTextMode={isLargeTextMode}
              englishQuestionFontSize={englishQuestionFontSize}
              englishQuestionRef={englishQuestionRef}
              englishQuestionContainerRef={englishQuestionContainerRef}
              baseTextStyle={baseTextStyle}
              smallTextStyle={smallTextStyle}
              xSmallTextStyle={xSmallTextStyle}
              onAnswerChange={setUserAnswer}
              onComplete={handleCompleteClick}
              isProcessing={translateWritingMutation.isPending || correctWritingMutation.isPending}
              formatDate={formatDate}
            />
          )}

          {/* Step 2: Sentence Construction - 한국어 모드에서만 표시 */}
          {currentStep === "sentence-construction" &&
            translationResult &&
            languageMode === "korean" &&
            translationResult.sentencePairs && (
              <SentenceConstructionStep
                translationResult={translationResult}
                currentSentenceIndex={currentSentenceIndex}
                selectedWords={selectedWords}
                availableWords={availableWords}
                completedSentences={completedSentences}
                isCorrectAnswer={isCorrectAnswer}
                baseTextStyle={baseTextStyle}
                smallTextStyle={smallTextStyle}
                xSmallTextStyle={xSmallTextStyle}
                headerTextStyle={headerTextStyle}
                onPrevious={handlePreviousStep}
                onWordSelect={handleWordSelect}
                onWordRemove={handleWordRemove}
                onNextSentence={handleNextSentence}
                onSkipToResult={() => {
                  setCompletedSentences((prev) => {
                    const newCompleted = [...prev];
                    newCompleted[currentSentenceIndex] = false;
                    return newCompleted;
                  });
                  setCurrentStep("result");
                }}
              />
            )}

          {/* Step 3: Result */}
          {currentStep === "result" && translationResult && (
            <ResultStep
              translationResult={translationResult}
              languageMode={languageMode}
              completedSentences={completedSentences}
              baseTextStyle={baseTextStyle}
              smallTextStyle={smallTextStyle}
              feedbackTextStyle={feedbackTextStyle}
              headerTextStyle={headerTextStyle}
              onPrevious={handlePreviousStep}
              onRestart={handleRestart}
            />
          )}
        </div>
      </div>
      <Navbar currentPage="daily-sentence" />

      {/* 확인 팝업 */}
      <ConfirmPopup
        show={showConfirmPopup}
        languageMode={languageMode}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirmPopup(false)}
        onNo={handlePopupNo}
      />

      {/* 언어 모드 전환 툴팁 */}
      {showLanguageModeTooltip && languageModeTooltipPosition && (
        <div
          className="fixed inset-0 z-50 pointer-events-none"
          style={{ touchAction: "none" }}
        >
          <div
            className="absolute"
            style={{
              top: `${languageModeTooltipPosition.top}px`,
              left: `${languageModeTooltipPosition.left}px`,
              transform: "translateX(-50%) translateY(-100%)",
              pointerEvents: "auto",
            }}
          >
            <Tooltip
              title="언어모드 전환"
              description="모드를 클릭하고, 자유롭게 대답해보세요! 한국어는 자연스런 영어로 번역해드려요"
              position="bottom"
              showCloseButton={true}
              onClose={handleCloseLanguageModeTooltip}
            />
          </div>
          <div
            className="absolute inset-0 bg-black bg-opacity-30 -z-10"
            onClick={handleCloseLanguageModeTooltip}
            style={{ pointerEvents: "auto" }}
          />
        </div>
      )}
    </div>
  );
};

export default DailySentence;
