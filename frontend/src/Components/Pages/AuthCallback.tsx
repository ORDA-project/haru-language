import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAtom } from "jotai";
import { setUserAtom } from "../../store/authStore";
import { useErrorHandler } from "../../hooks/useErrorHandler";

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [, setUserData] = useAtom(setUserAtom);
  const { showSuccess, showError, handleError } = useErrorHandler();

  useEffect(() => {
    console.log("🚨 AuthCallback component mounted");
    console.log("🚨 Current URL:", window.location.href);
    console.log("🚨 Current pathname:", window.location.pathname);
    console.log("🚨 Current search:", window.location.search);

    const loginSuccess = searchParams.get("loginSuccess");
    const loginError = searchParams.get("loginError");
    const errorMessage = searchParams.get("errorMessage");
    const userName = searchParams.get("userName");
    const userId = searchParams.get("userId");

    console.log("=== AuthCallback useEffect ===");
    console.log("All searchParams:", Object.fromEntries(searchParams));
    console.log("loginSuccess:", loginSuccess, "type:", typeof loginSuccess);
    console.log("loginError:", loginError, "type:", typeof loginError);
    console.log("errorMessage:", errorMessage);
    console.log("userName:", userName, "type:", typeof userName);
    console.log("userId:", userId, "type:", typeof userId);

    if (loginSuccess === "true" && userName) {
      console.log("✅ Login success detected, setting user:", userName);

      try {
        setUserData({
          name: userName,
          id: userId || undefined,
        });

        showSuccess("로그인 성공", `${userName}님 환영합니다!`);

        console.log("✅ setUserData called with:", {
          name: userName,
          id: userId,
        });

        // 상태가 설정된 후 홈 페이지로 리다이렉트
        setTimeout(() => {
          console.log("✅ Navigating to /home");
          navigate("/home", { replace: true });
        }, 1000);
      } catch (error) {
        console.error("❌ Error during login process:", error);
        handleError(error);
        showError("로그인 중 오류가 발생했습니다", "다시 시도해주세요.");
        navigate("/", { replace: true });
      }
    } else if (loginError === "true") {
      console.log("❌ Login error detected");
      const displayMessage =
        errorMessage || "로그인에 실패했습니다. 다시 시도해주세요.";
      showError("로그인 실패", displayMessage);
      navigate("/", { replace: true });
    } else {
      console.log("❌ Invalid callback parameters");
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