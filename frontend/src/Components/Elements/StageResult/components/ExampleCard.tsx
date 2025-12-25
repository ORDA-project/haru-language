import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Example } from "../../../../types";

interface ExampleCardProps {
  example: Example;
  currentIndex: number;
  totalExamples: number;
  isPlaying: boolean;
  isLargeTextMode: boolean;
  textStyles: {
    xSmall: React.CSSProperties;
    small: React.CSSProperties;
  };
  onPrevious: () => void;
  onNext: () => void;
  onPlay: () => void;
  onDotClick: (index: number) => void;
}

const EXAMPLE_CARD_WIDTH = 343;

export const ExampleCard: React.FC<ExampleCardProps> = ({
  example,
  currentIndex,
  totalExamples,
  isPlaying,
  isLargeTextMode,
  textStyles,
  onPrevious,
  onNext,
  onPlay,
  onDotClick,
}) => {
  return (
    <div className="flex justify-start">
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
        style={{
          width: `${EXAMPLE_CARD_WIDTH}px`,
          paddingLeft: isLargeTextMode ? "20px" : "16px",
          paddingTop: isLargeTextMode ? "16px" : "12px",
          paddingBottom: isLargeTextMode ? "20px" : "16px",
          paddingRight: isLargeTextMode ? "20px" : "16px",
        }}
      >
        {/* Context Badge and Dots */}
        <div className="flex items-center justify-between mb-3">
          <div
            className="inline-block bg-[#B8E6D3] rounded-full px-2 py-0.5 border border-[#B8E6D3]"
            style={{ marginLeft: "-4px", marginTop: "-4px" }}
          >
            <span className="font-medium text-gray-900" style={textStyles.xSmall}>
              예문 상황
            </span>
          </div>
          <div className="flex items-center" style={{ gap: "4px" }}>
            {[0, 1, 2].map((dotIdx) => (
              <div
                key={dotIdx}
                onClick={() => {
                  if (dotIdx < totalExamples) {
                    onDotClick(dotIdx);
                  }
                }}
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor:
                    dotIdx === currentIndex && dotIdx < totalExamples ? "#00DAAA" : "#D1D5DB",
                  cursor: dotIdx < totalExamples ? "pointer" : "default",
                }}
                aria-label={`예문 ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Dialogue */}
        <div className="space-y-2 mb-3" style={{ paddingLeft: "8px" }}>
          {/* A's dialogue */}
          <div className="flex items-start space-x-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 bg-[#B8E6D3]`}
              style={textStyles.xSmall}
            >
              A
            </div>
            <div className="flex-1" style={{ paddingLeft: "4px", marginTop: "-2px" }}>
              <p className="font-medium text-gray-900 leading-relaxed" style={textStyles.small}>
                {example.dialogue?.A?.english || "예문 내용"}
              </p>
              {example.dialogue?.A?.korean && (
                <p className="text-gray-600 leading-relaxed mt-1" style={textStyles.small}>
                  {example.dialogue.A.korean}
                </p>
              )}
            </div>
          </div>

          {/* B's dialogue */}
          <div className="flex items-start space-x-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 bg-[#B8E6D3]`}
              style={textStyles.xSmall}
            >
              B
            </div>
            <div className="flex-1" style={{ paddingLeft: "4px", marginTop: "-2px" }}>
              <p className="font-medium text-gray-900 leading-relaxed" style={textStyles.small}>
                {example.dialogue?.B?.english || "예문 내용"}
              </p>
              {example.dialogue?.B?.korean && (
                <p className="text-gray-600 leading-relaxed mt-1" style={textStyles.small}>
                  {example.dialogue.B.korean}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={onPrevious}
            disabled={currentIndex === 0}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="이전 예문"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onPlay}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-md ${
              isPlaying ? "bg-[#FF6B35] hover:bg-[#E55A2B]" : "bg-[#00DAAA] hover:bg-[#00C299]"
            }`}
            aria-label={isPlaying ? "재생 중지" : "음성 재생"}
          >
            {isPlaying ? (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>
          <button
            onClick={onNext}
            disabled={currentIndex >= totalExamples - 1}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="다음 예문"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

