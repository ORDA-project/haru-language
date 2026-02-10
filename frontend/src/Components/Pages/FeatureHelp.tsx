import React from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../Templates/Navbar";

// 이미지 import
import homeScreen1 from "../../Images/feature-help/툴팁_메인화면1.png";
import homeScreen2 from "../../Images/feature-help/툴팁_메인화면2.png";
import dailySentence1 from "../../Images/feature-help/툴팁_하루언어1.png";
import dailySentence2 from "../../Images/feature-help/툴팁_하루언어2.png";
import dailySentence3 from "../../Images/feature-help/툴팁_하루언어3.png";
import example1 from "../../Images/feature-help/툴팁_예문안내1.png";
import example2 from "../../Images/feature-help/툴팁_예문안내2.png";

type FeatureType = "home" | "daily-sentence" | "example-generation";

interface FeatureConfig {
  id: FeatureType;
  title: string;
  description: string;
  images: string[]; // 이미지 배열
}

const FeatureHelp = () => {
  const navigate = useNavigate();

  const features: FeatureConfig[] = [
    {
      id: "home",
      title: "홈 화면",
      description: "메인 화면의 주요 기능들을 확인해보세요!",
      images: [homeScreen1, homeScreen2],
    },
    {
      id: "daily-sentence",
      title: "한줄 영어",
      description: "언어 모드 전환 기능을 확인해보세요!",
      images: [dailySentence1, dailySentence2, dailySentence3],
    },
    {
      id: "example-generation",
      title: "예문",
      description: "예문 생성 기능을 확인해보세요!",
      images: [example1, example2],
    },
  ];

  return (
    <div className="w-full h-full flex flex-col items-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#F7F8FB]">
      <div className="w-full bg-white px-4 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/mypage")}
            className="p-2 text-gray-800"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
        <div className="space-y-6">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
            >
              <div className="mb-4">
                <h3 className="font-bold text-gray-900 text-lg mb-1">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>

              {/* 이미지들을 차례대로 표시 */}
              <div className="space-y-4">
                {feature.images.map((image, index) => (
                  <div key={index}>
                    <div
                      className="relative w-full overflow-hidden rounded-2xl"
                    >
                      <img
                        src={image}
                        alt={`${feature.title} ${index + 1}`}
                        className="w-full h-auto object-contain"
                        style={{ borderRadius: "16px" }}
                      />
                    </div>
                    {/* 이미지 사이 구분선 (마지막 이미지가 아닐 때만) */}
                    {index < feature.images.length - 1 && (
                      <div className="w-full h-px bg-gray-200 my-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <NavBar currentPage="Profile" />
    </div>
  );
};

export default FeatureHelp;
