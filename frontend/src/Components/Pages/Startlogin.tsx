import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAtom } from "jotai";
import { setUserAtom } from "../../store/authStore";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { API_ENDPOINTS } from "../../config/api";
import googlelogo from "../../Images/google_logo.png";
import logo from "../../Images/LogoImg.png"; // 로고 이미지
import kakaologo from "../../Images/kakaologo.png"; // 카카오 로고 이미지 추가

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [, setUserData] = useAtom(setUserAtom);
  const { showSuccess, showError, showInfo, handleError } = useErrorHandler();

  // 컴포넌트가 마운트될 때마다 현재 URL 확인
  console.log("🚨 Login component mounted");
  console.log("🚨 Current URL:", window.location.href);
  console.log("🚨 Current pathname:", window.location.pathname);
  console.log("🚨 Current search:", window.location.search);

  // URL 파라미터에서 로그인 성공 정보 확인
  useEffect(() => {
    console.log("🚨🚨🚨 Startlogin useEffect ALWAYS RUNS 🚨🚨🚨");

    const loginSuccess = searchParams.get("loginSuccess");
    const loginError = searchParams.get("loginError");
    const errorMessage = searchParams.get("errorMessage");
    const userName = searchParams.get("userName");
    const userId = searchParams.get("userId");

    console.log("=== Startlogin useEffect ===");
    console.log("All searchParams:", Object.fromEntries(searchParams));
    console.log(
      "loginSuccess value:",
      loginSuccess,
      "type:",
      typeof loginSuccess
    );
    console.log("loginError value:", loginError, "type:", typeof loginError);
    console.log("errorMessage value:", errorMessage);
    console.log("userName value:", userName, "type:", typeof userName);
    console.log("userId value:", userId, "type:", typeof userId);
    console.log("Raw URL search string:", window.location.search);

    if (loginSuccess === "true" && userName) {
      console.log("✅ Login success detected, setting user:", userName);

      try {
        // 로그인 성공 시 사용자 정보를 전역 상태에 저장
        setUserData({
          name: userName,
          userId: userId ? Number(userId) : undefined, // userId가 있으면 사용
        });

        // 성공 토스트 표시
        showSuccess("로그인 성공", `${userName}님 환영합니다!`);

        console.log("✅ setUserData called with:", {
          name: userName,
          userId,
        });

        // URL에서 로그인 성공 파라미터 제거
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("loginSuccess");
        newUrl.searchParams.delete("userName");
        newUrl.searchParams.delete("userId");
        window.history.replaceState({}, "", newUrl.toString());

        // atomWithStorage가 sessionStorage에 저장할 시간을 주기 위해 setTimeout 사용
        setTimeout(() => {
          console.log(
            "SessionStorage after setUserData:",
            sessionStorage.getItem("user")
          );
        }, 50);

        // 상태가 설정된 후 홈 페이지로 리다이렉트
        setTimeout(() => {
          console.log("✅ Navigating to /home");
          navigate("/home");
        }, 1000); // 토스트를 볼 수 있도록 딜레이 증가
      } catch (error) {
        console.error("❌ Error during login process:", error);
        handleError(error);
        showError("로그인 중 오류가 발생했습니다", "다시 시도해주세요.");
      }
    } else if (loginError === "true") {
      // 로그인 실패 처리
      console.log("❌ Login error detected");
      const displayMessage =
        errorMessage || "로그인에 실패했습니다. 다시 시도해주세요.";
      showError("로그인 실패", displayMessage);

      // URL에서 에러 파라미터 제거
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("loginError");
      newUrl.searchParams.delete("errorMessage");
      window.history.replaceState({}, "", newUrl.toString());
    } else if (loginSuccess || loginError || userName) {
      console.log("❌ Login conditions not met");
      console.log("loginSuccess === 'true':", loginSuccess === "true");
      console.log("userName exists:", !!userName);
      console.log("loginError === 'true':", loginError === "true");
    }
  }, [
    searchParams,
    setUserData,
    navigate,
    showSuccess,
    showError,
    showInfo,
    handleError,
  ]);

  const handleGoogleLogin = () => {
    try {
      console.log(
        "🚨 Google login clicked - redirecting to:",
        `${API_ENDPOINTS.auth}/google`
      );

      // 로그인 시도 토스트 표시
      showInfo("로그인 진행 중", "Google 로그인 페이지로 이동합니다...");

      // Google OAuth 엔드포인트로 리다이렉트
      window.location.href = `${API_ENDPOINTS.auth}/google`;
    } catch (error) {
      console.error("Google login redirect error:", error);
      handleError(error);
      showError("로그인 오류", "Google 로그인을 시도할 수 없습니다.");
    }
  };

  const handleKakaoLogin = () => {
    try {
      console.log(
        "🚨 Kakao login clicked - redirecting to:",
        `${API_ENDPOINTS.auth}/kakao`
      );

      // 로그인 시도 토스트 표시
      showInfo("로그인 진행 중", "Kakao 로그인 페이지로 이동합니다...");

      // Kakao OAuth 엔드포인트로 리다이렉트
      window.location.href = `${API_ENDPOINTS.auth}/kakao`;
    } catch (error) {
      console.error("Kakao login redirect error:", error);
      handleError(error);
      showError("로그인 오류", "Kakao 로그인을 시도할 수 없습니다.");
    }
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
