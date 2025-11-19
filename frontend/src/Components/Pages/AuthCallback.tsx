import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAtom } from "jotai";
import { setUserAtom } from "../../store/authStore";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { API_ENDPOINTS } from "../../config/api";

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [, setUserData] = useAtom(setUserAtom);
  const { showSuccess, showError, handleError } = useErrorHandler();

  useEffect(() => {
    const loginSuccess = searchParams.get("loginSuccess");
    const loginError = searchParams.get("loginError");
    const errorMessage = searchParams.get("errorMessage");
    const userName = searchParams.get("userName");

    const hydrateUserFromSession = async () => {
      const response = await fetch(`${API_ENDPOINTS.auth}/check`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("세션 정보를 확인할 수 없습니다.");
      }

      const data = await response.json();
      if (!data?.isLoggedIn || !data?.user) {
        throw new Error("로그인 정보가 존재하지 않습니다.");
      }

      setUserData({
        name: data.user.name,
        email: data.user.email,
        userId: data.user.userId,
        socialId: data.user.social_id,
        visitCount: data.user.visitCount,
        mostVisitedDays: data.user.mostVisitedDays,
      });
    };

    const handleSuccess = async () => {
      try {
        await hydrateUserFromSession();
        showSuccess("로그인 성공", `${userName || "사용자"}님 환영합니다!`);
        navigate("/home", { replace: true });
      } catch (error) {
        handleError(error);
        showError(
          "로그인 정보 동기화 실패",
          "세션 정보를 불러오지 못했습니다. 다시 시도해주세요."
        );
        navigate("/", { replace: true });
      }
    };

    if (loginSuccess === "true") {
      handleSuccess();
    } else if (loginError === "true") {
      const displayMessage = errorMessage || "로그인에 실패했습니다. 다시 시도해주세요.";
      showError("로그인 실패", displayMessage);
      navigate("/", { replace: true });
    } else {
      showError("로그인 오류", "잘못된 로그인 요청입니다.");
      navigate("/", { replace: true });
    }
  }, [searchParams, setUserData, navigate, showSuccess, showError, handleError]);

  return (
    <div className="w-full h-screen flex items-center justify-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#ecfffb]">
      <div className="flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004f4f]"></div>
        <p className="mt-4 text-[#004f4f] font-medium">로그인 처리 중...</p>
      </div>
    </div>
  );
};

export default AuthCallback;