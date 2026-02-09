import React, { useEffect, useState } from "react";
import { Tooltip } from "./Tooltip";

interface TooltipStep {
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
  targetSelector?: string;
  targetRef?: React.RefObject<HTMLElement>;
  offset?: { x: number; y: number };
}

interface TooltipOverlayProps {
  steps: TooltipStep[];
  currentStep: number;
  onNext: () => void;
  onPrev?: () => void;
  onClose: () => void;
  showPageIndicator?: boolean;
  totalPages?: number;
  allowRightClick?: boolean;
  allowCloseOnClick?: boolean;
}

export const TooltipOverlay: React.FC<TooltipOverlayProps> = ({
  steps,
  currentStep,
  onNext,
  onPrev,
  onClose,
  showPageIndicator = false,
  totalPages,
  allowRightClick = false,
  allowCloseOnClick = false,
}) => {
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [currentTooltip, setCurrentTooltip] = useState<TooltipStep | null>(
    null
  );

  useEffect(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const step = steps[currentStep];
      setCurrentTooltip(step);
      updateTooltipPosition(step);
    }
  }, [currentStep, steps]);

  const updateTooltipPosition = (step: TooltipStep) => {
    let element: HTMLElement | null = null;

    if (step.targetRef?.current) {
      element = step.targetRef.current;
    } else if (step.targetSelector) {
      element = document.querySelector(step.targetSelector) as HTMLElement;
    }

    if (element) {
      const rect = element.getBoundingClientRect();
      const offset = step.offset || { x: 0, y: 0 };

      let top = 0;
      let left = 0;

      switch (step.position) {
        case "top":
          top = rect.top - 20;
          left = rect.left + rect.width / 2;
          break;
        case "bottom":
          top = rect.bottom + 20;
          left = rect.left + rect.width / 2;
          break;
        case "left":
          top = rect.top + rect.height / 2;
          left = rect.left - 20;
          break;
        case "right":
          top = rect.top + rect.height / 2;
          left = rect.right + 20;
          break;
      }

      setTooltipPosition({
        top: top + offset.y,
        left: left + offset.x,
      });
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (allowCloseOnClick && e.target === e.currentTarget) {
      onClose();
    } else if (allowRightClick && e.target === e.currentTarget) {
      onNext();
    }
  };

  if (!currentTooltip || !tooltipPosition) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-30"
      onClick={handleOverlayClick}
      style={{ touchAction: "none" }}
    >
      {showPageIndicator && totalPages && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-white rounded-full px-4 py-2 shadow-md">
            <span className="text-gray-700 font-medium">
              {currentStep + 1}/{totalPages}
            </span>
          </div>
        </div>
      )}

      <div
        className="absolute"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform:
            currentTooltip.position === "top" || currentTooltip.position === "bottom"
              ? "translateX(-50%)"
              : currentTooltip.position === "left" || currentTooltip.position === "right"
              ? "translateY(-50%)"
              : "none",
        }}
      >
        <Tooltip
          title={currentTooltip.title}
          description={currentTooltip.description}
          position={currentTooltip.position}
          showCloseButton={currentStep === steps.length - 1}
          onClose={onClose}
        />
      </div>

      {/* 오른쪽 화면 클릭 영역 */}
      {allowRightClick && (
        <div
          className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
          onClick={onNext}
        />
      )}
    </div>
  );
};

