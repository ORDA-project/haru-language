import React from "react";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";

interface PopupProps {
  quote: string;
  translation: string;
  source: string;
  onClose: () => void;
}

const QuoteRecommend = ({
  quote,
  translation,
  source,
  onClose,
}: PopupProps) => {
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  
  const baseFontSize = isLargeTextMode ? 18 : 16;
  const largeFontSize = isLargeTextMode ? 22 : 20;
  const xLargeFontSize = isLargeTextMode ? 28 : 28;
  const smallFontSize = isLargeTextMode ? 16 : 14;
  const headerFontSize = isLargeTextMode ? 22 : 18;
  
  const baseTextStyle: React.CSSProperties = { fontSize: `${baseFontSize}px` };
  const largeTextStyle: React.CSSProperties = { fontSize: `${largeFontSize}px` };
  const xLargeTextStyle: React.CSSProperties = { fontSize: `${xLargeFontSize}px` };
  const smallTextStyle: React.CSSProperties = { fontSize: `${smallFontSize}px` };
  const headerTextStyle: React.CSSProperties = { fontSize: `${headerFontSize}px` };
  
  return (
    <div className="fixed top-0 left-0 w-full h-screen bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gradient-to-b from-[#fdf7e8] to-[#ffe5e5] rounded-[15px] p-[20px] text-center w-[300px] max-w-[90%] relative">
        <button className="absolute top-[10px] right-[10px] bg-none border-none cursor-pointer" style={headerTextStyle} onClick={onClose}>✖</button>
        <div className="mb-[10px]" style={xLargeTextStyle}>🔊</div>
        <p className="font-bold mb-[10px]" style={largeTextStyle}>{quote}</p>
        <p className="mb-[10px]" style={baseTextStyle}>{translation}</p>
        <p className="text-gray-500 mb-[20px]" style={smallTextStyle}>{source}</p>
        <button className="bg-[#f5a623] border-none text-white p-[10px_20px] rounded-[5px] cursor-pointer" style={baseTextStyle}>다운로드</button>
      </div>
    </div>
  );
};

export default QuoteRecommend;

