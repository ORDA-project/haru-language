import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";
import download from "../../Images/download.png";
import speaker from "../../Images/speaker.png";
import { Icons } from "./Icons";

interface HomeInfoProps {
  userName?: string;
  visitCount?: number;
  mostVisitedDay?: string;
  recommendation?: string;
  dailySentence?: { english: string; korean: string } | null;
  isLoggedIn?: boolean;
}

const HomeInfo = ({
  userName,
  visitCount,
  mostVisitedDay,
  recommendation,
  dailySentence,
  isLoggedIn,
}: HomeInfoProps) => {
  const navigate = useNavigate();
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  
  // 큰글씨 모드에 따른 텍스트 크기
  const baseFontSize = isLargeTextMode ? 20 : 16;
  const largeFontSize = isLargeTextMode ? 24 : 20;
  const xLargeFontSize = isLargeTextMode ? 28 : 24;
  const smallFontSize = isLargeTextMode ? 18 : 14;
  const headerFontSize = isLargeTextMode ? 22 : 18;
  
  const baseTextStyle: React.CSSProperties = { fontSize: `${baseFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const largeTextStyle: React.CSSProperties = { fontSize: `${largeFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const xLargeTextStyle: React.CSSProperties = { fontSize: `${xLargeFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const smallTextStyle: React.CSSProperties = { fontSize: `${smallFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const headerTextStyle: React.CSSProperties = { fontSize: `${headerFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };

  const [isPopupVisible, setIsPopupVisible] = useState(false);

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
          <p className="leading-[150%] font-medium my-[20px]" style={xLargeTextStyle}>
            <span>{userName}</span>님, 반가워요.
            <br />
            오늘로 벌써 <span className="font-bold">{visitCount}번째</span>{" "}
            방문하셨어요.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-start justify-center gap-1 my-2">
          <div className="leading-[150%] font-medium" style={xLargeTextStyle}>
            로그인이 필요합니다.
          </div>
          <Link
            to="/"
            className="leading-[150%] font-medium underline-offset-4 underline"
            style={baseTextStyle}
          >
            로그인 및 회원가입
          </Link>
        </div>
      )}
      <div
        className="h-[200px] flex flex-col justify-start items-start p-[20px] rounded-[20px] bg-white shadow-[0px_3px_7px_2px_rgba(0,0,0,0.05)] my-[20px] border-4 border-[#00DAAA] cursor-pointer select-none"
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        onClick={() => navigate("/daily-sentence")}
        onTouchStart={(e) => {
          e.currentTarget.style.opacity = '0.8';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.opacity = '1';
          navigate("/daily-sentence");
        }}
      >
        <div className="font-bold leading-[150%] bg-[#00E8B6]" style={baseTextStyle}>
          <span>오늘의 한줄 영어</span>
        </div>
        <div className="font-bold leading-[150%] w-full my-[12px] flex flex-col" style={headerTextStyle}>
          {dailySentence ? (
            <>
              <div className="break-words">{dailySentence.english}</div>
              <div className="break-words">{dailySentence.korean}</div>
            </>
          ) : (
            <div className="text-gray-400">오늘의 질문을 불러오는 중...</div>
          )}
        </div>

        <div className="w-full flex flex-col items-end -mt-2">
          <div className="rounded-[70px] bg-gradient-to-r from-transparent to-[#00DAAA] w-1/2 h-[50px] flex justify-end items-center -mr-2">
            <Icons.arrowRight className="-translate-x-[15px]" />
          </div>
        </div>
      </div>
      <div
        className="min-h-[120px] flex px-5 py-4 justify-between items-center rounded-[20px] bg-white shadow-[0px_3px_7px_2px_rgba(0,0,0,0.05)] cursor-pointer select-none"
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        onClick={() => {
          navigate("/song-recommend");
        }}
        onTouchStart={(e) => {
          e.currentTarget.style.opacity = '0.8';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.opacity = '1';
          navigate("/song-recommend");
        }}
      >
        <div className="w-full flex-1 min-w-0 pr-4">
          <div className="font-bold leading-[150%] mb-2" style={baseTextStyle}>
            <span>오늘의 추천 팝송</span>
          </div>
          <div 
            className="font-bold leading-[150%] max-w-[calc(100%-50px)]" 
            style={largeTextStyle}
          >
            <span 
              className="block"
              style={{ 
                wordBreak: 'break-word', 
                overflowWrap: 'break-word', 
                whiteSpace: 'normal',
                lineHeight: '1.5'
              }}
            >
              {recommendation}
            </span>
          </div>
        </div>
        <div className="h-[120px] flex-shrink-0">
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
      {(() => {
        const SEASON_VISITS = 10;
        const currentSeason = Math.floor((visitCount || 0) / SEASON_VISITS) + 1;
        const progressInSeason = (visitCount || 0) % SEASON_VISITS;
        const remainingVisits = SEASON_VISITS - progressInSeason;
        
        return (
          <div 
            className="h-[120px] flex p-[0_20px] justify-between items-center rounded-[20px] bg-white shadow-[0px_3px_7px_2px_rgba(0,0,0,0.05)] my-[20px] cursor-pointer select-none"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            onClick={() => navigate("/season")}
            onTouchStart={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.opacity = '1';
              navigate("/season");
            }}
          >
            <div className="flex flex-col w-full">
              <div className="font-bold leading-[150%]" style={largeTextStyle}>
                {progressInSeason === 0 ? (
                  <>시즌 {currentSeason - 1} 완료! 🎉</>
                ) : remainingVisits === 1 ? (
                  <>1번 남았어요!</>
                ) : (
                  <>{remainingVisits}번 남았어요!</>
                )}
              </div>
              <div className="leading-[150%]" style={smallTextStyle}>
                <span>
                  {progressInSeason === 0 ? (
                    <>시즌 {currentSeason}을 시작해보세요!</>
                  ) : remainingVisits === 1 ? (
                    <>1번 더 오면 시즌 {currentSeason}을<br />완료할 수 있어요.</>
                  ) : (
                    <>{remainingVisits}번 더 오면 시즌 {currentSeason}을<br />완료할 수 있어요.</>
                  )}
                </span>
              </div>
            </div>
            <div className="h-full">
              <Icons.trophy />
            </div>
          </div>
        );
      })()}
      <hr className="border-t border-[#B4B2B3]" />
    </>
  );
};

export default HomeInfo;
