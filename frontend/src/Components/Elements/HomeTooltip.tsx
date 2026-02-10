import React, { useState, useEffect } from "react";
import { ImageTooltipOverlay } from "./ImageTooltipOverlay";
import { shouldShowHomeTooltip, markTooltipAsSeen, TOOLTIP_KEYS } from "../../utils/tooltipUtils";

// 이미지 import
import homeScreen1 from "../../Images/feature-help/툴팁_메인화면1.png";
import homeScreen2 from "../../Images/feature-help/툴팁_메인화면2.png";

interface HomeTooltipProps {
  dailySentenceRef: React.RefObject<HTMLDivElement | null>;
  popSongRef: React.RefObject<HTMLDivElement | null>;
  exampleNavRef: React.RefObject<HTMLElement | null>;
  recordRef: React.RefObject<HTMLDivElement | null>;
}

export const HomeTooltip: React.FC<HomeTooltipProps> = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // 처음 회원가입 후 홈 화면 진입 시 툴팁 표시
    if (shouldShowHomeTooltip()) {
      setShowTooltip(true);
    }
  }, []);

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

