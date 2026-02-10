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

  // 홈 화면 진입 시 툴팁 미확인 시 무조건 표시 (회원가입 직후 포함). 즉시 + 지연 이중 체크로 타이밍 보정
  useEffect(() => {
    if (location.pathname !== "/home") return;
    if (!shouldShowHomeTooltip()) return;
    setShowTooltip(true); // 즉시 시도
    const t = setTimeout(() => {
      if (shouldShowHomeTooltip()) setShowTooltip(true); // 한 번 더 시도 (Strict Mode·빠른 전환 대비)
    }, 200);
    return () => clearTimeout(t);
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

