import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
  const location = useLocation();

  // 홈 화면에 들어올 때마다 툴팁 미확인 시 표시 (회원가입→마이페이지→홈 경로 포함)
  useEffect(() => {
    if (location.pathname !== "/home") return;
    if (shouldShowHomeTooltip()) {
      setShowTooltip(true);
    }
  }, [location.pathname]);

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

