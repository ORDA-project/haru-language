import React from "react";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  title: string;
  description: string;
  position?: TooltipPosition;
  onClose?: () => void;
  showCloseButton?: boolean;
  targetElementRef?: React.RefObject<HTMLElement>;
  className?: string;
  showUnderline?: boolean; // 제목 밑줄 표시 여부
  backgroundColor?: string; // 배경색 (기본값: 흰색)
}

export const Tooltip: React.FC<TooltipProps> = ({
  title,
  description,
  position = "bottom",
  onClose,
  showCloseButton = false,
  targetElementRef,
  className = "",
  showUnderline = true,
  backgroundColor = "white",
}) => {
  const getArrowStyle = () => {
    const baseStyle: React.CSSProperties = {
      position: "absolute",
      width: 0,
      height: 0,
      borderStyle: "solid",
    };

    const arrowColor = backgroundColor === "#00DAAA" ? "#00DAAA" : "white";
    
    switch (position) {
      case "top":
        return {
          ...baseStyle,
          bottom: "-10px",
          left: "50%",
          transform: "translateX(-50%)",
          borderWidth: "10px 10px 0 10px",
          borderColor: `${arrowColor} transparent transparent transparent`,
        };
      case "bottom":
        return {
          ...baseStyle,
          top: "-10px",
          left: "50%",
          transform: "translateX(-50%)",
          borderWidth: "0 10px 10px 10px",
          borderColor: `transparent transparent ${arrowColor} transparent`,
        };
      case "left":
        return {
          ...baseStyle,
          right: "-10px",
          top: "50%",
          transform: "translateY(-50%)",
          borderWidth: "10px 0 10px 10px",
          borderColor: `transparent transparent transparent ${arrowColor}`,
        };
      case "right":
        return {
          ...baseStyle,
          left: "-10px",
          top: "50%",
          transform: "translateY(-50%)",
          borderWidth: "10px 10px 10px 0",
          borderColor: `transparent ${arrowColor} transparent transparent`,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <div
      className={`absolute z-50 rounded-2xl shadow-lg p-4 min-w-[200px] max-w-[300px] ${className}`}
      style={{
        backgroundColor,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      }}
    >
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 4L4 12M4 4L12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
      <div
        style={getArrowStyle()}
      />
      <h3
        className="font-bold mb-2 text-gray-900"
        style={{
          fontSize: "16px",
          ...(showUnderline ? { borderBottom: "2px solid #00DAAA", paddingBottom: "4px" } : {}),
        }}
      >
        {title}
      </h3>
      <p
        className="text-gray-700 leading-relaxed"
        style={{
          fontSize: "14px",
          lineHeight: "1.5",
        }}
      >
        {description}
      </p>
    </div>
  );
};

