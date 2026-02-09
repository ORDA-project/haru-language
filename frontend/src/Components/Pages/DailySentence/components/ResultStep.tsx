import React, { useState, useEffect } from "react";
import { Icons } from "../../../Elements/Icons";
import { Tooltip } from "../../../Elements/Tooltip";
import { shouldShowFeatureTooltip, markTooltipAsSeen, TOOLTIP_KEYS } from "../../../../utils/tooltipUtils";

interface SentencePair {
  originalSentence?: string;
}

interface TranslationResult {
  originalText: string;
  processedText?: string;
  isCorrection?: boolean;
  sentencePairs?: SentencePair[];
  feedback?: string[];
}

type LanguageMode = "korean" | "english";

interface ResultStepProps {
  translationResult: TranslationResult;
  languageMode: LanguageMode;
  completedSentences: boolean[];
  baseTextStyle: React.CSSProperties;
  smallTextStyle: React.CSSProperties;
  feedbackTextStyle: React.CSSProperties;
  headerTextStyle: React.CSSProperties;
  onPrevious: () => void;
  onRestart: () => void;
}

export const ResultStep: React.FC<ResultStepProps> = ({
  translationResult,
  languageMode,
  completedSentences,
  baseTextStyle,
  smallTextStyle,
  feedbackTextStyle,
  headerTextStyle,
  onPrevious,
  onRestart,
}) => {
  const [showRevisedAnswerTooltip, setShowRevisedAnswerTooltip] = useState(false);
  const revisedAnswerRef = React.useRef<HTMLDivElement>(null);
  const [revisedAnswerTooltipPosition, setRevisedAnswerTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (shouldShowFeatureTooltip(TOOLTIP_KEYS.REVISED_ANSWER)) {
      setShowRevisedAnswerTooltip(true);
      updateRevisedAnswerTooltipPosition();
    }
  }, []);

  useEffect(() => {
    if (showRevisedAnswerTooltip && revisedAnswerRef.current) {
      updateRevisedAnswerTooltipPosition();
      const handleResize = () => updateRevisedAnswerTooltipPosition();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [showRevisedAnswerTooltip]);

  const updateRevisedAnswerTooltipPosition = () => {
    if (revisedAnswerRef.current) {
      const rect = revisedAnswerRef.current.getBoundingClientRect();
      setRevisedAnswerTooltipPosition({
        top: rect.top - 10,
        left: rect.left + rect.width / 2,
      });
    }
  };

  const handleCloseRevisedAnswerTooltip = () => {
    setShowRevisedAnswerTooltip(false);
    markTooltipAsSeen(TOOLTIP_KEYS.REVISED_ANSWER);
  };

  const allCompleted =
    languageMode === "korean"
      ? translationResult.sentencePairs &&
        completedSentences.length === translationResult.sentencePairs.length &&
        completedSentences.every((completed) => completed)
      : true;

  return (
    <div className="px-4 py-6 pb-6">
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={onPrevious}
          className="flex items-center space-x-2 text-gray-600 hover:text-[#00DAAA] transition-colors"
        >
          <Icons.arrowLeft />
          <span className="font-medium" style={smallTextStyle}>
            이전 단계
          </span>
        </button>
      </div>

      {/* Success Message */}
      <div className="bg-white rounded-3xl p-6 shadow-lg mb-6 text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
          <span className="text-3xl">🎉</span>
        </div>
        <h3 className="font-bold mb-2 text-gray-900" style={headerTextStyle}>
          {languageMode === "korean"
            ? allCompleted
              ? "전부 다 맞았어요!"
              : "학습 결과를 확인해보세요!"
            : "영어 첨삭이 완료되었어요!"}
        </h3>
        <p className="text-gray-600" style={baseTextStyle}>
          {languageMode === "korean" && !allCompleted
            ? "다음에는 더 잘할 수 있어요!"
            : "훌륭합니다!"}
        </p>
      </div>

      {/* Translation Result */}
      <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
        <div className="space-y-6">
          <div>
            <p className="text-gray-600 mb-2 font-medium" style={smallTextStyle}>
              원본 답변:
            </p>
            <p
              className="text-gray-800 leading-relaxed p-3 bg-gray-50 rounded-xl"
              style={baseTextStyle}
            >
              {translationResult.originalText}
            </p>
          </div>

          {translationResult.isCorrection ? (
            // 영어 모드: 첨삭 결과 표시
            <div ref={revisedAnswerRef}>
              <p className="text-gray-600 mb-3 font-medium" style={smallTextStyle}>
                수정된 답변:
              </p>
              <div
                className="bg-orange-50 rounded-xl p-4 border border-orange-200"
                style={{ paddingLeft: "12px", paddingTop: "12px" }}
              >
                <p
                  className="text-gray-800 font-semibold leading-relaxed"
                  style={smallTextStyle}
                >
                  {translationResult.processedText}
                </p>
              </div>
            </div>
          ) : (
            // 한국어 모드: 번역 결과 표시
            <div ref={revisedAnswerRef}>
              <p className="text-gray-600 mb-3 font-medium" style={smallTextStyle}>
                수정된 답변:
              </p>
              {translationResult.sentencePairs?.map((pair: any, index: number) => (
                <div key={index} className="mb-4">
                  <div
                    className="bg-orange-50 rounded-xl p-4 border border-orange-200"
                    style={{ paddingLeft: "12px", paddingTop: "12px" }}
                  >
                    <p
                      className="text-gray-800 font-semibold leading-relaxed"
                      style={smallTextStyle}
                    >
                      {pair.originalSentence}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 학습 피드백 */}
          <div>
            <p className="text-gray-600 mb-3 font-medium" style={smallTextStyle}>
              학습 피드백:
            </p>
            {translationResult.feedback && translationResult.feedback.length > 0 ? (
              <ul className="space-y-3">
                {translationResult.feedback.map((feedback: string, index: number) => (
                  <li
                    key={index}
                    className="text-gray-700 bg-green-50 p-4 rounded-xl border border-green-200"
                    style={feedbackTextStyle}
                  >
                    • {feedback}
                  </li>
                ))}
              </ul>
            ) : (
              <div
                className="text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-200"
                style={feedbackTextStyle}
              >
                피드백을 준비하고 있습니다...
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="w-full bg-[#00DAAA] text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-shadow"
        style={baseTextStyle}
      >
        다시 시작하기
      </button>

      {/* 수정본 툴팁 */}
      {showRevisedAnswerTooltip && revisedAnswerTooltipPosition && (
        <div
          className="fixed inset-0 z-50 pointer-events-none"
          style={{ 
            touchAction: "none",
            bottom: "72px", // 네비게이션 바 높이만큼 제외
          }}
        >
          <div
            className="absolute"
            style={{
              top: `${revisedAnswerTooltipPosition.top}px`,
              left: `${revisedAnswerTooltipPosition.left}px`,
              transform: "translateX(-50%) translateY(-100%)",
              pointerEvents: "auto",
            }}
          >
            <Tooltip
              title="수정본"
              description="다음에는 같은 질문에 이렇게 말할 수 있어요"
              position="bottom"
              showCloseButton={true}
              onClose={handleCloseRevisedAnswerTooltip}
              showUnderline={true}
              customWidth={243}
            />
          </div>
          <div
            className="absolute inset-0 -z-10"
            onClick={handleCloseRevisedAnswerTooltip}
            style={{ 
              pointerEvents: "auto",
              backgroundColor: "rgba(0, 0, 0, 0.3)", // 실무에서 많이 쓰는 반투명 방식
              bottom: "72px", // 네비게이션 바 높이만큼 제외
            }}
          />
        </div>
      )}
    </div>
  );
};

