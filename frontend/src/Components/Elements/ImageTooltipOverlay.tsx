import React, { useState, useEffect, useRef } from "react";

interface ImageTooltipOverlayProps {
  images: string[];
  showTooltip: boolean;
  onClose: () => void;
}

export const ImageTooltipOverlay: React.FC<ImageTooltipOverlayProps> = ({
  images,
  showTooltip,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 최소 스와이프 거리 (픽셀)
  const minSwipeDistance = 50;

  useEffect(() => {
    if (showTooltip) {
      setCurrentIndex(0);
    }
  }, [showTooltip]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isRightSwipe && currentIndex < images.length - 1) {
      // 오른쪽으로 스와이프 (다음 이미지)
      setCurrentIndex((prev) => prev + 1);
    } else if (isLeftSwipe && currentIndex > 0) {
      // 왼쪽으로 스와이프 (이전 이미지)
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // 마지막 화면: 스펙대로 X 또는 화면 클릭 시 툴팁 사라짐
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // 스펙: 화면 오른쪽 터치 → 다음 화면 / 마지막 화면에서 X 또는 화면 클릭 → 툴팁 사라짐
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (currentIndex === images.length - 1) {
      onClose();
      return;
    }
    const clickX = e.clientX;
    const screenWidth = window.innerWidth;
    if (clickX > screenWidth * 0.5) {
      handleNext();
    } else {
      handlePrev();
    }
  };

  if (!showTooltip) return null;

  // 모바일 웹: 뷰포트 높이에서 하단 네비 높이·safe-area 제외
  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: "72px",
    height: "calc(100dvh - 72px)",
    minHeight: "calc(100dvh - 72px)",
    paddingTop: "env(safe-area-inset-top, 0)",
    paddingBottom: "env(safe-area-inset-bottom, 0)",
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    touchAction: "pan-y",
    zIndex: 50,
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-x-0 top-0 z-50 flex flex-col"
      style={overlayStyle}
      onClick={handleOverlayClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 상단: 닫기 버튼 + 페이지 안내 */}
      <div className="flex-shrink-0 flex items-center justify-center relative min-h-[48px] sm:min-h-[56px] px-3 sm:px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-full shadow-md px-4 py-2 sm:px-5 sm:py-2.5">
          <span className="text-gray-700 font-semibold text-xs sm:text-sm tabular-nums">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg z-10 hover:bg-gray-100 active:scale-95 transition-all"
          aria-label="닫기"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-5 sm:h-5">
            <path d="M15 5L5 15M5 5L15 15" stroke="#555" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* 이미지 영역 - 모바일에서 비율 유지하며 꽉 채움 */}
      <div className="flex-1 flex items-center justify-center min-h-0 px-3 py-2 sm:px-4">
        <img
          src={images[currentIndex]}
          alt={`툴팁 ${currentIndex + 1}`}
          className="max-w-full w-full max-h-full object-contain select-none"
          style={{ borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}
          draggable={false}
        />
      </div>

      {/* 하단: 이전 / 다음 버튼 */}
      <div className="flex-shrink-0 flex items-center justify-center gap-3 sm:gap-4 pb-4 pt-2 sm:pb-6">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
          style={{ minWidth: "44px" }}
          disabled={currentIndex === 0}
          aria-label="이전"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-6 sm:h-6">
            <path d="M15 18L9 12L15 6" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
          style={{ minWidth: "44px" }}
          aria-label={currentIndex < images.length - 1 ? "다음" : "확인"}
        >
          {currentIndex < images.length - 1 ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-6 sm:h-6">
              <path d="M9 18L15 12L9 6" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className="text-gray-700 font-medium text-xs sm:text-sm">확인</span>
          )}
        </button>
      </div>
    </div>
  );
};

