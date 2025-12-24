import React from "react";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  friendName?: string;
  selectedCount?: number;
  isLoading?: boolean;
}

const DeleteConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  friendName,
  selectedCount = 1,
  isLoading = false,
}: DeleteConfirmDialogProps) => {
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  
  const baseFontSize = isLargeTextMode ? 18 : 16;
  const smallFontSize = isLargeTextMode ? 16 : 14;
  const headerFontSize = isLargeTextMode ? 22 : 20;
  const xSmallFontSize = isLargeTextMode ? 14 : 12;
  
  const baseTextStyle: React.CSSProperties = { fontSize: `${baseFontSize}px` };
  const smallTextStyle: React.CSSProperties = { fontSize: `${smallFontSize}px` };
  const headerTextStyle: React.CSSProperties = { fontSize: `${headerFontSize}px` };
  const xSmallTextStyle: React.CSSProperties = { fontSize: `${xSmallFontSize}px` };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-auto shadow-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="font-bold text-gray-800 mb-2" style={headerTextStyle}>친구 삭제</h2>
          <p className="text-gray-600" style={smallTextStyle}>
            {selectedCount === 1 && friendName
              ? `${friendName}님을 친구 목록에서 삭제하시겠습니까?`
              : `선택한 ${selectedCount}명의 친구를 삭제하시겠습니까?`}
          </p>
          <p className="text-red-500 mt-2" style={xSmallTextStyle}>
            삭제된 친구는 복구할 수 없습니다.
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
            취소
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
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                삭제
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmDialog;



