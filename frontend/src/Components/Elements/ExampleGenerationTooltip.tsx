import React, { useState, useEffect } from "react";
import { Tooltip } from "./Tooltip";
import { shouldShowFeatureTooltip, markTooltipAsSeen, TOOLTIP_KEYS } from "../../utils/tooltipUtils";

interface ExampleGenerationTooltipProps {
  currentPage: number;
  imageUploadRef?: React.RefObject<HTMLButtonElement>;
  chatRef?: React.RefObject<HTMLButtonElement>;
  speakerRef?: React.RefObject<HTMLElement>;
  addExampleRef?: React.RefObject<HTMLElement>;
  onNext: () => void;
  onClose: () => void;
}

export const ExampleGenerationTooltip: React.FC<ExampleGenerationTooltipProps> = ({
  currentPage,
  imageUploadRef,
  chatRef,
  speakerRef,
  addExampleRef,
  onNext,
  onClose,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPositions, setTooltipPositions] = useState<{
    [key: string]: { top: number; left: number };
  }>({});

  useEffect(() => {
    if (shouldShowFeatureTooltip(TOOLTIP_KEYS.EXAMPLE_GENERATION)) {
      setShowTooltip(true);
      updateTooltipPositions();
    }
  }, [currentPage]);

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

    // 페이지 1/2: 이미지 예문생성 툴팁
    if (imageUploadRef?.current && currentPage === 0) {
      const rect = imageUploadRef.current.getBoundingClientRect();
      positions.imageUpload = {
        top: rect.bottom + 10,
        left: rect.left + rect.width / 2,
      };
    }

    // 페이지 1/2: 채팅 예문생성 툴팁
    if (chatRef?.current && currentPage === 0) {
      const rect = chatRef.current.getBoundingClientRect();
      positions.chat = {
        top: rect.top - 10,
        left: rect.left + rect.width / 2,
      };
    }

    // 페이지 2/2: 스피커 툴팁
    if (speakerRef?.current && currentPage === 1) {
      const rect = speakerRef.current.getBoundingClientRect();
      positions.speaker = {
        top: rect.bottom + 10,
        left: rect.left + rect.width / 2,
      };
    }

    // 페이지 2/2: 예문추가 툴팁
    if (addExampleRef?.current && currentPage === 1) {
      const rect = addExampleRef.current.getBoundingClientRect();
      positions.addExample = {
        top: rect.top - 10,
        left: rect.left + rect.width / 2,
      };
    }

    setTooltipPositions(positions);
  };

  const handleClose = () => {
    setShowTooltip(false);
    markTooltipAsSeen(TOOLTIP_KEYS.EXAMPLE_GENERATION);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // 오른쪽 화면 클릭 시 다음 페이지
    const clickX = e.clientX;
    const screenWidth = window.innerWidth;
    if (clickX > screenWidth * 0.67) {
      if (currentPage < 1) {
        onNext();
      } else {
        handleClose();
      }
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
          {/* 이미지 예문생성 툴팁 */}
          {tooltipPositions.imageUpload && (
            <div
              className="absolute"
              style={{
                top: `${tooltipPositions.imageUpload.top}px`,
                left: `${tooltipPositions.imageUpload.left}px`,
                transform: "translateX(-50%)",
              }}
            >
              <Tooltip
                title="이미지 예문생성"
                description="교재를 찍어서 바로 올릴 수도 있고, 갤러리에서 올릴 수도 있어요."
                position="top"
              />
            </div>
          )}

          {/* 채팅 예문생성 툴팁 */}
          {tooltipPositions.chat && (
            <div
              className="absolute"
              style={{
                top: `${tooltipPositions.chat.top}px`,
                left: `${tooltipPositions.chat.left}px`,
                transform: "translateX(-50%) translateY(-100%)",
              }}
            >
              <Tooltip
                title="채팅 예문생성"
                description="어색한 부분, 기억안나는 단어 등 모든 것을 물어볼 수 있어요."
                position="bottom"
              />
            </div>
          )}
        </>
      )}

      {/* 페이지 2/2 툴팁들 */}
      {currentPage === 1 && (
        <>
          {/* 스피커 툴팁 */}
          {tooltipPositions.speaker && (
            <div
              className="absolute"
              style={{
                top: `${tooltipPositions.speaker.top}px`,
                left: `${tooltipPositions.speaker.left}px`,
                transform: "translateX(-50%)",
              }}
            >
              <Tooltip
                title="스피커"
                description="예문을 직접 들어보고 발음을 따라해봐요."
                position="top"
              />
            </div>
          )}

          {/* 예문추가 툴팁 */}
          {tooltipPositions.addExample && (
            <div
              className="absolute"
              style={{
                top: `${tooltipPositions.addExample.top}px`,
                left: `${tooltipPositions.addExample.left}px`,
                transform: "translateX(-50%) translateY(-100%)",
              }}
            >
              <Tooltip
                title="예문추가"
                description="예문을 더 보고싶다면, 예문추가를 할 수 있어요."
                position="bottom"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

