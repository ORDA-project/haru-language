import React from "react";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../../../store/dataStore";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  isLoading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "삭제 확인",
  message,
  isLoading = false,
}) => {
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  
  const baseFontSize = isLargeTextMode ? 18 : 16;
  const smallFontSize = isLargeTextMode ? 16 : 14;
  const headerFontSize = isLargeTextMode ? 22 : 20;
  
  const baseTextStyle: React.CSSProperties = { fontSize: `${baseFontSize}px` };
  const smallTextStyle: React.CSSProperties = { fontSize: `${smallFontSize}px` };
  const headerTextStyle: React.CSSProperties = { fontSize: `${headerFontSize}px` };
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl p-6 w-full max-w-sm mx-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="font-bold text-gray-800 mb-3" style={headerTextStyle}>
            {title}
          </h2>
          <p className="text-gray-600" style={smallTextStyle}>
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors"
            style={baseTextStyle}
          >
            아니요
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 active:bg-red-700 disabled:bg-red-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
            style={baseTextStyle}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                삭제 중...
              </>
            ) : (
              "네"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

