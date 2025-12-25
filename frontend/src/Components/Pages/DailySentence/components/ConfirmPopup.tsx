import React from "react";

type LanguageMode = "korean" | "english";

interface ConfirmPopupProps {
  show: boolean;
  languageMode: LanguageMode;
  onConfirm: () => void;
  onCancel: () => void;
  onNo: () => void;
}

export const ConfirmPopup: React.FC<ConfirmPopupProps> = ({
  show,
  languageMode,
  onConfirm,
  onCancel,
  onNo,
}) => {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-white bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white shadow-2xl"
        style={{ width: "324px", height: "180px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-[110px] border-b border-gray-200 flex flex-col items-center justify-center px-4">
          {languageMode === "korean" ? (
            <>
              <p className="text-[18px] font-bold text-gray-900 text-center leading-tight">
                한국어로 입력하신것이 맞나요?
              </p>
              <p className="text-[18px] font-bold text-gray-600 text-center leading-tight mt-2">
                영어로 번역해드릴게요
              </p>
            </>
          ) : (
            <>
              <p className="text-[18px] font-bold text-gray-900 text-center leading-tight">
                영어로 입력하셨나요?
              </p>
              <p className="text-[18px] font-bold text-gray-600 text-center leading-tight mt-2">
                어법과 문맥을 체크해드릴게요.
              </p>
            </>
          )}
        </div>
        <div className="flex h-[70px]">
          <button
            onClick={onNo}
            className="w-[162px] h-[70px] bg-white border-r border-gray-200 text-gray-800 font-bold hover:bg-gray-50 transition-colors flex items-center justify-center"
            style={{ fontSize: "18px" }}
          >
            <div className="text-center leading-tight">
              <div>아니요.</div>
              <div>
                {languageMode === "korean" ? "영어입력했어요" : "한국어입력했어요"}
              </div>
            </div>
          </button>
          <button
            onClick={onConfirm}
            className="w-[162px] h-[70px] bg-[#00E8B6] text-gray-800 font-bold hover:bg-[#00DAAA] transition-colors flex items-center justify-center"
            style={{ fontSize: "18px" }}
          >
            네
          </button>
        </div>
      </div>
    </div>
  );
};

