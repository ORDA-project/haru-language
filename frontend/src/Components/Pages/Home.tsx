import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { useSearchParams } from "react-router-dom";
import HomeInfo from "../Elements/HomeInfo";
import NavBar from "../Templates/Navbar";
import HomeHeader from "../Templates/HomeHeader";
import StatusCheck from "../Elements/StatusCheck";
import { isLoggedInAtom, userAtom, setUserAtom } from "../../store/authStore";
import axios from "axios";

const Home = () => {
  const [searchParams] = useSearchParams();
  const [isLoggedIn] = useAtom(isLoggedInAtom);
  const [user] = useAtom(userAtom);
  const [, setUserData] = useAtom(setUserAtom);
  const [visitCount, setVisitCount] = useState<number>(0);
  const [mostVisitedDay, setMostVisitedDay] = useState<string>("");
  const [recommendation, setRecommendation] = useState<string>("");

  // 백엔드에서 파라미터 없이 /home으로 리다이렉트하므로 항상 API 호출해서 인증 확인
  useEffect(() => {
    console.log("🚨🚨🚨 HOME: 백엔드가 파라미터 없이 리다이렉트 - 항상 API 호출 🚨🚨🚨");
    console.log("🚨 Current URL:", window.location.href);
    
    // 로그인 상태와 관계없이 항상 /home API 호출해서 서버에서 인증 확인
    console.log("✅ Making API call to /home (always)");
    axios({
      method: "GET",
      url: "http://localhost:8000/home",
      withCredentials: true,
    })
      .then((res) => {
        console.log("✅ Home API response:", res.data);
        const { name, visitCount, mostVisitedDay, recommendation } =
          res.data.userData;
        console.log("✅ User data:", name, visitCount, mostVisitedDay, recommendation);

        // 사용자 정보를 전역 상태에 저장
        setUserData({ name });
        setVisitCount(visitCount);
        setMostVisitedDay(mostVisitedDay);
        setRecommendation(recommendation);
      })
      .catch((err) => {
        console.error("❌ Error fetching user data:", err);
        console.log("❌ 인증 실패 - 비로그인 상태로 유지");
        // 에러 발생 시 로그인 상태를 false로 설정하지만 페이지에는 머물기
        setUserData(null);
        // 비로그인 상태에서도 /home 접근 가능하므로 리다이렉트하지 않음
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
      <div className="h-[calc(100vh-160px)] p-0 px-3 w-full max-w-[440px] box-border mx-auto overflow-y-scroll">
        <>
          <HomeInfo
            userName={user?.name || ""}
            visitCount={visitCount}
            mostVisitedDay={mostVisitedDay}
            recommendation={recommendation}
            isLoggedIn={isLoggedIn}
          />
          <StatusCheck />
        </>
      </div>
      <NavBar currentPage={"Home"} />
    </div>
  );
};

export default Home;
