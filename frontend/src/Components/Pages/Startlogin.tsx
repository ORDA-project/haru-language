import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAtom } from "jotai";
import { setUserAtom } from "../../store/authStore";
import googlelogo from "../../Images/google_logo.png";
import logo from "../../Images/LogoImg.png"; // 로고 이미지
import kakaologo from "../../Images/kakaologo.png"; // 카카오 로고 이미지 추가

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [, setUserData] = useAtom(setUserAtom);

  // 컴포넌트가 마운트될 때마다 현재 URL 확인
  console.log("🚨 Login component mounted");
  console.log("🚨 Current URL:", window.location.href);
  console.log("🚨 Current pathname:", window.location.pathname);
  console.log("🚨 Current search:", window.location.search);

  // URL 파라미터에서 로그인 성공 정보 확인
  useEffect(() => {
    console.log("🚨🚨🚨 Startlogin useEffect ALWAYS RUNS 🚨🚨🚨");
    
    const loginSuccess = searchParams.get("loginSuccess");
    const userName = searchParams.get("userName");
    
    console.log("=== Startlogin useEffect ===");
    console.log("All searchParams:", Object.fromEntries(searchParams));
    console.log("loginSuccess value:", loginSuccess, "type:", typeof loginSuccess);
    console.log("userName value:", userName, "type:", typeof userName);
    console.log("Raw URL search string:", window.location.search);

    if (loginSuccess === "true" && userName) {
      console.log("✅ Login success detected, setting user:", userName);
      
      // 로그인 성공 시 사용자 정보를 전역 상태에 저장
      setUserData({ name: userName });
      
      console.log("✅ setUserData called with:", { name: userName });
      
      // atomWithStorage가 sessionStorage에 저장할 시간을 주기 위해 setTimeout 사용
      setTimeout(() => {
        console.log("SessionStorage after setUserData:", sessionStorage.getItem("user"));
      }, 50);
      
      // 상태가 설정된 후 홈 페이지로 리다이렉트
      setTimeout(() => {
        console.log("✅ Navigating to /home");
        navigate("/home");
      }, 200);
    } else {
      console.log("❌ Login conditions not met");
      console.log("loginSuccess === 'true':", loginSuccess === "true");
      console.log("userName exists:", !!userName);
    }
  }, [searchParams, setUserData, navigate]);

  const handleGoogleLogin = () => {
    console.log("🚨 Google login clicked - redirecting to:", "http://localhost:8000/auth/google");
    // Google OAuth 엔드포인트로 리다이렉트
    window.location.href = "http://localhost:8000/auth/google";
  };

  const handleKakaoLogin = () => {
    console.log("🚨 Kakao login clicked - redirecting to:", "http://localhost:8000/auth/kakao");
    // Kakao OAuth 엔드포인트로 리다이렉트
    window.location.href = "http://localhost:8000/auth/kakao";
  };

  const handleExplore = () => {
    // introduction 페이지로 이동
    navigate("/introduction");
  };

  return (
    <div className="w-full h-screen flex flex-col items-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#ecfffb]">
      {/* 메인 컨텐츠 영역 */}
      <div className="h-full p-0 px-3 w-full max-w-[440px] box-border mx-auto flex flex-col justify-center items-center">
        {/* 로고와 제목 */}
        <div className="flex flex-col items-center justify-center mb-8">
          <img
            src={logo}
            alt="로고 이미지"
            className="w-[7.5rem] h-auto mb-5 ml-4 animate-[fadeIn_1s_ease-in-out]"
          />
          <h1 className="text-2xl font-bold text-gray-800">하루 언어</h1>
        </div>

        {/* 로그인 버튼들 */}
        <div className="flex flex-col items-center justify-center gap-4 w-full">
          <button
            onClick={handleGoogleLogin}
            className="w-full max-w-[18.75rem] h-[3.125rem] bg-white border border-gray-300 rounded-full flex items-center justify-center gap-2.5 cursor-pointer text-base font-semibold text-gray-800 shadow-md transition-all duration-300 hover:bg-gray-50 hover:scale-105 active:scale-95"
          >
            <img src={googlelogo} alt="구글 로고" className="w-6 h-6" />
            구글로 연결하기
          </button>

          <button
            onClick={handleKakaoLogin}
            className="w-full max-w-[18.75rem] h-[3.125rem] bg-[#fee500] text-[#3c1e1e] border border-gray-300 rounded-full flex items-center justify-center gap-2.5 cursor-pointer text-base font-semibold shadow-md transition-all duration-300 hover:bg-[#fdd835] hover:scale-105 active:scale-95"
          >
            <img src={kakaologo} alt="카카오 로고" className="w-6 h-6" />
            카카오로 연결하기
          </button>

          {/* 둘러보기 링크 */}
          <p
            onClick={handleExplore}
            className="text-base font-medium text-[#004f4f] cursor-pointer underline transition-colors duration-300 hover:text-[#008c68] mt-4"
          >
            둘러보기
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
