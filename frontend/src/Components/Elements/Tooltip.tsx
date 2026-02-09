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
  borderColor?: string; // 테두리 색상
  textAlign?: "left" | "center" | "right"; // 텍스트 정렬
  customWidth?: number; // 커스텀 너비
  customHeight?: number; // 커스텀 높이
  customPadding?: { top: number; right: number; bottom: number; left: number }; // 커스텀 패딩
  titleGap?: number; // 제목과 설명 사이 간격
  titleColor?: string; // 제목 색상
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
  borderColor,
  textAlign = "left",
  customWidth,
  customHeight,
  customPadding,
  titleGap = 16,
  titleColor = "#1E2124",
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

  const padding = customPadding 
    ? `${customPadding.top}px ${customPadding.right}px ${customPadding.bottom}px ${customPadding.left}px`
    : "16px";

  return (
    <div
      className={`absolute z-50 shadow-lg ${className}`}
      style={{
        backgroundColor,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        padding,
        width: customWidth ? `${customWidth}px` : "243px",
        height: customHeight ? `${customHeight}px` : "auto",
        maxWidth: "calc(100vw - 40px)", // 모바일 화면에 맞게 조정 (양쪽 20px 여백)
        borderRadius: borderColor ? "24px" : "16px", // xlarge2는 보통 24px
        border: borderColor ? `1px solid ${borderColor}` : "none",
      }}
    >
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          style={{ zIndex: 10 }}
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
        style={{
          fontFamily: "'KoPubWorldDotum_Pro', 'KoPub Dotum', sans-serif",
          fontWeight: 700,
          fontSize: "16px", // heading/xsmall
          lineHeight: "110%",
          letterSpacing: "0",
          color: titleColor,
          marginTop: "0",
          marginBottom: `${titleGap}px`, // 제목과 설명 사이 gap
          textAlign,
          ...(showUnderline ? { 
            borderBottom: "5px solid #00DAAA", // 5px로 변경
            paddingBottom: "10px", // gap: 10px (밑줄과 텍스트 사이)
            marginBottom: `${titleGap}px`, // 밑줄 포함 간격
          } : {}),
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: "'KoPubWorldDotum_Pro', 'KoPub Dotum', sans-serif",
          fontWeight: 300,
          fontSize: "14px", // body/small
          lineHeight: "150%",
          letterSpacing: "0",
          color: "#1E2124",
          margin: "0",
          textAlign,
          wordBreak: "keep-all",
          overflowWrap: "break-word",
          whiteSpace: "pre-line", // 줄바꿈 유지
        }}
      >
        {description}
      </p>
    </div>
  );
};

