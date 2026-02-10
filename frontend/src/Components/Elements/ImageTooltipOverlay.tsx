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

  // 이미지가 화면을 꽉 채우고, 그 위에 페이지 안내·닫기만 오버레이 (스와이프·화면 탭으로 이동)
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
    backgroundColor: "#000",
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
      {/* 이미지 전체 영역 (화면 크게) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={images[currentIndex]}
          alt={`툴팁 ${currentIndex + 1}`}
          className="w-full h-full object-contain select-none rounded-2xl"
          style={{ maxHeight: "100%" }}
          draggable={false}
        />
      </div>

      {/* 이미지 위 오버레이: 페이지 안내(1/2) + 닫기(X) — 실무에서 많이 쓰는 상단 바 */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center px-12 py-3 sm:py-4"
        style={{
          paddingTop: "max(12px, env(safe-area-inset-top))",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
        }}
      >
        <div className="rounded-full bg-black/40 backdrop-blur-md px-3 py-1.5">
          <span className="text-white/95 text-xs font-medium tabular-nums">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/95 hover:bg-black/50 active:scale-95 transition-all"
          style={{ right: "max(12px, env(safe-area-inset-right))" }}
          aria-label="닫기"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 5L5 15M5 5L15 15" />
          </svg>
        </button>
      </div>
    </div>
  );
};

