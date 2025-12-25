import React from "react";
import { ChatExampleCard as BaseChatExampleCard } from "../../../Pages/QuestionDetail/components/ChatExampleCard";

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
  isLargeTextMode: boolean;
}

export const ChatExampleCard: React.FC<ChatExampleCardProps> = ({
  example,
  currentIndex,
  totalExamples,
  onPrevious,
  onNext,
  onPlay,
  isPlaying,
  isLargeTextMode,
}) => {
  const baseTextStyle: React.CSSProperties = {
    fontSize: `${isLargeTextMode ? 18 : 16}px`,
    wordBreak: "keep-all",
    overflowWrap: "break-word" as const,
  };
  const smallTextStyle: React.CSSProperties = {
    fontSize: `${isLargeTextMode ? 18 : 14}px`,
  };
  const xSmallTextStyle: React.CSSProperties = {
    fontSize: `${isLargeTextMode ? 16 : 12}px`,
  };

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <BaseChatExampleCard
          example={example}
          currentIndex={currentIndex}
          totalExamples={totalExamples}
          onPrevious={onPrevious}
          onNext={onNext}
          onPlay={onPlay}
          isPlaying={isPlaying}
          baseTextStyle={baseTextStyle}
          smallTextStyle={smallTextStyle}
          xSmallTextStyle={xSmallTextStyle}
        />
      </div>
    </div>
  );
};

