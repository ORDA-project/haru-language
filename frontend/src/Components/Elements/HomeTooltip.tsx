import React, { useState, useEffect, useMemo } from "react";
import { BaseTooltipOverlay, TooltipConfig } from "./TooltipOverlay/BaseTooltipOverlay";
import { shouldShowHomeTooltip, markTooltipAsSeen, TOOLTIP_KEYS } from "../../utils/tooltipUtils";

interface HomeTooltipProps {
  isOnboarded: boolean;
  dailySentenceRef: React.RefObject<HTMLDivElement>;
  popSongRef: React.RefObject<HTMLDivElement>;
  exampleNavRef: React.RefObject<HTMLElement>;
  recordRef: React.RefObject<HTMLDivElement>;
}

export const HomeTooltip: React.FC<HomeTooltipProps> = ({
  isOnboarded,
  dailySentenceRef,
  popSongRef,
  exampleNavRef,
  recordRef,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // 첫 로그인 시에만 툴팁 표시
    if (shouldShowHomeTooltip(isOnboarded)) {
      setShowTooltip(true);
    }
  }, [isOnboarded]);

  // 페이지별 툴팁 설정
  const tooltips: TooltipConfig[][] = useMemo(() => [
    // 페이지 1/2
    [
      {
        title: "오늘의 한줄 영어",
        description: "매일매일 새로운 주제가 주어집니다. 영어, 한국어로 자유롭게 대답해보세요! 한국어는 자연스런 영어로 번역해드려요",
        position: "bottom" as const,
        ref: dailySentenceRef,
        offset: { x: 0, y: 0 },
        transform: "translateX(-50%) translateY(-100%)",
      },
      {
        title: "오늘의 추천 팝송",
        description: "옛날 팝송을 들으며 가사를 볼 수 있어요.",
        position: "top" as const,
        ref: popSongRef,
        offset: { x: 0, y: 0 },
        transform: "translateX(-50%)",
      },
      {
        title: "예문",
        description: "사진 / 채팅으로 더 많은 예문을 만들어드려요.",
        position: "bottom" as const,
        ref: exampleNavRef,
        offset: { x: 0, y: 0 },
        transform: "translateX(-50%) translateY(-100%)",
      },
    ],
    // 페이지 2/2
    [
      {
        title: "오늘의 추천 팝송",
        description: "옛날 팝송을 들으며 가사를 볼 수 있어요.",
        position: "top" as const,
        ref: popSongRef,
        offset: { x: 0, y: 0 },
        transform: "translateX(-50%)",
      },
      {
        title: "기록",
        description: "날짜별로 활동내역을 볼 수 있어요. 한줄 영어, 예문생성, 예문채팅 내역이 제공돼요.",
        position: "bottom" as const,
        ref: recordRef,
        offset: { x: 0, y: 0 },
        transform: "translateX(-50%) translateY(-100%)",
      },
    ],
  ], [dailySentenceRef, popSongRef, exampleNavRef, recordRef]);

  const handleNext = () => {
    if (currentPage < 1) {
      setCurrentPage((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setShowTooltip(false);
    markTooltipAsSeen(TOOLTIP_KEYS.HOME);
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

