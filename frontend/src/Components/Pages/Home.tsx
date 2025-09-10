import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import HomeInfo from "../Elements/HomeInfo";
import NavBar from "../Templates/Navbar";
import HomeHeader from "../Templates/HomeHeader";
import StatusCheck from "../Elements/StatusCheck";
import { isLoggedInAtom, userAtom, setUserAtom } from "../../store/authStore";
import { API_ENDPOINTS } from "../../config/api";
import { useErrorHandler } from "../../hooks/useErrorHandler";

// User 타입 정의 (authStore와 동일)
interface User {
  name: string;
  email?: string;
  id?: string;
  userId?: string;
  token?: string;
  isOnboarded?: boolean;
}

const Home = () => {
  const [searchParams] = useSearchParams();
  const [isLoggedIn] = useAtom(isLoggedInAtom);
  const [user] = useAtom(userAtom);
  const [, setUserData] = useAtom(setUserAtom);
  const [visitCount, setVisitCount] = useState<number>(0);
  const [mostVisitedDay, setMostVisitedDay] = useState<string>("");
  const [recommendation, setRecommendation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const { showError, showWarning } = useErrorHandler();

  // 백엔드에서 파라미터 없이 /home으로 리다이렉트하므로 항상 API 호출해서 인증 확인
  useEffect(() => {
    console.log(
      "🚨🚨🚨 HOME: 백엔드가 파라미터 없이 리다이렉트 - 항상 API 호출 🚨🚨🚨"
    );
    console.log("🚨 Current URL:", window.location.href);

    // 로그인 상태와 관계없이 항상 /home API 호출해서 서버에서 인증 확인
    console.log("✅ Making API call to /home (always)");
    setLoading(true);

    const timeoutId = setTimeout(() => {
      if (loading) {
        showWarning("요청 시간 초과", "서버 응답이 지연되고 있습니다.");
      }
    }, 10000); // 10초 후 타임아웃 경고

    axios({
      method: "GET",
      url: API_ENDPOINTS.home,
      withCredentials: true,
      timeout: 15000, // 15초 타임아웃
    })
      .then((res) => {
        clearTimeout(timeoutId);
        console.log("✅ Home API response:", res.data);

        if (!res.data || !res.data.userData) {
          throw new Error("서버에서 올바르지 않은 응답을 받았습니다.");
        }

        const { name, visitCount, mostVisitedDay, recommendation, userId } =
          res.data.userData;
        console.log(
          "✅ User data:",
          name,
          visitCount,
          mostVisitedDay,
          recommendation,
          userId
        );

        // 사용자 정보를 전역 상태에 저장
        setUserData({ name, userId });
        setVisitCount(visitCount || 0);
        setMostVisitedDay(mostVisitedDay || "");
        setRecommendation(recommendation || "추천 곡이 없습니다");
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error("❌ Error fetching user data:", err);

        if (axios.isAxiosError(err)) {
          if (err.code === "ECONNABORTED") {
            showError(
              "연결 시간 초과",
              "서버 연결이 지연되고 있습니다. 잠시 후 다시 시도해주세요."
            );
          } else if (err.response?.status === 401) {
            console.log("❌ 인증 실패 - 비로그인 상태로 유지");
            // 인증 실패는 정상적인 상황이므로 토스트를 표시하지 않음
          } else if (err.response?.status === 500) {
            showError(
              "서버 오류",
              "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            );
          } else if (!err.response) {
            showError(
              "네트워크 오류",
              "서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요."
            );
          } else {
            showError(
              "오류 발생",
              `서버 오류가 발생했습니다. (${err.response.status})`
            );
          }
        } else {
          showError(
            "알 수 없는 오류",
            err.message || "알 수 없는 오류가 발생했습니다."
          );
        }

        // 에러 발생 시 로그인 상태를 false로 설정하지만 페이지에는 머물기
        setUserData(null);
        setRecommendation("추천 곡을 불러올 수 없습니다");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setUserData]);

  // 상태 변경 시 로그만 출력 (API 호출은 위에서 한 번만)
  useEffect(() => {
    console.log("=== Home state change ===");
    console.log("isLoggedIn:", isLoggedIn);
    console.log("user:", user);
    console.log("sessionStorage user (raw):", sessionStorage.getItem("user"));
  }, [isLoggedIn, user]);

  return (
    <div className="w-full h-full flex flex-col items-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#F7F8FB]">
      <HomeHeader />
      <div className="h-[calc(100vh-152px)] p-0 px-3 w-full max-w-[440px] box-border mx-auto overflow-y-scroll">
        <>
          <HomeInfo
            userName={user?.name || ""}
            visitCount={visitCount}
            mostVisitedDay={mostVisitedDay}
            recommendation={recommendation}
            isLoggedIn={isLoggedIn}
          />
          <StatusCheck userId={user?.userId} />
        </>
      </div>
      <NavBar currentPage={"Home"} />
    </div>
  );
};

export default Home;
