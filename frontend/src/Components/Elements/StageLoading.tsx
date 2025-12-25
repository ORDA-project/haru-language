import React from "react";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";

const StageLoading = () => {
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  
  // 큰글씨 모드에 따른 텍스트 크기
  const baseFontSize = isLargeTextMode ? 18 : 16;
  const largeFontSize = isLargeTextMode ? 22 : 20;
  const headerFontSize = isLargeTextMode ? 22 : 18;
  
  const baseTextStyle: React.CSSProperties = { fontSize: `${baseFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const largeTextStyle: React.CSSProperties = { fontSize: `${largeFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const headerTextStyle: React.CSSProperties = { fontSize: `${headerFontSize}px` };
  
  return (
  <div className="w-full flex-1 flex flex-col bg-[#F7F8FB]">
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
      <div className="text-center">
        <div className="w-16 h-16 bg-[#00DAAA] rounded-full flex items-center justify-center mb-6 mx-auto">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
        </div>
        <h2 className="font-semibold text-gray-800 mb-2" style={largeTextStyle}>
          예문을 만들고 있어요
        </h2>
        <p className="text-gray-600" style={baseTextStyle}>잠시 기다려주세요</p>
      </div>
    </div>
  </div>
  );
};

export default StageLoading;
