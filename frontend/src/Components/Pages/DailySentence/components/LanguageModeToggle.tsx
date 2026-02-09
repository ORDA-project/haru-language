import React from "react";

type LanguageMode = "korean" | "english";

interface LanguageModeToggleProps {
  languageMode: LanguageMode;
  onModeChange: (mode: LanguageMode) => void;
  smallTextStyle: React.CSSProperties;
  languageModeRef?: React.RefObject<HTMLDivElement>;
}

export const LanguageModeToggle: React.FC<LanguageModeToggleProps> = ({
  languageMode,
  onModeChange,
  smallTextStyle,
  languageModeRef,
}) => {
  return (
    <div ref={languageModeRef} className="flex justify-center mt-4">
      <div className="bg-gray-100 rounded-full p-1 flex">
        <button
          onClick={() => onModeChange("korean")}
          className={`px-4 py-2 rounded-full font-medium transition-colors ${
            languageMode === "korean"
              ? "bg-white text-[#00DAAA] shadow-sm"
              : "text-gray-600"
          }`}
          style={smallTextStyle}
        >
          한국어 모드
        </button>
        <button
          onClick={() => onModeChange("english")}
          className={`px-4 py-2 rounded-full font-medium transition-colors ${
            languageMode === "english"
              ? "bg-white text-[#00DAAA] shadow-sm"
              : "text-gray-600"
          }`}
          style={smallTextStyle}
        >
          영어 모드
        </button>
      </div>
    </div>
  );
};

