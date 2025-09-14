import React, { useState } from "react";
import ImageUploadModal from "./ImageUploadModal";

interface StageUploadProps {
  handleFileUpload: (file: File) => void;
  handleAIChat: () => void;
}

const StageUpload = ({ handleFileUpload, handleAIChat }: StageUploadProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImageSelect = (file: File) => {
    handleFileUpload(file);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F7F8FB]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="w-8"></div>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-800">예문 생성</h1>
        </div>
        <div className="w-8"></div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4">
          {/* 이미지 업로드 옵션 */}
          <button
            onClick={() => setIsModalOpen(true)}
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
            <p className="text-lg font-medium text-gray-800 mb-2">
              교재의 사진을 올려주세요
            </p>
            <p className="text-sm text-gray-500 text-center">
              이미지를 업로드하면 AI가 학습 예문을 생성해드립니다
            </p>
          </button>

          {/* 구분선 */}
          <div className="flex items-center">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">또는</span>
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
            <p className="text-lg font-medium text-gray-800 mb-2">
              AI 대화로 공부하기
            </p>
            <p className="text-sm text-gray-500 text-center">
              AI와 대화하며 영어를 학습해보세요
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
