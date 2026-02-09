import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../Templates/Navbar";
import { Tooltip } from "../Elements/Tooltip";

type FeatureType = "home" | "daily-sentence" | "example-generation";

const FeatureHelp = () => {
  const navigate = useNavigate();
  const [selectedFeature, setSelectedFeature] = useState<FeatureType | null>(null);

  const features = {
    home: {
      title: "홈 화면",
      description: "메인 화면의 주요 기능들을 확인해보세요.",
      exampleTooltip: {
        title: "오늘의 한줄 영어",
        description: "매일매일 새로운 주제가 주어집니다.\n영어, 한국어로 자유롭게 대답해보세요!\n한국어는 자연스런 영어로 번역해드려요",
        position: "bottom" as const,
      },
    },
    "daily-sentence": {
      title: "한줄 영어",
      description: "언어 모드 전환 기능을 확인해보세요.",
      exampleTooltip: {
        title: "언어모드 전환",
        description: "모드를 클릭하고, 자유롭게 대답해보세요!\n한국어는 자연스런 영어로 번역해드려요",
        position: "bottom" as const,
      },
    },
    "example-generation": {
      title: "예문",
      description: "예문 생성 기능을 확인해보세요.",
      exampleTooltip: {
        title: "스피커",
        description: "예문을 직접 들어보고 발음을 따라해봐요.",
        position: "bottom" as const,
      },
    },
  };

  return (
    <div className="w-full h-full flex flex-col items-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#F7F8FB]">
      <div className="w-full bg-white px-4 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/mypage")}
            className="p-2 text-gray-800"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="font-bold text-gray-800 text-lg">기능별 도움말</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="flex-1 w-full px-4 py-6 overflow-y-auto pb-24">
        <div className="space-y-4">
          {Object.entries(features).map(([key, feature]) => (
            <div
              key={key}
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedFeature(selectedFeature === key ? null : (key as FeatureType))}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`transform transition-transform ${
                    selectedFeature === key ? "rotate-180" : ""
                  }`}
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {selectedFeature === key && feature.exampleTooltip && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {/* 예시 이미지 영역 */}
                  <div className="relative bg-gray-200 rounded-lg overflow-hidden" style={{ height: "300px", minHeight: "300px" }}>
                    {/* 툴팁 오버레이 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div 
                        className="relative"
                        style={{
                          top: key === "home" ? "-80px" : key === "daily-sentence" ? "-100px" : "-60px",
                        }}
                      >
                        <Tooltip
                          title={feature.exampleTooltip.title}
                          description={feature.exampleTooltip.description}
                          position={feature.exampleTooltip.position}
                          showUnderline={true}
                          customWidth={243}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <NavBar currentPage="Profile" />
    </div>
  );
};

export default FeatureHelp;

