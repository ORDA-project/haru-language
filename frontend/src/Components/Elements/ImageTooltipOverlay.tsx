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
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // 오른쪽 화면 클릭 시 다음 이미지
  const handleOverlayClick = (e: React.MouseEvent) => {
    const clickX = e.clientX;
    const screenWidth = window.innerWidth;
    if (clickX > screenWidth * 0.5) {
      // 오른쪽 절반 클릭
      handleNext();
    } else {
      // 왼쪽 절반 클릭
      handlePrev();
    }
  };

  if (!showTooltip) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.72)",
        bottom: "72px",
        touchAction: "pan-y",
      }}
      onClick={handleOverlayClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 상단: 닫기 버튼 + 페이지 안내 */}
      <div className="flex-shrink-0 flex items-center justify-center relative min-h-[56px] px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-full shadow-md px-5 py-2.5">
          <span className="text-gray-700 font-semibold text-sm tabular-nums">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg z-10 hover:bg-gray-100 active:scale-95 transition-all"
          aria-label="닫기"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L5 15M5 5L15 15" stroke="#555" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* 이미지 영역 */}
      <div className="flex-1 flex items-center justify-center min-h-0 px-4 py-2">
        <img
          src={images[currentIndex]}
          alt={`툴팁 ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain select-none"
          style={{ borderRadius: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}
          draggable={false}
        />
      </div>

      {/* 하단: 이전 / 다음 버튼 */}
      <div className="flex-shrink-0 flex items-center justify-center gap-4 pb-6 pt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
          style={{ minWidth: "48px" }}
          disabled={currentIndex === 0}
          aria-label="이전"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
          style={{ minWidth: "48px" }}
          disabled={currentIndex === images.length - 1}
          aria-label={currentIndex < images.length - 1 ? "다음" : "닫기"}
        >
          {currentIndex < images.length - 1 ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className="text-gray-700 font-medium text-sm">확인</span>
          )}
        </button>
      </div>
    </div>
  );
};

