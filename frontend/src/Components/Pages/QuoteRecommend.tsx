import React from "react";

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
  return (
    <div className="fixed top-0 left-0 w-full h-screen bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gradient-to-b from-[#fdf7e8] to-[#ffe5e5] rounded-[15px] p-[20px] text-center w-[300px] max-w-[90%] relative">
        <button className="absolute top-[10px] right-[10px] bg-none border-none text-[20px] cursor-pointer" onClick={onClose}>✖</button>
        <div className="text-[30px] mb-[10px]">🔊</div>
        <p className="text-[18px] font-bold mb-[10px]">{quote}</p>
        <p className="text-[16px] mb-[10px]">{translation}</p>
        <p className="text-[14px] text-gray-500 mb-[20px]">{source}</p>
        <button className="bg-[#f5a623] border-none text-white p-[10px_20px] rounded-[5px] cursor-pointer">다운로드</button>
      </div>
    </div>
  );
};

export default QuoteRecommend;

