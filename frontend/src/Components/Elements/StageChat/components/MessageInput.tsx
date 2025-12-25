import React from "react";
import { Icons } from "../../Icons";

interface MessageInputProps {
  inputMessage: string;
  isLoading: boolean;
  isLargeTextMode: boolean;
  baseTextStyle: React.CSSProperties;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onImageClick: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  inputMessage,
  isLoading,
  isLargeTextMode,
  baseTextStyle,
  onInputChange,
  onSend,
  onKeyPress,
  onImageClick,
}) => {
  const inputHeight = isLargeTextMode ? "52px" : "48px";
  
  return (
    <div
      className="fixed left-0 right-0 bg-white border-t border-gray-200 z-40 max-w-[440px] mx-auto"
      style={{ 
        bottom: "72px",
        paddingBottom: isLargeTextMode ? "1rem" : "0.75rem"
      }}
    >
      <div className={`flex items-center gap-2 ${isLargeTextMode ? "px-5 py-3" : "px-4 py-2"}`}>
        <button
          onClick={onImageClick}
          className="rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
          style={{ width: inputHeight, height: inputHeight }}
          aria-label="이미지 업로드"
        >
          <Icons.camera
            className="w-5 h-5"
            stroke="gray"
            strokeOpacity="1"
          />
        </button>
        <div className="flex-1 relative">
          <textarea
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder="궁금한 것을 질문해보세요..."
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#00DAAA] focus:border-transparent bg-white"
            style={{
              ...baseTextStyle,
              minHeight: inputHeight,
              maxHeight: "120px",
            }}
            rows={1}
          />
        </div>
        <button
          onClick={onSend}
          disabled={!inputMessage.trim() || isLoading}
          className={`rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
            inputMessage.trim() && !isLoading
              ? "bg-[#00DAAA] hover:bg-[#00C495] cursor-pointer"
              : "bg-gray-300 cursor-not-allowed"
          }`}
          style={{ width: inputHeight, height: inputHeight }}
        >
          <svg
            width="20"
            height="20"
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

