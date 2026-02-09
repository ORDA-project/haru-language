import React, { useState, useEffect, useRef } from "react";
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
  dailySentenceRef?: React.RefObject<HTMLDivElement | null>;
  popSongRef?: React.RefObject<HTMLDivElement | null>;
}

const HomeInfo = ({
  userName,
  visitCount,
  mostVisitedDay,
  recommendation,
  dailySentence,
  isLoggedIn,
  dailySentenceRef,
  popSongRef,
}: HomeInfoProps) => {
  const navigate = useNavigate();
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  
  // 큰글씨 모드에 따른 텍스트 크기 (중년층용)
  const baseFontSize = isLargeTextMode ? 18 : 16;
  const largeFontSize = isLargeTextMode ? 22 : 20;
  const xLargeFontSize = isLargeTextMode ? 26 : 24;
  const smallFontSize = isLargeTextMode ? 16 : 14;
  const headerFontSize = isLargeTextMode ? 22 : 18;
  
  const baseTextStyle: React.CSSProperties = { fontSize: `${baseFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const largeTextStyle: React.CSSProperties = { fontSize: `${largeFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const xLargeTextStyle: React.CSSProperties = { fontSize: `${xLargeFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const smallTextStyle: React.CSSProperties = { fontSize: `${smallFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const headerTextStyle: React.CSSProperties = { fontSize: `${headerFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };

  // 홈화면 "오늘의 한줄 영어" 박스 - 고정 크기 (큰글씨 모드 무관)
  const [englishSentenceFontSize, setEnglishSentenceFontSize] = useState<number | null>(null);
  const [koreanSentenceFontSize, setKoreanSentenceFontSize] = useState<number | null>(null);
  const englishSentenceRef = useRef<HTMLDivElement>(null);
  const koreanSentenceRef = useRef<HTMLDivElement>(null);
  const englishSentenceContainerRef = useRef<HTMLDivElement>(null);

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

  // 홈화면 "오늘의 한줄 영어" 박스 - 영어 문장 자동 폰트 크기 조절 (고정 크기)
  useEffect(() => {
    if (!dailySentence || !englishSentenceRef.current || !englishSentenceContainerRef.current) {
      setEnglishSentenceFontSize(null);
      return;
    }

    const adjustFontSize = () => {
      const container = englishSentenceContainerRef.current;
      const textElement = englishSentenceRef.current;
      
      if (!container || !textElement) return;

      const englishText = dailySentence.english;
      
      if (!englishText) return;

      // 문장 개수 계산 (., !, ?로 끝나는 문장)
      const sentenceCount = (englishText.match(/[.!?]+/g) || []).length || 1;
      const targetLines = sentenceCount;

      // 큰글씨 모드에 따른 기본 폰트 크기
      const baseSize = isLargeTextMode ? 18 : 16;
      const minFontSize = isLargeTextMode ? 14 : 12;
      const maxFontSize = baseSize;

      // 컨테이너 너비 가져오기
      const containerWidth = container.offsetWidth - 40; // padding 고려

      // 임시 요소로 텍스트 너비 측정
      const measureElement = document.createElement('div');
      measureElement.style.position = 'absolute';
      measureElement.style.visibility = 'hidden';
      measureElement.style.whiteSpace = 'nowrap';
      measureElement.style.fontFamily = window.getComputedStyle(textElement).fontFamily;
      measureElement.style.fontWeight = window.getComputedStyle(textElement).fontWeight;
      document.body.appendChild(measureElement);

      // 이진 탐색으로 적절한 폰트 크기 찾기
      let low = minFontSize;
      let high = maxFontSize;
      let bestSize = baseSize;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        measureElement.style.fontSize = `${mid}px`;
        measureElement.textContent = englishText;
        
        const textWidth = measureElement.offsetWidth;
        const estimatedLines = Math.ceil(textWidth / containerWidth);
        
        if (estimatedLines <= targetLines) {
          bestSize = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      document.body.removeChild(measureElement);
      setEnglishSentenceFontSize(bestSize);
    };

    // 초기 조정
    adjustFontSize();

    // 리사이즈 이벤트 리스너
    const resizeObserver = new ResizeObserver(() => {
      adjustFontSize();
    });

    if (englishSentenceContainerRef.current) {
      resizeObserver.observe(englishSentenceContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [dailySentence]);

  // 홈화면 "오늘의 한줄 영어" 박스 - 한글 문장 자동 폰트 크기 조절 (고정 크기)
  useEffect(() => {
    if (!dailySentence || !koreanSentenceRef.current || !englishSentenceContainerRef.current) {
      setKoreanSentenceFontSize(null);
      return;
    }

    const adjustKoreanFontSize = () => {
      const container = englishSentenceContainerRef.current;
      const textElement = koreanSentenceRef.current;
      
      if (!container || !textElement) return;

      const koreanText = dailySentence.korean;
      
      if (!koreanText) return;

      // 큰글씨 모드에 따른 기본 폰트 크기
      const baseSize = isLargeTextMode ? 20 : 18;
      const minFontSize = isLargeTextMode ? 14 : 12;
      const maxFontSize = baseSize;

      // 컨테이너 너비 가져오기
      const containerWidth = container.offsetWidth - 40; // padding 고려

      // 임시 요소로 텍스트 너비 측정
      const measureElement = document.createElement('div');
      measureElement.style.position = 'absolute';
      measureElement.style.visibility = 'hidden';
      measureElement.style.whiteSpace = 'nowrap';
      measureElement.style.fontFamily = window.getComputedStyle(textElement).fontFamily;
      measureElement.style.fontWeight = window.getComputedStyle(textElement).fontWeight;
      document.body.appendChild(measureElement);

      // 이진 탐색으로 적절한 폰트 크기 찾기
      let low = minFontSize;
      let high = maxFontSize;
      let bestSize = baseSize;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        measureElement.style.fontSize = `${mid}px`;
        measureElement.textContent = koreanText;
        
        const textWidth = measureElement.offsetWidth;
        const estimatedLines = Math.ceil(textWidth / containerWidth);
        
        // 한글은 최대 2줄까지 허용
        if (estimatedLines <= 2) {
          bestSize = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      document.body.removeChild(measureElement);
      setKoreanSentenceFontSize(bestSize);
    };

    // 초기 조정
    adjustKoreanFontSize();

    // 리사이즈 이벤트 리스너
    const resizeObserver = new ResizeObserver(() => {
      adjustKoreanFontSize();
    });

    if (englishSentenceContainerRef.current) {
      resizeObserver.observe(englishSentenceContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [dailySentence]);

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
        ref={dailySentenceRef}
        className="min-h-[200px] flex flex-col justify-start items-start p-[20px] pb-[24px] rounded-[20px] bg-white shadow-[0px_3px_7px_2px_rgba(0,0,0,0.05)] my-[20px] border-4 border-[#00DAAA] cursor-pointer select-none w-full max-w-full overflow-visible box-border"
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          e.currentTarget.setAttribute('data-touch-start-y', touch.clientY.toString());
          e.currentTarget.setAttribute('data-touch-start-time', Date.now().toString());
        }}
        onTouchMove={(e) => {
          // 스크롤 중임을 표시
          e.currentTarget.setAttribute('data-scrolling', 'true');
        }}
        onTouchEnd={(e) => {
          const element = e.currentTarget;
          const startY = parseFloat(element.getAttribute('data-touch-start-y') || '0');
          const startTime = parseInt(element.getAttribute('data-touch-start-time') || '0');
          const endY = e.changedTouches[0].clientY;
          const endTime = Date.now();
          const isScrolling = element.getAttribute('data-scrolling') === 'true';
          
          // 정리
          element.removeAttribute('data-touch-start-y');
          element.removeAttribute('data-touch-start-time');
          element.removeAttribute('data-scrolling');
          
          // 스크롤이 아니고 짧은 터치인 경우에만 클릭 처리
          const moveDistance = Math.abs(endY - startY);
          const timeDiff = endTime - startTime;
          
          if (!isScrolling && moveDistance < 10 && timeDiff < 300) {
            navigate("/daily-sentence");
          }
        }}
        onClick={(e) => {
          // 모바일에서는 onTouchEnd에서 처리하므로 데스크톱에서만
          if (!('ontouchstart' in window)) {
            navigate("/daily-sentence");
          }
        }}
      >
        <div className="font-bold leading-[150%] bg-[#00E8B6] px-4 py-2 rounded-full" style={{ ...smallTextStyle, marginTop: '-4px' }}>
          <span>오늘의 한줄 영어</span>
        </div>
        <div className="w-full my-[8px] mt-[12px] flex flex-col min-w-0 overflow-visible relative z-10 pb-2" ref={englishSentenceContainerRef}>
          {dailySentence ? (
            <>
              <div 
                ref={englishSentenceRef}
                className="font-bold leading-[150%] break-words w-full min-w-0"
                style={{
                  fontSize: englishSentenceFontSize ? `${englishSentenceFontSize}px` : (isLargeTextMode ? '18px' : '17px'),
                  lineHeight: '1.4'
                }}
              >
                {dailySentence.english}
              </div>
              <div 
                ref={koreanSentenceRef}
                className="font-bold leading-[150%] break-words w-full min-w-0 mt-2 relative z-10"
                style={{
                  fontSize: koreanSentenceFontSize ? `${koreanSentenceFontSize}px` : (isLargeTextMode ? '20px' : '18px'),
                  lineHeight: '1.4',
                  wordBreak: 'keep-all',
                  overflowWrap: 'break-word'
                }}
              >
                {dailySentence.korean}
              </div>
            </>
          ) : (
            <div className="text-gray-400" style={baseTextStyle}>오늘의 질문을 불러오는 중...</div>
          )}
        </div>

        <div className="w-full flex flex-col items-end mt-2 relative z-0">
          <div className="rounded-[70px] bg-gradient-to-r from-transparent to-[#00DAAA] w-1/2 h-[50px] flex justify-end items-center -mr-2">
            <Icons.arrowRight className="-translate-x-[15px]" />
          </div>
        </div>
      </div>
      <div
        ref={popSongRef}
        className="min-h-[120px] flex px-5 py-4 justify-between items-center rounded-[20px] bg-white shadow-[0px_3px_7px_2px_rgba(0,0,0,0.05)] cursor-pointer select-none"
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          e.currentTarget.setAttribute('data-touch-start-y', touch.clientY.toString());
          e.currentTarget.setAttribute('data-touch-start-time', Date.now().toString());
        }}
        onTouchMove={(e) => {
          // 스크롤 중임을 표시
          e.currentTarget.setAttribute('data-scrolling', 'true');
        }}
        onTouchEnd={(e) => {
          const element = e.currentTarget;
          const startY = parseFloat(element.getAttribute('data-touch-start-y') || '0');
          const startTime = parseInt(element.getAttribute('data-touch-start-time') || '0');
          const endY = e.changedTouches[0].clientY;
          const endTime = Date.now();
          const isScrolling = element.getAttribute('data-scrolling') === 'true';
          
          // 정리
          element.removeAttribute('data-touch-start-y');
          element.removeAttribute('data-touch-start-time');
          element.removeAttribute('data-scrolling');
          
          // 스크롤이 아니고 짧은 터치인 경우에만 클릭 처리
          const moveDistance = Math.abs(endY - startY);
          const timeDiff = endTime - startTime;
          
          if (!isScrolling && moveDistance < 10 && timeDiff < 300) {
            navigate("/song-recommend");
          }
        }}
        onClick={(e) => {
          // 모바일에서는 onTouchEnd에서 처리하므로 데스크톱에서만
          if (!('ontouchstart' in window)) {
            navigate("/song-recommend");
          }
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
            onTouchStart={(e) => {
              const touch = e.touches[0];
              e.currentTarget.setAttribute('data-touch-start-y', touch.clientY.toString());
              e.currentTarget.setAttribute('data-touch-start-time', Date.now().toString());
            }}
            onTouchMove={(e) => {
              // 스크롤 중임을 표시
              e.currentTarget.setAttribute('data-scrolling', 'true');
            }}
            onTouchEnd={(e) => {
              const element = e.currentTarget;
              const startY = parseFloat(element.getAttribute('data-touch-start-y') || '0');
              const startTime = parseInt(element.getAttribute('data-touch-start-time') || '0');
              const endY = e.changedTouches[0].clientY;
              const endTime = Date.now();
              const isScrolling = element.getAttribute('data-scrolling') === 'true';
              
              // 정리
              element.removeAttribute('data-touch-start-y');
              element.removeAttribute('data-touch-start-time');
              element.removeAttribute('data-scrolling');
              
              // 스크롤이 아니고 짧은 터치인 경우에만 클릭 처리
              const moveDistance = Math.abs(endY - startY);
              const timeDiff = endTime - startTime;
              
              if (!isScrolling && moveDistance < 10 && timeDiff < 300) {
                navigate("/season");
              }
            }}
            onClick={(e) => {
              // 모바일에서는 onTouchEnd에서 처리하므로 데스크톱에서만
              if (!('ontouchstart' in window)) {
                navigate("/season");
              }
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
