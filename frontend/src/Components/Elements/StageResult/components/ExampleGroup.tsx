import React from "react";
import { Example } from "../../../../types";
import { ExampleCard } from "./ExampleCard";
import { formatContextText } from "../../../../utils/exampleUtils";

interface ExampleGroupProps {
  group: Example[];
  groupIndex: number;
  currentIndex: number;
  groupScrollIndex: number;
  isPlaying: boolean;
  playingExampleId: string | null;
  isLargeTextMode: boolean;
  textStyles: {
    base: React.CSSProperties;
    xSmall: React.CSSProperties;
    small: React.CSSProperties;
  };
  onPrevious: () => void;
  onNext: () => void;
  onPlay: (example: Example) => void;
  onDotClick: (index: number) => void;
  showAddButton?: boolean;
  onAddMore?: () => void;
  isLoadingMore?: boolean;
}

const ADD_BUTTON_WIDTH = 114;

export const ExampleGroup: React.FC<ExampleGroupProps> = ({
  group,
  groupIndex,
  currentIndex,
  groupScrollIndex,
  isPlaying,
  playingExampleId,
  isLargeTextMode,
  textStyles,
  onPrevious,
  onNext,
  onPlay,
  onDotClick,
  showAddButton = false,
  onAddMore,
  isLoadingMore = false,
}) => {
  const currentExample = group[currentIndex];
  if (!currentExample) return null;

  const isCardPlaying = playingExampleId === currentExample.id;

  return (
    <>
      <ExampleCard
        example={currentExample}
        currentIndex={currentIndex}
        totalExamples={group.length}
        isPlaying={isCardPlaying}
        isLargeTextMode={isLargeTextMode}
        textStyles={textStyles}
        onPrevious={onPrevious}
        onNext={onNext}
        onPlay={() => onPlay(currentExample)}
        onDotClick={onDotClick}
      />

      {/* 상황 설명 - 예문 카드 아래에 표시 */}
      {group[groupScrollIndex ?? currentIndex]?.context && (
        <div className="flex justify-start">
          <div
            className={`max-w-[80%] ${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"} rounded-lg bg-gray-50 text-gray-700 border border-gray-200`}
            style={{
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            }}
          >
            <p
              className="leading-relaxed whitespace-pre-wrap"
              style={{ ...textStyles.base, color: "#374151", lineHeight: "1.6" }}
            >
              {formatContextText(group[groupScrollIndex ?? currentIndex].context)}
            </p>
          </div>
        </div>
      )}

      {/* 예문 추가 버튼 */}
      {showAddButton && onAddMore && (
        <div className="flex justify-start mt-4">
          <button
            onClick={onAddMore}
            disabled={isLoadingMore}
            className="bg-[#00DAAA] hover:bg-[#00C495] active:bg-[#00B085] text-gray-900 font-semibold rounded-full transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            style={{
              minWidth: `${ADD_BUTTON_WIDTH}px`,
              height: isLargeTextMode ? "42px" : "32px",
              fontSize: isLargeTextMode ? "18px" : "14px",
              padding: isLargeTextMode ? "0 14px" : "0 12px",
              whiteSpace: "nowrap",
            }}
            aria-label="예문 추가"
          >
            {isLoadingMore ? (
              <>
                <svg
                  className="animate-spin flex-shrink-0"
                  width={isLargeTextMode ? "16" : "14"}
                  height={isLargeTextMode ? "16" : "14"}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>생성 중...</span>
              </>
            ) : (
              <>
                <svg
                  width={isLargeTextMode ? "16" : "14"}
                  height={isLargeTextMode ? "16" : "14"}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>예문추가</span>
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
};

