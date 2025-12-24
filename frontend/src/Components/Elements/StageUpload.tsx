import React, { useState } from "react";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";
import ImageUploadModal from "./ImageUploadModal";

interface StageUploadProps {
  handleFileUpload: (file: File) => void;
  handleAIChat: () => void;
  hasSavedExample?: boolean;
  hasSavedChat?: boolean;
  onRestoreExample?: () => void;
}

const StageUpload = ({ handleFileUpload, handleAIChat, hasSavedExample = false, hasSavedChat = false, onRestoreExample }: StageUploadProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  
  // 큰글씨 모드에 따른 텍스트 크기 (중년층용)
  const baseFontSize = isLargeTextMode ? 18 : 16;
  const largeFontSize = isLargeTextMode ? 22 : 20;
  const smallFontSize = isLargeTextMode ? 16 : 14;
  const headerFontSize = isLargeTextMode ? 22 : 18;
  
  const baseTextStyle: React.CSSProperties = { fontSize: `${baseFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const largeTextStyle: React.CSSProperties = { fontSize: `${largeFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const smallTextStyle: React.CSSProperties = { fontSize: `${smallFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const headerTextStyle: React.CSSProperties = { fontSize: `${headerFontSize}px` };

  const handleImageSelect = (file: File) => {
    handleFileUpload(file);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F7F8FB]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="w-8"></div>
        <div className="text-center">
          <h1 className="font-semibold text-gray-800" style={headerTextStyle}>예문 생성</h1>
        </div>
        <div className="w-8"></div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4">
          {/* 이미지 업로드 옵션 */}
          <button
            onClick={() => {
              if (hasSavedExample && onRestoreExample) {
                onRestoreExample();
              } else {
                setIsModalOpen(true);
              }
            }}
            className="w-full flex flex-col items-center bg-white py-12 px-6 border-2 border-dashed border-[#00DAAA] rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
          >
            <div className="w-16 h-16 bg-[#00DAAA] rounded-full flex items-center justify-center mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="14,2 14,8 20,8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="16"
                  y1="13"
                  x2="8"
                  y2="13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="16"
                  y1="17"
                  x2="8"
                  y2="17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="10,9 9,9 8,9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="font-medium text-gray-800 mb-2" style={largeTextStyle}>
              {hasSavedExample ? "예문 생성 이어서 보기" : "교재의 사진을 올려주세요"}
            </p>
            <p className="text-gray-500 text-center" style={smallTextStyle}>
              {hasSavedExample 
                ? "저장된 예문을 확인하거나 새로운 사진을 업로드하세요"
                : "이미지를 업로드하면 AI가 학습 예문을 생성해드립니다"}
            </p>
          </button>

          {/* 구분선 */}
          <div className="flex items-center">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-4 text-gray-500" style={smallTextStyle}>또는</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* AI 대화 옵션 */}
          <button
            onClick={handleAIChat}
            className="w-full flex flex-col items-center bg-white py-12 px-6 border-2 border-solid border-[#00DAAA] rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
          >
            <div className="w-16 h-16 bg-[#00DAAA] rounded-full flex items-center justify-center mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white"
              >
                <path
                  d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="font-medium text-gray-800 mb-2" style={largeTextStyle}>
              {hasSavedChat ? "AI 대화 이어서 보기" : "AI 대화로 공부하기"}
            </p>
            <p className="text-gray-500 text-center" style={smallTextStyle}>
              {hasSavedChat
                ? "저장된 대화를 확인하거나 새로운 대화를 시작하세요"
                : "AI와 대화하며 영어를 학습해보세요"}
            </p>
          </button>
        </div>
      </div>

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImageSelect={handleImageSelect}
        title="교재 사진 선택"
      />
    </div>
  );
};

export default StageUpload;
