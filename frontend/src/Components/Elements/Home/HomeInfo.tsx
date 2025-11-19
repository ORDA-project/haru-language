import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Icons } from "../../Elements/Icons";

interface HomeInfoProps {
  userName?: string;
  visitCount?: number;
  mostVisitedDay?: string;
  recommendation?: string;
  isLoggedIn?: boolean;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const HomeInfo = ({
  userName,
  visitCount,
  mostVisitedDay,
  recommendation,
  isLoggedIn,
}: HomeInfoProps) => {
  const navigate = useNavigate();

  const [isPopupVisible, setIsPopupVisible] = useState(false);

  // Writing 질문 조회 (오늘의 한줄 영어용)
  const { data: questionsData } = useQuery({
    queryKey: ["writingQuestions"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/writing/questions`);
      if (!response.ok) throw new Error("Failed to fetch writing questions");
      return response.json();
    },
  });

  const todayQuestion = questionsData?.data?.[0] || {
    englishQuestion: "Have you ever played a game?",
    koreanQuestion: "게임을 해 본 적이 있어?",
  };

  // const openPopup = () => setIsPopupVisible(true);
  // const closePopup = () => setIsPopupVisible(false);

  // const quoteData = {
  //   quote:
  //     "The only limit to our realization of tomorrow is our doubts of today.",
  //   translation: "내일 실현의 유일한 한계는 오늘의 의심이다.",
  //   source: "Franklin D. Roosevelt",
  // };

  useEffect(() => {
    if (isPopupVisible) {
      document.body.style.overflow = "hidden"; // 스크롤 비활성화
    } else {
      document.body.style.overflow = "auto"; // 스크롤 복원
    }

    return () => {
      document.body.style.overflow = "auto"; // 컴포넌트 언마운트 시 스크롤 복원
    };
  }, [isPopupVisible]);

  return (
    <>
      {isLoggedIn ? (
        <div>
          <p className="text-[24px] leading-[150%] font-medium my-[20px]">
            <span>{userName}</span>님, 반가워요.
            <br />
            오늘로 벌써 <span className="font-bold">{visitCount}번째</span>{" "}
            방문하셨어요.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-start justify-center gap-1 my-2">
          <div className="text-[24px] leading-[150%] font-medium">
            로그인이 필요합니다.
          </div>
          <Link
            to="/"
            className="text-[16px] leading-[150%] font-medium underline-offset-4 underline"
          >
            로그인 및 회원가입
          </Link>
        </div>
      )}
      <div
        className="h-[200px] flex flex-col justify-start items-start p-[20px] rounded-[20px] bg-white shadow-[0px_3px_7px_2px_rgba(0,0,0,0.05)] my-[20px] border-4 border-[#00DAAA] cursor-pointer"
        onClick={() => {
          navigate("/one-sentence");
        }}
      >
        <div className="text-[16px] font-bold leading-[150%] bg-[#00E8B6]">
          <span>오늘의 한줄 영어</span>
        </div>
        <div className="text-[22px] font-bold leading-[150%] w-full overflow-hidden text-ellipsis my-[20px] max-h-[90px] flex flex-col">
          <div>{todayQuestion.englishQuestion}</div>
          <div>{todayQuestion.koreanQuestion}</div>
        </div>

        <div className="w-full flex flex-col items-end">
          <div className="rounded-[70px] bg-gradient-to-r from-transparent to-[#00DAAA] w-1/2 h-[50px] flex justify-end items-center">
            <Icons.arrowRight className="-translate-x-[15px]" />
          </div>
        </div>
      </div>
      <div
        className="h-[120px] flex px-5 py-2 justify-between items-center rounded-[20px] bg-white shadow-[0px_3px_7px_2px_rgba(0,0,0,0.05)] cursor-pointer"
        onClick={() => {
          navigate("/song-recommend");
        }}
      >
        <div className="w-full">
          <div className="text-[16px] font-bold leading-[150%]">
            <span>오늘의 추천 팝송</span>
          </div>
          <div className="text-xl font-bold max-w-4/5 text-ellipsis">
            <span>{recommendation}</span>
          </div>
        </div>
        <div className="h-[120px]">
          <div className="relative top-[10px] left-[-60px]">
            <Icons.playButton />
          </div>
          <div className="relative top-[-20px] left-[-25px]">
            <Icons.musicNote1 />
          </div>
          <div className="relative top-[-100px] left-[20px]">
            <Icons.musicNote2 />
          </div>
        </div>
      </div>
      <div className="h-[120px] flex p-[0_20px] justify-between items-center rounded-[20px] bg-white shadow-[0px_3px_7px_2px_rgba(0,0,0,0.05)] my-[20px]">
        <div className="flex flex-col w-full">
          <div className="text-[20px] font-bold leading-[150%]">
            7번 남았어요!
          </div>
          <div className="text-[14px] leading-[150%]">
            <span>
              7번 더 오면 시즌 2를
              <br />
              완료할 수 있어요.
            </span>
          </div>
        </div>
        <div className="h-full">
          <Icons.trophy />
        </div>
      </div>
      <hr className="border-t border-[#B4B2B3]" />
    </>
  );
};

export default HomeInfo;
