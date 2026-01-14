import React from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";
import { createTextStyles } from "../../utils/styleUtils";
import NavBar from "../Templates/Navbar";

export default function Announcements() {
  const navigate = useNavigate();
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  
  const textStyles = createTextStyles(isLargeTextMode);
  const baseTextStyle = textStyles.base;
  const smallTextStyle = textStyles.small;
  const headerTextStyle = textStyles.header;

  return (
    <div className="w-full h-[calc(100vh-72px)] flex flex-col max-w-[440px] mx-auto bg-gray-50 shadow-[0_0_10px_0_rgba(0,0,0,0.1)]">
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="text-center">
          <h1 className="font-semibold text-gray-800" style={headerTextStyle}>공지사항</h1>
        </div>
        <div className="w-8"></div>
      </div>

      {/* 공지사항 내용 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-[72px]">
        <div className="text-center">
          {/* 빈 상태 이미지 */}
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
              />
            </svg>
          </div>

          {/* 빈 상태 메시지 */}
          <h2 className="font-semibold text-gray-800 mb-2" style={headerTextStyle}>
            아직 내용이 없어요
          </h2>
          <p className="text-gray-500 leading-relaxed" style={smallTextStyle}>
            새로운 공지사항이 올라오면
            <br />
            여기에 표시됩니다
          </p>
        </div>
      </div>

      {/* Navbar */}
      <NavBar currentPage="MyPage" />
    </div>
  );
}
