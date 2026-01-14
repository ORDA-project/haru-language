import React from "react";
import { WritingQuestion } from "../../../../entities/writing/types";

type LanguageMode = "korean" | "english";

interface QuestionStepProps {
  currentQuestion: WritingQuestion;
  userAnswer: string;
  languageMode: LanguageMode;
  isLargeTextMode: boolean;
  englishQuestionFontSize: number | null;
  englishQuestionRef: React.RefObject<HTMLDivElement | null>;
  englishQuestionContainerRef: React.RefObject<HTMLDivElement | null>;
  baseTextStyle: React.CSSProperties;
  smallTextStyle: React.CSSProperties;
  xSmallTextStyle: React.CSSProperties;
  onAnswerChange: (value: string) => void;
  onComplete: () => void;
  isProcessing: boolean;
  formatDate: () => string;
}

export const QuestionStep: React.FC<QuestionStepProps> = ({
  currentQuestion,
  userAnswer,
  languageMode,
  isLargeTextMode,
  englishQuestionFontSize,
  englishQuestionRef,
  englishQuestionContainerRef,
  baseTextStyle,
  smallTextStyle,
  xSmallTextStyle,
  onAnswerChange,
  onComplete,
  isProcessing,
  formatDate,
}) => {
  return (
    <div className="px-4 py-6 w-full box-border">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border-4 border-[#00DAAA] dark:border-[#00DAAA] w-full max-w-full overflow-hidden box-border min-w-0">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2 min-w-0">
          <div className="bg-[#00E8B6] dark:bg-[#00DAAA] px-4 py-2 rounded-full flex-shrink-0">
            <span className="font-bold text-gray-800 dark:text-gray-900 whitespace-nowrap" style={smallTextStyle}>
              오늘의 한줄 영어
            </span>
          </div>
          <span className="text-gray-500 dark:text-gray-400 font-medium flex-shrink-0 whitespace-nowrap" style={smallTextStyle}>
            {formatDate()}
          </span>
        </div>

        {/* 모든 질문을 한번에 표시 */}
        <div className="space-y-4 mb-12 w-full min-w-0">
          {/* 첫 번째 질문 */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 w-full overflow-hidden box-border min-w-0" ref={englishQuestionContainerRef}>
            <div
              ref={englishQuestionRef}
              className="font-bold text-gray-900 dark:text-gray-100 leading-relaxed mb-2 w-full min-w-0 whitespace-normal"
              style={{
                ...baseTextStyle,
                fontSize: englishQuestionFontSize ? `${englishQuestionFontSize}px` : baseTextStyle.fontSize,
                lineHeight: "1.4",
              }}
            >
              {languageMode === "korean"
                ? currentQuestion.englishQuestion
                : currentQuestion.koreanQuestion}
            </div>
            <div className="text-gray-600 dark:text-gray-300 leading-relaxed w-full min-w-0" style={baseTextStyle}>
              {languageMode === "korean"
                ? currentQuestion.koreanQuestion
                : currentQuestion.englishQuestion}
            </div>
          </div>

          {/* 두 번째 질문 (선택사항) */}
          {currentQuestion.secondQuestion && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 w-full overflow-hidden box-border min-w-0">
              <div className="text-gray-500 dark:text-gray-400 mb-1 whitespace-nowrap" style={xSmallTextStyle}>
                (선택)
              </div>
              <div className="font-bold text-gray-900 dark:text-gray-100 leading-relaxed mb-2 w-full min-w-0" style={baseTextStyle}>
                {languageMode === "korean"
                  ? currentQuestion.secondQuestion.english
                  : currentQuestion.secondQuestion.korean}
              </div>
              <div className="text-gray-600 dark:text-gray-300 leading-relaxed w-full min-w-0" style={baseTextStyle}>
                {languageMode === "korean"
                  ? currentQuestion.secondQuestion.korean
                  : currentQuestion.secondQuestion.english}
              </div>
            </div>
          )}

          {/* 세 번째 질문 (선택사항) */}
          {currentQuestion.thirdQuestion && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 w-full overflow-hidden box-border min-w-0">
              <div className="text-gray-500 dark:text-gray-400 mb-1 whitespace-nowrap" style={xSmallTextStyle}>
                (선택)
              </div>
              <div className="font-bold text-gray-900 dark:text-gray-100 leading-relaxed mb-2 w-full min-w-0" style={baseTextStyle}>
                {languageMode === "korean"
                  ? currentQuestion.thirdQuestion.english
                  : currentQuestion.thirdQuestion.korean}
              </div>
              <div className="text-gray-600 dark:text-gray-300 leading-relaxed w-full min-w-0" style={baseTextStyle}>
                {languageMode === "korean"
                  ? currentQuestion.thirdQuestion.korean
                  : currentQuestion.thirdQuestion.english}
              </div>
            </div>
          )}
        </div>

        {/* 텍스트 입력 영역 */}
        <div className="relative w-full min-w-0 box-border mb-8">
          <textarea
            value={userAnswer}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder={
              languageMode === "korean"
                ? "여기에 답변을 작성해주세요..."
                : "Please write your answer here..."
            }
            className="w-full h-40 p-5 border-2 border-gray-200 dark:border-gray-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#00DAAA] focus:border-transparent box-border min-w-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            style={{ ...baseTextStyle, width: "100%", maxWidth: "100%" }}
          />
        </div>

        <button
          onClick={onComplete}
          disabled={!userAnswer.trim() || isProcessing}
          className={`w-full py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-shadow box-border min-w-0 ${
            userAnswer.trim()
              ? "bg-[#FF6B35] text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          style={{ ...baseTextStyle, width: "100%", maxWidth: "100%" }}
        >
          {isProcessing ? "처리 중..." : "완료"}
        </button>
      </div>
    </div>
  );
};

