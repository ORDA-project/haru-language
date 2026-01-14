import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { useSearchParams } from "react-router-dom";
import HomeInfo from "../Elements/HomeInfo";
import NavBar from "../Templates/Navbar";
import HomeHeader from "../Templates/HomeHeader";
import StatusCheck from "../Elements/StatusCheck";
import { isLoggedInAtom, userAtom, setUserAtom } from "../../store/authStore";
import { API_ENDPOINTS } from "../../config/api";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { http } from "../../utils/http";

// User 타입 정의 (authStore와 동일)
interface User {
  name: string;
  email?: string;
  id?: string;
  userId?: string;
  token?: string;
  isOnboarded?: boolean;
  socialProvider?: string | null;
}

const Home = () => {
  const [isLoggedIn] = useAtom(isLoggedInAtom);
  const [user] = useAtom(userAtom);
  const [, setUserData] = useAtom(setUserAtom);
  const [visitCount, setVisitCount] = useState<number>(0);
  const [mostVisitedDay, setMostVisitedDay] = useState<string>("");
  const [recommendation, setRecommendation] = useState<string>("");
  const [dailySentence, setDailySentence] = useState<{ english: string; korean: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { showError, showWarning, showSuccess } = useErrorHandler();

  // 보안: URL에서 민감한 정보 제거
  useEffect(() => {
    const url = new URL(window.location.href);
    let hasChanges = false;

    // URL에서 사용자 정보 제거
    if (url.searchParams.has("loginSuccess") || 
        url.searchParams.has("loginError") || 
        url.searchParams.has("userName") || 
        url.searchParams.has("errorMessage") ||
        url.searchParams.has("userId")) {
      url.searchParams.delete("loginSuccess");
      url.searchParams.delete("loginError");
      url.searchParams.delete("userName");
      url.searchParams.delete("errorMessage");
      url.searchParams.delete("userId");
      hasChanges = true;
    }

    if (hasChanges) {
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  // 백엔드에서 파라미터 없이 /home으로 리다이렉트하므로 항상 API 호출해서 인증 확인
  // user atom이 변경되면 (로그인 후) 다시 API 호출
  useEffect(() => {
    // 토큰이 있으면 API 호출 (user atom이 없어도 토큰으로 인증 가능)
    const token = localStorage.getItem("accessToken");
    
    // user가 없거나 userId가 없고 토큰도 없으면 API 호출하지 않음 (401 에러 방지)
    if ((!user || !user.userId) && !token) {
      setLoading(false);
      return;
    }
    
    // 로그인 상태와 관계없이 항상 /home API 호출해서 서버에서 인증 확인
    // 로그인 직후에는 user atom이 아직 업데이트되지 않았을 수 있으므로
    // 토큰이 있으면 API 호출
    setLoading(true);

    let timeoutCleared = false;
    const timeoutId = setTimeout(() => {
      if (!timeoutCleared) {
        showWarning("요청 시간 초과", "서버 응답이 지연되고 있습니다.");
      }
    }, 10000); // 10초 후 타임아웃 경고

    // http 유틸리티 사용 (JWT 토큰 자동 포함)
    // http.get은 API_BASE_URL을 자동으로 사용하므로 상대 경로만 전달
    http.get<{
      result: boolean;
      userData: {
        userId: number;
        name: string;
        visitCount: number;
        mostVisitedDay: string;
        recommendation: string;
        dailySentence?: { english: string; korean: string } | null;
        socialProvider?: string | null;
        songData?: {
          Title: string;
          Artist: string;
          Lyric: string;
          YouTube?: string;
          youtubeLink?: string;
        } | null;
      };
      loginSuccess?: boolean;
      loginError?: boolean;
      userName?: string;
      errorMessage?: string;
    }>("/home")
      .then((data) => {
        timeoutCleared = true;
        clearTimeout(timeoutId);

        if (!data || !data.userData) {
          throw new Error("서버에서 올바르지 않은 응답을 받았습니다.");
        }

        const { name, visitCount, mostVisitedDay, recommendation, userId, dailySentence, socialProvider, songData } =
          data.userData;
        
        // 보안: 로그인 성공/실패 메시지 처리 (URL이 아닌 응답에서 가져옴)
        const { loginSuccess, loginError, userName, errorMessage } = data;
        
        if (loginSuccess && userName) {
          showSuccess("로그인 성공", `${userName}님 환영합니다!`);
        } else if (loginError && errorMessage) {
          showError("로그인 실패", errorMessage);
        }

        // 노래 데이터를 sessionStorage에 저장 (SongRecommend 페이지에서 사용)
        if (songData) {
          try {
            sessionStorage.setItem('currentSongData', JSON.stringify(songData));
          } catch (error) {
            // sessionStorage 저장 실패는 치명적이지 않음
          }
        }

        // 사용자 정보를 전역 상태에 저장 (서버에서 받은 최신 정보로 업데이트)
        setUserData({
          ...(user || {}),
          name,
          userId,
          visitCount,
          mostVisitedDays: mostVisitedDay,
          socialProvider: socialProvider || user?.socialProvider || null,
          email: user?.email || undefined,
          socialId: user?.socialId || undefined,
        });
        setVisitCount(visitCount || 0);
        setMostVisitedDay(mostVisitedDay || "");
        setRecommendation(recommendation || "추천 곡이 없습니다");
        setDailySentence(dailySentence || null);
      })
      .catch((err: any) => {
        timeoutCleared = true;
        clearTimeout(timeoutId);

        if (err.status === 401) {
          // 인증 실패 시에도 기존 사용자 데이터를 유지 (토큰 만료 등 일시적 오류일 수 있음)
          // setUserData(null); // 주석 처리 - 사용자 데이터 유지
          return; // 에러 처리 중단, 기존 상태 유지
        } else if (err.status === 500) {
          showError(
            "서버 오류",
            "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
          );
        } else if (err.status === 0) {
          showError(
            "네트워크 오류",
            "서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요."
          );
        } else {
          showError(
            "오류 발생",
            err.data?.message || err.message || `서버 오류가 발생했습니다. (${err.status || '알 수 없음'})`
          );
        }

        // 에러 발생 시 로그인 상태를 false로 설정하지만 페이지에는 머물기
        setUserData(null);
        setRecommendation("추천 곡을 불러올 수 없습니다");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setUserData, showSuccess, showError, showWarning, user?.userId]); // user.userId 변경 시 다시 호출 (로그인 후)


  return (
    <div className="w-full h-full flex flex-col items-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#F7F8FB]">
      <HomeHeader />
      <div className="h-[calc(100vh-152px)] p-0 px-3 pb-[72px] w-full max-w-[440px] box-border mx-auto overflow-y-scroll">
        <>
          <HomeInfo
            userName={user?.name || ""}
            visitCount={visitCount}
            mostVisitedDay={mostVisitedDay}
            recommendation={recommendation}
            dailySentence={dailySentence}
            isLoggedIn={isLoggedIn}
          />
          {/* 보안: userId 전달하지 않음 (JWT로 자동 인증) */}
          <StatusCheck />
        </>
      </div>
      <NavBar currentPage={"Home"} />
    </div>
  );
};

export default Home;
