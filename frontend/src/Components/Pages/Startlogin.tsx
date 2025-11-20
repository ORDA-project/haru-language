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


  // URL 파라미터에서 로그인 성공 정보 확인
  useEffect(() => {
    // 보안: URL에서 민감한 정보 제거
    const url = new URL(window.location.href);
    let hasChanges = false;

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
      // 보안: URL에서 민감한 정보 제거 후 종료
      // 로그인 정보는 AuthCallback이나 Home에서 처리
      return;
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
