import React, { useState, useEffect, useMemo } from "react";
import { BaseTooltipOverlay, TooltipConfig } from "./TooltipOverlay/BaseTooltipOverlay";
import { shouldShowFeatureTooltip, markTooltipAsSeen, TOOLTIP_KEYS } from "../../utils/tooltipUtils";

interface ExampleGenerationTooltipProps {
  currentPage: number;
  imageUploadRef?: React.RefObject<HTMLButtonElement | null>;
  chatRef?: React.RefObject<HTMLButtonElement | null>;
  speakerRef?: React.RefObject<HTMLElement | null>;
  addExampleRef?: React.RefObject<HTMLElement | null>;
  onNext: () => void;
  onClose: () => void;
}

export const ExampleGenerationTooltip: React.FC<ExampleGenerationTooltipProps> = ({
  currentPage,
  imageUploadRef,
  chatRef,
  speakerRef,
  addExampleRef,
  onNext,
  onClose,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (shouldShowFeatureTooltip(TOOLTIP_KEYS.EXAMPLE_GENERATION)) {
      setShowTooltip(true);
    }
  }, []); // 한 번만 체크

  // 페이지별 툴팁 설정
  const tooltips: TooltipConfig[][] = useMemo(() => [
    // 페이지 1/2
    [
      {
        title: "이미지 예문생성",
        description: "교재를 찍어서 바로 올릴 수도 있고, 갤러리에서 올릴 수도 있어요.",
        position: "top" as const,
        ref: imageUploadRef,
        offset: { x: 0, y: 0 },
        transform: "translateX(-50%)",
      },
      {
        title: "채팅 예문생성",
        description: "어색한 부분, 기억안나는 단어 등 모든 것을 물어볼 수 있어요.",
        position: "bottom" as const,
        ref: chatRef,
        offset: { x: 0, y: 0 },
        transform: "translateX(-50%) translateY(-100%)",
      },
    ],
    // 페이지 2/2
    [
      {
        title: "스피커",
        description: "예문을 직접 들어보고 발음을 따라해봐요.",
        position: "top" as const,
        ref: speakerRef,
        offset: { x: 0, y: 0 },
        transform: "translateX(-50%)",
      },
      {
        title: "예문추가",
        description: "예문을 더 보고싶다면, 예문추가를 할 수 있어요.",
        position: "bottom" as const,
        ref: addExampleRef,
        offset: { x: 0, y: 0 },
        transform: "translateX(-50%) translateY(-100%)",
      },
    ],
  ], [imageUploadRef, chatRef, speakerRef, addExampleRef]);

  const handleNext = () => {
    if (currentPage < 1) {
      onNext();
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setShowTooltip(false);
    markTooltipAsSeen(TOOLTIP_KEYS.EXAMPLE_GENERATION);
    onClose();
  };

  return (
    <BaseTooltipOverlay
      tooltips={tooltips}
      currentPage={currentPage}
      totalPages={2}
      onNext={handleNext}
      onClose={handleClose}
      showTooltip={showTooltip}
    />
  );
};

