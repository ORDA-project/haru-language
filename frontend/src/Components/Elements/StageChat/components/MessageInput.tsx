import React from "react";
import { Icons } from "../../Icons";

interface MessageInputProps {
  inputMessage: string;
  isLoading: boolean;
  isLargeTextMode: boolean;
  baseTextStyle: React.CSSProperties;
  croppedImage: string | null;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onImageClick: () => void;
  onRemoveImage: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  inputMessage,
  isLoading,
  isLargeTextMode,
  baseTextStyle,
  croppedImage,
  onInputChange,
  onSend,
  onKeyPress,
  onImageClick,
  onRemoveImage,
}) => {
  const inputFontSize = isLargeTextMode ? "16px" : "12px";
  const lineHeight = 1.4;
  const calculatedInputHeight = isLargeTextMode ? "44px" : "40px";
  const inputHeight = calculatedInputHeight;
  const buttonSize = inputHeight;
  
  return (
    <div
      className="fixed left-0 right-0 bg-white border-t border-gray-200 z-40 max-w-[440px] mx-auto"
      style={{ 
        bottom: "72px",
        paddingBottom: isLargeTextMode ? "0.125rem" : "0.09375rem"
      }}
    >
      <div className={`flex items-center gap-2 ${isLargeTextMode ? "px-4 py-1.5" : "px-3 py-1"}`}>
        <button
          onClick={onImageClick}
          className="rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
          style={{ width: buttonSize, height: buttonSize }}
          aria-label="이미지 업로드"
        >
          <Icons.camera
            className={isLargeTextMode ? "w-4 h-4" : "w-3.5 h-3.5"}
            stroke="gray"
            strokeOpacity="1"
          />
        </button>
        <div className="flex-1 relative">
          {/* 이미지 미리보기 */}
          {croppedImage && (
            <div className="mb-2 relative">
              <div className="relative inline-block">
                <img
                  src={croppedImage}
                  alt="업로드된 이미지"
                  className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                />
                <button
                  onClick={onRemoveImage}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                  aria-label="이미지 제거"
                  style={{ fontSize: '14px', lineHeight: '1', fontWeight: '600' }}
                >
                  ×
                </button>
              </div>
            </div>
          )}
          <textarea
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder={croppedImage ? "이미지에 대한 질문을 입력하세요..." : "궁금한 것을 질문해보세요!"}
            className="w-full px-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#00DAAA] focus:border-transparent bg-white"
            style={{
              ...baseTextStyle,
              fontSize: inputFontSize,
              minHeight: inputHeight,
              maxHeight: "120px",
              lineHeight: lineHeight,
              paddingTop: `calc((${inputHeight} - ${inputFontSize} * ${lineHeight}) / 2)`,
              paddingBottom: `calc((${inputHeight} - ${inputFontSize} * ${lineHeight}) / 2)`,
            }}
            rows={1}
          />
        </div>
        <button
          onClick={onSend}
          disabled={(!inputMessage.trim() && !croppedImage) || isLoading}
          className={`rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
            (inputMessage.trim() || croppedImage) && !isLoading
              ? "bg-[#00DAAA] hover:bg-[#00C495] cursor-pointer"
              : "bg-gray-300 cursor-not-allowed"
          }`}
          style={{ width: buttonSize, height: buttonSize }}
        >
          <svg
            width={isLargeTextMode ? "18" : "16"}
            height={isLargeTextMode ? "18" : "16"}
            viewBox="0 0 24 24"
            fill="none"
            className="text-white"
          >
            <path
              d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

