import React, { useState, useEffect, useRef } from "react";
import { Tooltip } from "./Tooltip";
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
  const [tooltipPositions, setTooltipPositions] = useState<{
    [key: string]: { top: number; left: number };
  }>({});

  useEffect(() => {
    // 첫 로그인 시에만 툴팁 표시
    if (shouldShowHomeTooltip(isOnboarded)) {
      setShowTooltip(true);
      updateTooltipPositions();
    }
  }, [isOnboarded]);

  useEffect(() => {
    if (showTooltip) {
      updateTooltipPositions();
      const handleResize = () => updateTooltipPositions();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [showTooltip, currentPage]);

  const updateTooltipPositions = () => {
    const positions: { [key: string]: { top: number; left: number } } = {};

    // 페이지 1/2: 오늘의 한줄 영어 툴팁
    if (dailySentenceRef.current && currentPage === 0) {
      const rect = dailySentenceRef.current.getBoundingClientRect();
      positions.dailySentence = {
        top: rect.top - 10,
        left: rect.left + rect.width / 2,
      };
    }

    // 페이지 1/2: 오늘의 추천 팝송 툴팁
    if (popSongRef.current && currentPage === 0) {
      const rect = popSongRef.current.getBoundingClientRect();
      positions.popSong = {
        top: rect.bottom + 10,
        left: rect.left + rect.width / 2,
      };
    }

    // 페이지 1/2: 예문 툴팁 (하단 네비게이션)
    if (exampleNavRef.current && currentPage === 0) {
      const rect = exampleNavRef.current.getBoundingClientRect();
      positions.example = {
        top: rect.top - 10,
        left: rect.left + rect.width / 2,
      };
    }

    // 페이지 2/2: 오늘의 추천 팝송 툴팁
    if (popSongRef.current && currentPage === 1) {
      const rect = popSongRef.current.getBoundingClientRect();
      positions.popSong2 = {
        top: rect.bottom + 10,
        left: rect.left + rect.width / 2,
      };
    }

    // 페이지 2/2: 기록 툴팁
    if (recordRef.current && currentPage === 1) {
      const rect = recordRef.current.getBoundingClientRect();
      positions.record = {
        top: rect.top - 10,
        left: rect.left + rect.width / 2,
      };
    }

    setTooltipPositions(positions);
  };

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

  const handleOverlayClick = (e: React.MouseEvent) => {
    // 오른쪽 화면 클릭 시 다음 페이지
    const clickX = e.clientX;
    const screenWidth = window.innerWidth;
    if (clickX > screenWidth * 0.67) {
      handleNext();
    }
  };

  if (!showTooltip) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-30"
      onClick={handleOverlayClick}
      style={{ touchAction: "none" }}
    >
      {/* 페이지 인디케이터 */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-white rounded-full px-4 py-2 shadow-md">
          <span className="text-gray-700 font-medium">
            {currentPage + 1}/2
          </span>
        </div>
      </div>

      {/* 닫기 버튼 (마지막 페이지에서만) */}
      {currentPage === 1 && (
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md z-10 hover:bg-gray-100 transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 5L5 15M5 5L15 15"
              stroke="#666"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      {/* 페이지 1/2 툴팁들 */}
      {currentPage === 0 && (
        <>
          {/* 오늘의 한줄 영어 툴팁 */}
          {tooltipPositions.dailySentence && (
            <div
              className="absolute"
              style={{
                top: `${tooltipPositions.dailySentence.top}px`,
                left: `${tooltipPositions.dailySentence.left}px`,
                transform: "translateX(-50%) translateY(-100%)",
              }}
            >
              <Tooltip
                title="오늘의 한줄 영어"
                description="매일매일 새로운 주제가 주어집니다. 영어, 한국어로 자유롭게 대답해보세요! 한국어는 자연스런 영어로 번역해드려요"
                position="bottom"
              />
            </div>
          )}

          {/* 오늘의 추천 팝송 툴팁 */}
          {tooltipPositions.popSong && (
            <div
              className="absolute"
              style={{
                top: `${tooltipPositions.popSong.top}px`,
                left: `${tooltipPositions.popSong.left}px`,
                transform: "translateX(-50%)",
              }}
            >
              <Tooltip
                title="오늘의 추천 팝송"
                description="옛날 팝송을 들으며 가사를 볼 수 있어요."
                position="top"
              />
            </div>
          )}

          {/* 예문 툴팁 */}
          {tooltipPositions.example && (
            <div
              className="absolute"
              style={{
                top: `${tooltipPositions.example.top}px`,
                left: `${tooltipPositions.example.left}px`,
                transform: "translateX(-50%) translateY(-100%)",
              }}
            >
              <Tooltip
                title="예문"
                description="사진 / 채팅으로 더 많은 예문을 만들어드려요."
                position="bottom"
              />
            </div>
          )}
        </>
      )}

      {/* 페이지 2/2 툴팁들 */}
      {currentPage === 1 && (
        <>
          {/* 오늘의 추천 팝송 툴팁 */}
          {tooltipPositions.popSong2 && (
            <div
              className="absolute"
              style={{
                top: `${tooltipPositions.popSong2.top}px`,
                left: `${tooltipPositions.popSong2.left}px`,
                transform: "translateX(-50%)",
              }}
            >
              <Tooltip
                title="오늘의 추천 팝송"
                description="옛날 팝송을 들으며 가사를 볼 수 있어요."
                position="top"
              />
            </div>
          )}

          {/* 기록 툴팁 */}
          {tooltipPositions.record && (
            <div
              className="absolute"
              style={{
                top: `${tooltipPositions.record.top}px`,
                left: `${tooltipPositions.record.left}px`,
                transform: "translateX(-50%) translateY(-100%)",
              }}
            >
              <Tooltip
                title="기록"
                description="날짜별로 활동내역을 볼 수 있어요. 한줄 영어, 예문생성, 예문채팅 내역이 제공돼요."
                position="bottom"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

