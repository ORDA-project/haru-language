import React, { useState, useEffect } from "react";
import { Icons } from "../../../Elements/Icons";
import { Tooltip } from "../../../Elements/Tooltip";
import { shouldShowFeatureTooltip, markTooltipAsSeen, TOOLTIP_KEYS } from "../../../../utils/tooltipUtils";

interface SentencePair {
  koreanSentence?: string;
  originalSentence?: string;
  shuffledWords?: string[];
}

interface TranslationResult {
  originalText: string;
  sentencePairs?: SentencePair[];
}

interface SentenceConstructionStepProps {
  translationResult: TranslationResult;
  currentSentenceIndex: number;
  selectedWords: string[];
  availableWords: string[];
  completedSentences: boolean[];
  isCorrectAnswer: () => boolean;
  baseTextStyle: React.CSSProperties;
  smallTextStyle: React.CSSProperties;
  xSmallTextStyle: React.CSSProperties;
  headerTextStyle: React.CSSProperties;
  onPrevious: () => void;
  onWordSelect: (word: string, index: number) => void;
  onWordRemove: (word: string, index: number) => void;
  onNextSentence: () => void;
  onSkipToResult: () => void;
}

export const SentenceConstructionStep: React.FC<SentenceConstructionStepProps> = ({
  translationResult,
  currentSentenceIndex,
  selectedWords,
  availableWords,
  completedSentences,
  isCorrectAnswer,
  baseTextStyle,
  smallTextStyle,
  xSmallTextStyle,
  headerTextStyle,
  onPrevious,
  onWordSelect,
  onWordRemove,
  onNextSentence,
  onSkipToResult,
}) => {
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const helpButtonRef = React.useRef<HTMLButtonElement>(null);
  const [helpTooltipPosition, setHelpTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (shouldShowFeatureTooltip(TOOLTIP_KEYS.SENTENCE_CONSTRUCTION_HELP)) {
      setShowHelpTooltip(true);
      updateHelpTooltipPosition();
    }
  }, []);

  useEffect(() => {
    if (showHelpTooltip && helpButtonRef.current) {
      updateHelpTooltipPosition();
      const handleResize = () => updateHelpTooltipPosition();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [showHelpTooltip]);

  const updateHelpTooltipPosition = () => {
    if (helpButtonRef.current) {
      const rect = helpButtonRef.current.getBoundingClientRect();
      setHelpTooltipPosition({
        top: rect.bottom + 10,
        left: rect.left + rect.width / 2,
      });
    }
  };

  const handleCloseHelpTooltip = () => {
    setShowHelpTooltip(false);
    markTooltipAsSeen(TOOLTIP_KEYS.SENTENCE_CONSTRUCTION_HELP);
  };
  return (
    <div className="px-4 py-6">
      <div className="bg-white rounded-3xl p-6 shadow-lg">
        <div className="flex items-center mb-4">
          <button
            onClick={onPrevious}
            className="flex items-center space-x-2 text-gray-600 hover:text-[#00DAAA] transition-colors"
          >
            <Icons.arrowLeft />
            <span className="font-medium" style={smallTextStyle}>이전 단계</span>
          </button>
        </div>
        <h2 className="font-bold mb-2 text-gray-900" style={headerTextStyle}>
          번역된 영어 문장을 올바른 순서로 배열해보세요
        </h2>

        {/* 문장별 진행 상황 */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          {translationResult.sentencePairs?.map((_: any, index: number) => {
            const isCompleted = completedSentences[index];
            const isCurrent = currentSentenceIndex === index;

            return (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-all duration-200 ${
                    isCurrent
                      ? "bg-[#FF6B35] text-white"
                      : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                  style={xSmallTextStyle}
                >
                  {isCompleted ? "✓" : index + 1}
                </div>
                {index < (translationResult.sentencePairs?.length || 0) - 1 && (
                  <div
                    className={`w-8 h-0.5 ${
                      isCompleted ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* 현재 문장 정보 */}
        <div className="text-center mb-6">
          <p className="text-gray-600 mb-2" style={smallTextStyle}>
            문장 {currentSentenceIndex + 1} / {translationResult.sentencePairs?.length || 0}
          </p>

          {/* 사용자 입력 원본 문장 표시 */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-4">
            <p className="text-gray-600 mb-1" style={smallTextStyle}>
              사용자 입력 (한국어)
            </p>
            <p className="text-gray-800 font-medium leading-relaxed" style={baseTextStyle}>
              {translationResult.sentencePairs?.[currentSentenceIndex]?.koreanSentence ||
                translationResult.originalText}
            </p>
          </div>

          {/* 번역된 문장 표시 */}
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <p className="text-gray-600 mb-1" style={smallTextStyle}>
              번역된 영어 문장 (재조합할 문장)
            </p>
            <p className="text-gray-800 font-medium leading-relaxed" style={baseTextStyle}>
              {isCorrectAnswer() ? (
                translationResult.sentencePairs?.[currentSentenceIndex]?.originalSentence ||
                "번역된 문장을 불러오는 중..."
              ) : selectedWords.length === 0 ? (
                "단어를 선택하여 문장을 완성해보세요"
              ) : (
                selectedWords.join(" ")
              )}
            </p>
          </div>
        </div>

        {/* 현재 문장 */}
        {translationResult.sentencePairs?.[currentSentenceIndex] && (
          <div className="mb-6">
            {/* 선택된 단어들 영역 */}
            <div className="bg-gray-100 rounded-2xl p-4 mb-4 min-h-[60px] border-2 border-dashed border-gray-300">
              {selectedWords.length === 0 ? (
                <p className="text-gray-500 text-center">단어를 올바른 순서로 배열하세요</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedWords.map((word, index) => (
                    <span
                      key={`selected-${index}`}
                      onClick={() => onWordRemove(word, index)}
                      className="bg-[#00DAAA] text-white px-4 py-2 rounded-full font-medium shadow-md cursor-pointer hover:bg-[#00C299] transition-colors"
                      style={smallTextStyle}
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
                  key={`available-${index}-${word}`}
                  onClick={() => onWordSelect(word, index)}
                  className="bg-[#FF6B35] text-white px-4 py-2 rounded-full font-medium shadow-md cursor-pointer hover:bg-[#E55A2B] transition-colors"
                  style={smallTextStyle}
                >
                  {word}
                </span>
              ))}
            </div>

            {/* 정답 확인 메시지 */}
            {selectedWords.length > 0 && (
              <div className="mt-4 text-center">
                {isCorrectAnswer() ? (
                  <p className="text-green-600 font-semibold">정답입니다!</p>
                ) : (
                  <p className="text-gray-500">단어를 더 추가하거나 순서를 바꿔보세요</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col">
          <button
            onClick={onNextSentence}
            disabled={!isCorrectAnswer()}
            className="w-full bg-[#FF6B35] text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            style={headerTextStyle}
          >
            {translationResult.sentencePairs &&
            currentSentenceIndex < (translationResult.sentencePairs.length - 1)
              ? "다음 문장"
              : "결과 확인"}
          </button>
          <button
            ref={helpButtonRef}
            onClick={onSkipToResult}
            className="w-full text-center text-gray-600 underline py-2 hover:text-gray-800 transition-colors"
            style={smallTextStyle}
          >
            모르겠어요...
          </button>
        </div>
      </div>

      {/* 모르겠어요 툴팁 */}
      {showHelpTooltip && helpTooltipPosition && (
        <div
          className="fixed inset-0 z-50 pointer-events-none"
          style={{ touchAction: "none" }}
        >
          <div
            className="absolute"
            style={{
              top: `${helpTooltipPosition.top}px`,
              left: `${helpTooltipPosition.left}px`,
              transform: "translateX(-50%)",
              pointerEvents: "auto",
            }}
          >
            <Tooltip
              title="모르겠어요..."
              description="잘 모르겠다면 클릭해서 결과를 볼 수 있어요."
              position="top"
              showCloseButton={true}
              onClose={handleCloseHelpTooltip}
              showUnderline={false}
            />
          </div>
          <div
            className="absolute inset-0 -z-10"
            onClick={handleCloseHelpTooltip}
            style={{ 
              pointerEvents: "auto",
              backgroundColor: "rgba(0, 0, 0, 0.3)", // 실무에서 많이 쓰는 반투명 방식
            }}
          />
        </div>
      )}
    </div>
  );
};

