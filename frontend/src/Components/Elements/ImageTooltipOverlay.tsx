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
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        bottom: "72px", // 네비게이션 바 높이만큼 제외
        touchAction: "pan-y",
      }}
      onClick={handleOverlayClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* X 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 bg-white rounded-full flex items-center justify-center shadow-lg z-10 hover:bg-gray-100 transition-colors"
        style={{
          width: "40px",
          height: "40px",
        }}
        aria-label="닫기"
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

      {/* 이미지 컨테이너 */}
      <div className="relative w-full h-full flex items-center justify-center px-4">
        <img
          src={images[currentIndex]}
          alt={`툴팁 ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          style={{
            borderRadius: "16px",
          }}
          draggable={false}
        />
      </div>

      {/* 페이지 인디케이터 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-white rounded-full shadow-md px-4 py-2">
          <span className="text-gray-700 font-medium text-sm">
            {currentIndex + 1}/{images.length}
          </span>
        </div>
      </div>

      {/* 이전/다음 화살표 (선택적) */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full flex items-center justify-center shadow-lg z-10 hover:bg-gray-100 transition-colors"
          style={{
            width: "40px",
            height: "40px",
          }}
          aria-label="이전"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 15L7 10L12 5"
              stroke="#666"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {currentIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full flex items-center justify-center shadow-lg z-10 hover:bg-gray-100 transition-colors"
          style={{
            width: "40px",
            height: "40px",
          }}
          aria-label="다음"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 5L13 10L8 15"
              stroke="#666"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

