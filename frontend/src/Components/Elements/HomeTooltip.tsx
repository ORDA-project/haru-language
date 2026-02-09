import React, { useState, useEffect, useMemo } from "react";
import { BaseTooltipOverlay, TooltipConfig } from "./TooltipOverlay/BaseTooltipOverlay";
import { shouldShowHomeTooltip, markTooltipAsSeen, TOOLTIP_KEYS } from "../../utils/tooltipUtils";

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
        description: "매일매일 새로운 주제가 주어집니다.\n영어, 한국어로 자유롭게 대답해보세요!\n한국어는 자연스런 영어로 번역해드려요",
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
        customWidth: 243, // 오늘의 한줄 영어와 동일한 너비
      },
      {
        title: "예문",
        description: "사진 / 채팅으로\n더 많은 예문을\n만들어드려요.",
        position: "bottom" as const,
        ref: exampleNavRef,
        offset: { x: 0, y: 0 },
        transform: "translateX(-50%) translateY(-100%)",
        backgroundColor: "#00DAAA", // 초록색 배경
        borderColor: "#DEE2ED", // 흰색 테두리
        textAlign: "center", // 중앙 정렬
        customWidth: 130,
        customHeight: 124,
        customPadding: { top: 12, right: 16, bottom: 12, left: 16 },
        titleGap: 8, // 제목과 설명 사이 간격
        titleColor: "#000000", // 제목 검은색
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
        customWidth: 243, // 오늘의 한줄 영어와 동일한 너비
      },
      {
        title: "기록",
        description: "날짜별로 활동내역을 볼 수 있어요.\n한줄 영어, 예문생성, 예문채팅 내역이 제공돼요.",
        position: "bottom" as const,
        ref: recordRef,
        offset: { x: 0, y: 0 },
        transform: "translateX(-50%) translateY(-100%)",
        customWidth: 243, // 다른 툴팁과 동일한 너비
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

