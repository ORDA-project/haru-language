import React from "react";

interface DeleteModeToggleProps {
  isDeleteMode: boolean;
  onToggle: () => void;
  textStyle: React.CSSProperties;
}

export const DeleteModeToggle: React.FC<DeleteModeToggleProps> = ({
  isDeleteMode,
  onToggle,
  textStyle,
}) => {
  return (
    <button
      onClick={onToggle}
      className={`px-5 py-2.5 rounded-lg text-base font-semibold transition-colors flex items-center gap-2 shadow-md ${
        isDeleteMode
          ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white'
          : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300'
      }`}
      style={textStyle}
    >
      {isDeleteMode ? (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          취소
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          삭제
        </>
      )}
    </button>
  );
};

