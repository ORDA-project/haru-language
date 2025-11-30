import React, { useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAtom } from "jotai";
import { setUserAtom } from "../../store/authStore";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { API_ENDPOINTS } from "../../config/api";
import { authApi } from "../../entities/authentication/api";

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [, setUserData] = useAtom(setUserAtom);
  const { showSuccess, showError, handleError } = useErrorHandler();
  const isProcessingRef = useRef(false); // 중복 요청 방지

  const redirectToPendingInvite = useCallback(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const pendingToken = sessionStorage.getItem("pendingFriendInvitationToken");
    if (pendingToken) {
      navigate(`/invite?token=${pendingToken}`, { replace: true });
      return true;
    }
    return false;
  }, [navigate]);

  useEffect(() => {
    // 이미 처리 중이면 무시
    if (isProcessingRef.current) {
      return;
    }

    const code = searchParams.get("code");
    
    // 보안: URL에서 사용자 정보 제거 (세션에서 가져오도록 변경)
    // 기존 파라미터는 하위 호환성을 위해 유지하되, 우선순위는 낮춤
    const loginSuccess = searchParams.get("loginSuccess");
    const loginError = searchParams.get("loginError");
    const errorMessage = searchParams.get("errorMessage");
    const userName = searchParams.get("userName");
    
    // 보안: URL에서 민감한 정보 제거
    if (loginSuccess || loginError || userName || errorMessage) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("loginSuccess");
      newUrl.searchParams.delete("loginError");
      newUrl.searchParams.delete("errorMessage");
      newUrl.searchParams.delete("userName");
      window.history.replaceState({}, "", newUrl.toString());
    }

    const hydrateUserFromToken = async () => {
      const response = await fetch(`${API_ENDPOINTS.auth}/check`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });

      if (!response.ok) {
        throw new Error("토큰 정보를 확인할 수 없습니다.");
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
        socialProvider: data.user.social_provider || data.user.socialProvider || null,
        visitCount: data.user.visitCount,
        mostVisitedDays: data.user.mostVisitedDays,
      });
    };

    const handleSuccess = async () => {
      try {
        await hydrateUserFromToken();
        showSuccess("로그인 성공", `${userName || "사용자"}님 환영합니다!`);
        if (redirectToPendingInvite()) {
          return;
        }
        navigate("/home", { replace: true });
      } catch (error) {
        handleError(error);
        showError(
          "로그인 정보 동기화 실패",
          "토큰 정보를 불러오지 못했습니다. 다시 시도해주세요."
        );
        navigate("/", { replace: true });
      }
    };

    const handleOAuthCallback = async () => {
      if (!code) {
        showError("로그인 오류", "인증 코드가 없습니다.");
        navigate("/", { replace: true });
        return;
      }

      // 중복 요청 방지
      if (isProcessingRef.current) {
        return;
      }

      isProcessingRef.current = true;

      try {
        // 보안: 코드를 사용하기 전에 URL에서 제거 (중복 사용 방지)
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("code");
        window.history.replaceState({}, "", newUrl.toString());

        // 현재 경로에서 구글인지 카카오인지 확인
        const isGoogle = window.location.pathname.includes("/google");
        const response = isGoogle
          ? await authApi.loginWithGoogle(code)
          : await authApi.loginWithKakao(code);

        // JWT 토큰 저장
        if (response.token) {
          localStorage.setItem("accessToken", response.token);
        }

        // 사용자 정보 설정
        if (response.user) {
          setUserData({
            name: response.user.name,
            email: response.user.email || null,
            userId: response.user.userId,
            socialId: response.user.socialId,
            socialProvider:
              response.user.socialProvider ||
              (isGoogle ? "google" : "kakao"),
            visitCount: response.user.visitCount,
            mostVisitedDays: response.user.mostVisitedDays || null,
          });
        }

        // redirectUrl이 있으면 해당 경로로 이동, 없으면 /home으로 이동
        // redirectUrl은 백엔드에서 프론트엔드 URL을 포함하여 반환할 수 있으므로 경로만 추출
        if (redirectToPendingInvite()) {
          showSuccess("로그인 성공", "로그인에 성공했습니다!");
          return;
        }
        
        showSuccess("로그인 성공", "로그인에 성공했습니다!");
        
        // redirectUrl이 있으면 경로만 추출하여 사용, 없으면 /home으로 이동
        let targetPath = "/home";
        if (response.redirectUrl) {
          try {
            // 전체 URL이면 경로만 추출, 이미 경로면 그대로 사용
            const url = new URL(response.redirectUrl, window.location.origin);
            targetPath = url.pathname + url.search;
          } catch {
            // URL 파싱 실패 시 경로로 간주
            targetPath = response.redirectUrl.startsWith("/") 
              ? response.redirectUrl 
              : `/${response.redirectUrl}`;
          }
        }
        
        navigate(targetPath, { replace: true });
      } catch (error) {
        handleError(error);
        const errorMessage = (error as any)?.data?.error || (error as any)?.message || "로그인 처리 중 오류가 발생했습니다.";
        showError("로그인 실패", errorMessage);
        navigate("/", { replace: true });
      } finally {
        isProcessingRef.current = false;
      }
    };

    // OAuth 콜백 코드가 있는 경우 (프론트엔드로 직접 콜백된 경우)
    if (code) {
      handleOAuthCallback();
      return;
    }

    // 백엔드에서 리다이렉트된 경우 (loginSuccess/loginError 파라미터 사용)
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
  }, [searchParams, setUserData, navigate, showSuccess, showError, handleError, redirectToPendingInvite]);

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