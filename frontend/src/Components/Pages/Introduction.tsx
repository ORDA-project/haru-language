import React, { useState, useEffect } from "react";
import rightarrow from "../../Images/rightarrow.png";
import { useNavigate, useLocation } from "react-router-dom";
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
    imageUrl: Image4,
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
    imageUrl: Image2,
  },
  {
    title: "하루 언어",
    description:
      "일주일의 하루씩, 언어를 공부하는 시간을 가져보세요. 하루 언어가 교재 내용을 바탕으로 다양한 예문과 정확한 발음을 알려드릴게요!",
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
  const location = useLocation();
  const fromHelp = (location.state as { fromHelp?: boolean })?.fromHelp || false;

  const handleNext = (): void => {
    if (currentPage < pages.length - 1) {
      setCurrentPage((prev) => prev + 1);
    } else {
      handleStartApp();
    }
  };

  const handleStartApp = async (): Promise<void> => {
    
    // 도움말에서 온 경우 마이페이지로 돌아가기
    if (fromHelp) {
      navigate("/mypage");
      return;
    }
    
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
    }
  };

  const handleClose = (): void => {
    navigate("/");
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#ecfffb] relative" style={{ minHeight: '100dvh' }}>
      {/* 메인 컨텐츠 영역 */}
      <div className="min-h-screen w-full max-w-[440px] box-border mx-auto flex flex-col justify-center items-center relative px-3 py-4 pb-24 md:max-w-[440px]" style={{ minHeight: '100dvh', paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px) + 80px)' }}>
        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 sm:w-10 sm:h-10 bg-transparent border-none text-2xl sm:text-3xl text-gray-800 cursor-pointer transition-colors duration-300 hover:text-[#00daaa] z-10"
        >
          ×
        </button>

        {/* 페이지 인디케이터 */}
        <div className="flex gap-2 sm:gap-2.5 absolute top-4 sm:top-[6%]">
          {pages.map((_, index) => (
            <div
              key={index}
              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors duration-300 ${
                index === currentPage ? "bg-[#00DAAA]" : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* 페이지 콘텐츠 */}
        <div className="flex flex-col items-start gap-3 sm:gap-4 w-full px-3 sm:px-4 mt-8 sm:mt-0 overflow-y-auto" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word', maxHeight: 'calc(100vh - 200px)', WebkitOverflowScrolling: 'touch' }}>
          {currentPage === pages.length - 1 ? (
            // 5번째 페이지: 이미지 → 제목 → 설명 순서
            <>
              <div
                className="w-full max-w-[90%] sm:max-w-[420px] flex items-center justify-center text-base font-bold mb-3 sm:mb-4 mx-auto overflow-hidden"
                style={{ backgroundColor: 'transparent' }}
              >
                <img
                  src={pages[currentPage].imageUrl}
                  alt="페이지 이미지"
                  className="w-full object-contain"
                  style={{ maxHeight: 'clamp(200px, 40vh, 420px)', height: 'auto', backgroundColor: 'transparent' }}
                />
              </div>
              <div className="w-full max-w-[90%] sm:max-w-[380px] flex flex-col gap-2 sm:gap-3 mx-auto">
                <h1 className="text-lg sm:text-[22px] font-bold leading-[170%] text-left text-black whitespace-pre-wrap">
                  {pages[currentPage].title}
                </h1>
                <p 
                  className="leading-[170%] text-sm sm:text-base text-black font-medium text-left"
                  style={{ wordBreak: 'keep-all', overflowWrap: 'break-word', whiteSpace: 'normal' }}
                >
                  {pages[currentPage].description}
                </p>
              </div>
            </>
          ) : (
            // 1-4번째 페이지: 기존 순서 (제목 → 설명 → 이미지)
            <>
              <div className={`w-full max-w-[90%] sm:max-w-[380px] flex flex-col gap-2 sm:gap-3 ${currentPage === 0 ? "mt-4 sm:mt-8" : ""}`}>
                <h1
                  className={`leading-[170%] text-black whitespace-pre-wrap ${
                    currentPage === 0
                      ? "text-xl sm:text-2xl font-bold text-left"
                      : "text-lg sm:text-[22px] font-bold text-left"
                  }`}
                >
                  {pages[currentPage].title}
                </h1>
                {pages[currentPage].description && (
                  <p 
                    className="leading-[170%] text-sm sm:text-base text-black font-medium text-left"
                    style={{ wordBreak: 'keep-all', overflowWrap: 'break-word', whiteSpace: 'normal' }}
                  >
                    {pages[currentPage].description}
                  </p>
                )}
              </div>
              <div
                className={`w-full max-w-[95%] sm:max-w-[500px] flex items-center justify-center text-base font-bold overflow-hidden ${
                  currentPage === 0 ? "" : "shadow-lg"
                }`}
                style={{ borderRadius: '24px', backgroundColor: 'transparent' }}
              >
                <img
                  src={pages[currentPage].imageUrl}
                  alt="페이지 이미지"
                  className="w-full object-contain"
                  style={{ borderRadius: '24px', maxHeight: 'clamp(250px, 50vh, 600px)', height: 'auto', backgroundColor: 'transparent' }}
                />
              </div>
            </>
          )}
        </div>

        {/* 왼쪽 화살표 버튼 */}
        {currentPage > 0 && (
          <button
            onClick={handlePrev}
            className="fixed sm:absolute left-4 sm:left-5 w-12 h-12 sm:w-[3.75rem] sm:h-[3.75rem] bg-[#d9d9d9] border-none rounded-full flex items-center justify-center cursor-pointer hover:bg-[#c8c8c8] z-20 touch-manipulation"
            style={{ 
              touchAction: 'manipulation',
              bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
              left: '1rem'
            }}
          >
            <img
              src={rightarrow}
              alt="이전"
              className="w-5 h-5 sm:w-[1.875rem] sm:h-[1.875rem] scale-x-[-1]"
            />
          </button>
        )}

        {/* 오른쪽 화살표 버튼 또는 시작하기 버튼 */}
        {currentPage < pages.length - 1 ? (
          <button
            onClick={handleNext}
            className="fixed sm:absolute right-4 sm:right-5 w-12 h-12 sm:w-[3.75rem] sm:h-[3.75rem] bg-[#d9d9d9] border-none rounded-full flex items-center justify-center cursor-pointer hover:bg-[#c8c8c8] z-20 touch-manipulation"
            style={{ 
              touchAction: 'manipulation',
              bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
              right: '1rem'
            }}
          >
            <img
              src={rightarrow}
              alt="다음"
              className="w-5 h-5 sm:w-[1.875rem] sm:h-[1.875rem]"
            />
          </button>
        ) : (
          <button
            onClick={handleStartApp}
            className="fixed sm:absolute left-4 sm:left-auto right-4 sm:right-5 w-[calc(100%-2rem)] sm:w-[12rem] h-12 sm:h-[3.125rem] bg-[#00DAAA] border-none rounded-full flex items-center justify-center cursor-pointer text-black font-semibold text-sm sm:text-base hover:bg-[#00c495] transition-colors duration-300 z-20 touch-manipulation px-4"
            style={{ 
              touchAction: 'manipulation',
              bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
              left: '1rem',
              right: '1rem',
              maxWidth: 'calc(100% - 2rem)'
            }}
          >
            <span className="whitespace-nowrap">하루 언어 시작하기</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Introduction;
