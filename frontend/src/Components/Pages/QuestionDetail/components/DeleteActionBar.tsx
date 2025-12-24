import React from "react";

interface DeleteActionBarProps {
  selectedCount: number;
  onCancel: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  deleteMessage: string;
  baseTextStyle: React.CSSProperties;
  smallTextStyle: React.CSSProperties;
}

export const DeleteActionBar: React.FC<DeleteActionBarProps> = ({
  selectedCount,
  onCancel,
  onDelete,
  isDeleting,
  deleteMessage,
  baseTextStyle,
  smallTextStyle,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 max-w-[440px] mx-auto">
      <div className="flex items-center justify-between px-4 py-3">
        <span style={baseTextStyle} className="text-gray-700 font-medium">
          {selectedCount}개 선택됨
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            style={smallTextStyle}
          >
            취소
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
            style={smallTextStyle}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};

