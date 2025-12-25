import React from "react";

interface ChatExampleCardProps {
  example: {
    dialogue?: {
      A?: { english?: string; korean?: string };
      B?: { english?: string; korean?: string };
    };
  };
  currentIndex: number;
  totalExamples: number;
  onPrevious: () => void;
  onNext: () => void;
  onPlay: () => void;
  isPlaying: boolean;
  baseTextStyle: React.CSSProperties;
  smallTextStyle: React.CSSProperties;
  xSmallTextStyle: React.CSSProperties;
}

export const ChatExampleCard: React.FC<ChatExampleCardProps> = ({
  example,
  currentIndex,
  totalExamples,
  onPrevious,
  onNext,
  onPlay,
  isPlaying,
  baseTextStyle,
  smallTextStyle,
  xSmallTextStyle,
}) => {
  return (
    <div className="px-4 py-3 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Context Badge and Dots */}
      <div className="flex items-center justify-between mb-3">
        <div
          className="inline-block bg-[#B8E6D3] rounded-full px-2 py-0.5 border border-[#B8E6D3]"
          style={{ marginLeft: "-4px", marginTop: "-4px" }}
        >
          <span className="font-medium text-gray-900" style={xSmallTextStyle}>
            예문 상황
          </span>
        </div>
        <div className="flex items-center" style={{ gap: "4px" }}>
          {totalExamples > 0 &&
            [0, 1, 2].map((dotIdx) => (
              <div
                key={dotIdx}
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor:
                    dotIdx === currentIndex && dotIdx < totalExamples
                      ? "#00DAAA"
                      : "#D1D5DB",
                }}
              />
            ))}
        </div>
      </div>

      {/* Dialogue */}
      <div className="space-y-2 mb-3" style={{ paddingLeft: "8px" }}>
        {/* A's dialogue */}
        <div className="flex items-start space-x-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 bg-[#B8E6D3]"
            style={xSmallTextStyle}
          >
            A
          </div>
          <div className="flex-1" style={{ paddingLeft: "4px", marginTop: "-2px" }}>
            <p className="font-medium text-gray-900 leading-relaxed" style={smallTextStyle}>
              {example.dialogue?.A?.english || "예문 내용"}
            </p>
            <p className="text-gray-600 leading-relaxed mt-1" style={smallTextStyle}>
              {example.dialogue?.A?.korean || "예문 한글버전"}
            </p>
          </div>
        </div>

        {/* B's dialogue */}
        <div className="flex items-start space-x-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 bg-[#B8E6D3]"
            style={xSmallTextStyle}
          >
            B
          </div>
          <div className="flex-1" style={{ paddingLeft: "4px", marginTop: "-2px" }}>
            <p className="font-medium text-gray-900 leading-relaxed" style={smallTextStyle}>
              {example.dialogue?.B?.english || "예문 내용"}
            </p>
            <p className="text-gray-600 leading-relaxed mt-1" style={smallTextStyle}>
              {example.dialogue?.B?.korean || "예문 한글버전"}
            </p>
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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={onPlay}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-md ${
            isPlaying
              ? "bg-[#FF6B35] hover:bg-[#E55A2B]"
              : "bg-[#00DAAA] hover:bg-[#00C299]"
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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

