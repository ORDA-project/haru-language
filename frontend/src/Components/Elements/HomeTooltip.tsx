import React, { useState, useEffect } from "react";
import { ImageTooltipOverlay } from "./ImageTooltipOverlay";
import { shouldShowHomeTooltip, markTooltipAsSeen, TOOLTIP_KEYS } from "../../utils/tooltipUtils";

// 이미지 import
import homeScreen1 from "../../Images/feature-help/툴팁_메인화면1.png";
import homeScreen2 from "../../Images/feature-help/툴팁_메인화면2.png";

interface HomeTooltipProps {
  isOnboarded: boolean;
  dailySentenceRef: React.RefObject<HTMLDivElement | null>;
  popSongRef: React.RefObject<HTMLDivElement | null>;
  exampleNavRef: React.RefObject<HTMLElement | null>;
  recordRef: React.RefObject<HTMLDivElement | null>;
}

export const HomeTooltip: React.FC<HomeTooltipProps> = ({
  isOnboarded,
  dailySentenceRef,
  popSongRef,
  exampleNavRef,
  recordRef,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // 첫 로그인 시에만 툴팁 표시
    if (shouldShowHomeTooltip(isOnboarded)) {
      setShowTooltip(true);
    }
  }, [isOnboarded]);

  const images = [homeScreen1, homeScreen2];

  const handleClose = () => {
    setShowTooltip(false);
    markTooltipAsSeen(TOOLTIP_KEYS.HOME);
  };

  return (
    <ImageTooltipOverlay
      images={images}
      showTooltip={showTooltip}
      onClose={handleClose}
    />
  );
};

