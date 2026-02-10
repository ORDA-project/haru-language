import React, { useState, useEffect } from "react";
import { ImageTooltipOverlay } from "./ImageTooltipOverlay";
import { shouldShowFeatureTooltip, markTooltipAsSeen, TOOLTIP_KEYS } from "../../utils/tooltipUtils";

// 이미지 import
import example1 from "../../Images/feature-help/툴팁_예문안내1.png";
import example2 from "../../Images/feature-help/툴팁_예문안내2.png";

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

  const images = [example1, example2];

  const handleClose = () => {
    setShowTooltip(false);
    markTooltipAsSeen(TOOLTIP_KEYS.EXAMPLE_GENERATION);
    onClose();
  };

  return (
    <ImageTooltipOverlay
      images={images}
      showTooltip={showTooltip}
      onClose={handleClose}
    />
  );
};

