import React, { useState, useEffect } from "react";
import rightarrow from "../../Images/rightarrow.png";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { userAtom, isLoggedInAtom, checkUserOnboardingAtom } from "../../store/authStore";
import Image1 from "/intro1.png";
import Image2 from "/intro2.gif";
import Image3 from "/intro3.gif";
import Image4 from "/intro4.gif";
import Image5 from "/intro5.png";

interface Page {
  title: string;
  description: string;
  color: string;
  imageUrl: string; // 이미지 URL 추가
  buttonText?: string; // 마지막 페이지에서만 사용
}

const pages: Page[] = [
  {
    title: "교재에 없는 다양한 예문과\n정확한 발음으로\n언어 배우기",
    description: "",
    color: "#00DAAA",
    imageUrl: Image1,
  },
  {
    title: "예문생성",
    description:
      "버튼을 누르고 교재를 찍어보세요. 사진내용을 드래그하면 그것을 바탕으로 예문이 생성돼요.",
    color: "#00DAAA",
    imageUrl: Image2,
  },
  {
    title: "질문채팅",
    description: "질문 버튼을 누르고 AI에게 원하는 것을 물어보세요.",
    color: "#00DAAA",
    imageUrl: Image3,
  },
  {
    title: "기록과 점검",
    description:
      "나의 예문생성 기록을 다시 보고, 들을 수 있어요. 그에 대해서 쌓인 기록을 바탕으로 테스트도 할 수 있어요.",
    color: "#00DAAA",
    imageUrl: Image4,
  },
  {
    title: "하루 언어",
    description:
      "일주일의 하루씩, 언어를 공부하는 시간을 가져세요.\n하루 언어가 교재내용을 바탕으로 다양한 예문과 정확한 발음을 알려드릴게요!",
    color: "#00DAAA",
    imageUrl: Image5,
    buttonText: "하루 언어 시작하기",
  },
];

const Introduction: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [user] = useAtom(userAtom);
  const [isLoggedIn] = useAtom(isLoggedInAtom);
  const [, checkOnboarding] = useAtom(checkUserOnboardingAtom);
  const navigate = useNavigate();

  const handleNext = (): void => {
    if (currentPage < pages.length - 1) {
      setCurrentPage((prev) => prev + 1);
    } else {
      console.log("마지막 페이지: 하루 언어 시작하기 버튼 클릭");
      handleStartApp();
    }
  };

  const handleStartApp = async (): Promise<void> => {
    console.log("하루 언어 시작하기 버튼 클릭");
    
    // 로그인되지 않은 경우 홈으로 이동
    if (!isLoggedIn || !user) {
      navigate("/home");
      return;
    }

    try {
      // 온보딩 상태 확인
      const isOnboarded = await checkOnboarding();
      
      if (isOnboarded) {
        // 이미 온보딩 완료된 사용자는 홈으로
        navigate("/home");
      } else {
        // 최초 로그인 사용자는 프로필 설정 페이지로
        navigate("/mypage/edit");
      }
    } catch (error) {
      console.error("Onboarding check failed:", error);
      // 오류 발생 시 홈으로 이동
      navigate("/home");
    }
  };

  const handlePrev = (): void => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    } else {
      console.log("첫 번째 페이지입니다.");
    }
  };

  const handleClose = (): void => {
    console.log("닫기 버튼 클릭");
    navigate("/");
  };

  return (
    <div className="w-full h-screen flex flex-col items-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#ecfffb] relative">
      {/* 메인 컨텐츠 영역 */}
      <div className="h-full p-0 px-3 w-full max-w-[440px] box-border mx-auto flex flex-col justify-center items-center relative md:max-w-[440px]">
        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 w-10 h-10 bg-transparent border-none text-3xl text-gray-800 cursor-pointer transition-colors duration-300 hover:text-[#00daaa] z-10"
        >
          ×
        </button>

        {/* 페이지 인디케이터 */}
        <div className="flex gap-2.5 absolute top-[6%]">
          {pages.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                index === currentPage ? "bg-[#00DAAA]" : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* 페이지 콘텐츠 */}
        <div className="flex flex-col items-center gap-4 w-full mb-[4.5rem]">
          {currentPage === pages.length - 1 ? (
            // 5번째 페이지: 이미지 → 제목 → 설명 순서
            <>
              <div
                className="w-full max-w-[400px] h-[500px] flex items-center justify-center text-base text-white font-bold rounded-xl"
                style={{ backgroundColor: pages[currentPage].color }}
              >
                <img
                  src={pages[currentPage].imageUrl}
                  alt="페이지 이미지"
                  className="w-full h-full rounded-xl"
                />
              </div>
              <h1 className="text-2xl font-bold leading-[160%] text-center mx-auto text-black whitespace-pre-wrap w-full max-w-[440px]">
                {pages[currentPage].title}
              </h1>
              <p className="leading-[160%] text-black w-full font-medium text-left">
                {pages[currentPage].description}
              </p>
            </>
          ) : (
            // 1-4번째 페이지: 기존 순서 (제목 → 설명 → 이미지)
            <>
              <h1 className="text-xl font-bold leading-[170%] text-left mx-auto text-black whitespace-pre-wrap w-full max-w-[400px]">
                {pages[currentPage].title}
              </h1>
              <p
                className={`leading-[170%] text-black w-full ${
                  currentPage === 0
                    ? "text-2xl font-bold text-center"
                    : "text-xl font-medium text-left"
                }`}
              >
                {pages[currentPage].description}
              </p>
              <div
                className="w-full max-w-[400px] h-[400px] flex items-center justify-center text-base text-white font-bold rounded-xl"
                style={{ backgroundColor: pages[currentPage].color }}
              >
                <img
                  src={pages[currentPage].imageUrl}
                  alt="페이지 이미지"
                  className="w-full h-full rounded-xl"
                />
              </div>
            </>
          )}
        </div>

        {/* 왼쪽 화살표 버튼 */}
        {currentPage > 0 && (
          <button
            onClick={handlePrev}
            className="absolute bottom-[3.125rem] left-5 w-[3.75rem] h-[3.75rem] bg-[#d9d9d9] border-none rounded-full flex items-center justify-center cursor-pointer hover:bg-[#c8c8c8]"
          >
            <img
              src={rightarrow}
              alt="이전"
              className="w-[1.875rem] h-[1.875rem] scale-x-[-1]"
            />
          </button>
        )}

        {/* 오른쪽 화살표 버튼 또는 시작하기 버튼 */}
        {currentPage < pages.length - 1 ? (
          <button
            onClick={handleNext}
            className="absolute bottom-[3.125rem] right-5 w-[3.75rem] h-[3.75rem] bg-[#d9d9d9] border-none rounded-full flex items-center justify-center cursor-pointer hover:bg-[#c8c8c8]"
          >
            <img
              src={rightarrow}
              alt="다음"
              className="w-[1.875rem] h-[1.875rem]"
            />
          </button>
        ) : (
          <button
            onClick={handleStartApp}
            className="absolute bottom-[3.125rem] right-5 w-[12rem] h-[3.125rem] bg-[#00DAAA] border-none rounded-full flex items-center justify-center cursor-pointer text-black font-semibold text-base hover:bg-[#00c495] transition-colors duration-300"
          >
            하루 언어 시작하기
          </button>
        )}
      </div>
    </div>
  );
};

export default Introduction;
