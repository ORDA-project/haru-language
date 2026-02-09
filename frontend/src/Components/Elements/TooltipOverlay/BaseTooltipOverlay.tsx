import React, { useState, useEffect, useCallback } from "react";
import { Tooltip } from "../Tooltip";
import { TOOLTIP_CONSTANTS, TOOLTIP_STYLES } from "./constants";

export interface TooltipConfig {
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
  ref?: React.RefObject<HTMLElement | null>;
  offset?: { x: number; y: number };
  transform?: string;
}

interface BaseTooltipOverlayProps {
  tooltips: TooltipConfig[][]; // 페이지별 툴팁 배열
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onClose: () => void;
  showTooltip: boolean;
}

export const BaseTooltipOverlay: React.FC<BaseTooltipOverlayProps> = ({
  tooltips,
  currentPage,
  totalPages,
  onNext,
  onClose,
  showTooltip,
}) => {
  const [tooltipPositions, setTooltipPositions] = useState<{
    [key: string]: { top: number; left: number; transform?: string };
  }>({});

  const updateTooltipPositions = useCallback(() => {
    const positions: { [key: string]: { top: number; left: number; transform?: string } } = {};
    const currentTooltips = tooltips[currentPage] || [];

    currentTooltips.forEach((tooltip, index) => {
      if (tooltip.ref?.current) {
        const rect = tooltip.ref.current.getBoundingClientRect();
        const offset = tooltip.offset || { x: 0, y: 0 };
        
        let top = 0;
        let left = 0;

        switch (tooltip.position) {
          case "top":
            top = rect.top - TOOLTIP_CONSTANTS.TOOLTIP_OFFSET;
            left = rect.left + rect.width / 2;
            break;
          case "bottom":
            top = rect.bottom + TOOLTIP_CONSTANTS.TOOLTIP_OFFSET;
            left = rect.left + rect.width / 2;
            break;
          case "left":
            top = rect.top + rect.height / 2;
            left = rect.left - TOOLTIP_CONSTANTS.TOOLTIP_OFFSET;
            break;
          case "right":
            top = rect.top + rect.height / 2;
            left = rect.right + TOOLTIP_CONSTANTS.TOOLTIP_OFFSET;
            break;
        }

        positions[`tooltip-${index}`] = {
          top: top + offset.y,
          left: left + offset.x,
          transform: tooltip.transform,
        };
      }
    });

    setTooltipPositions(positions);
  }, [tooltips, currentPage]);

  useEffect(() => {
    if (showTooltip) {
      updateTooltipPositions();
      const handleResize = () => updateTooltipPositions();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [showTooltip, currentPage, updateTooltipPositions]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    // 오른쪽 화면 클릭 시 다음 페이지
    const clickX = e.clientX;
    const screenWidth = window.innerWidth;
    if (clickX > screenWidth * TOOLTIP_CONSTANTS.RIGHT_CLICK_THRESHOLD) {
      if (currentPage < totalPages - 1) {
        onNext();
      } else {
        onClose();
      }
    }
  };

  if (!showTooltip) return null;

  const currentTooltips = tooltips[currentPage] || [];

  return (
    <div
      className={TOOLTIP_STYLES.OVERLAY}
      onClick={handleOverlayClick}
      style={{ touchAction: "none" }}
    >
      {/* 페이지 인디케이터 */}
      <div className={TOOLTIP_STYLES.INDICATOR}>
        <div className="bg-white rounded-full px-4 py-2 shadow-md">
          <span className="text-gray-700 font-medium">
            {currentPage + 1}/{totalPages}
          </span>
        </div>
      </div>

      {/* 닫기 버튼 (마지막 페이지에서만) */}
      {currentPage === totalPages - 1 && (
        <button
          onClick={onClose}
          className={TOOLTIP_STYLES.CLOSE_BUTTON}
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
      )}

      {/* 현재 페이지의 툴팁들 */}
      {currentTooltips.map((tooltip, index) => {
        const position = tooltipPositions[`tooltip-${index}`];
        if (!position) return null;

        return (
          <div
            key={index}
            className="absolute"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              transform: position.transform || "translateX(-50%)",
            }}
          >
            <Tooltip
              title={tooltip.title}
              description={tooltip.description}
              position={tooltip.position}
              showCloseButton={currentPage === totalPages - 1 && index === currentTooltips.length - 1}
              onClose={onClose}
            />
          </div>
        );
      })}
    </div>
  );
};

