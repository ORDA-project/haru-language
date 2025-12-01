import React, { useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAtom } from "jotai";
import { setUserAtom } from "../../store/authStore";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { API_ENDPOINTS } from "../../config/api";
import { authApi } from "../../entities/authentication/api";
import { http } from "../../utils/http";

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
    
    const processAuth = async () => {
    const code = searchParams.get("code");
    const token = searchParams.get("token");
    const loginSuccess = searchParams.get("loginSuccess");
    const loginError = searchParams.get("loginError");
    const errorMessage = searchParams.get("errorMessage");
    const userName = searchParams.get("userName");
    
    if (loginSuccess || loginError || userName || errorMessage) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("loginSuccess");
      newUrl.searchParams.delete("loginError");
      newUrl.searchParams.delete("errorMessage");
      newUrl.searchParams.delete("userName");
      window.history.replaceState({}, "", newUrl.toString());
    }

    const hydrateUserFromToken = async (retryCount = 0) => {
      const maxRetries = 5;
      const retryDelay = retryCount === 0 ? 1000 : 500;

      try {
        const data = await http.get<{
          isLoggedIn: boolean;
          user: {
            userId: number;
            name: string;
            email: string;
            social_id: string;
            social_provider: string | null;
            visitCount: number;
            mostVisitedDays: string | null;
          } | null;
          token: string | null;
        }>("/auth/check");
        
        if (!data?.isLoggedIn || !data?.user) {
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return hydrateUserFromToken(retryCount + 1);
          }
          throw new Error("로그인 정보가 존재하지 않습니다.");
        }

        // 토큰 저장 (localStorage와 쿠키 모두 활용)
        if (data.token) {
          try {
            localStorage.setItem("accessToken", data.token);
          } catch (error) {
            // localStorage 저장 실패는 치명적이지 않음 (쿠키 인증 사용)
          }
        }

        // 사용자 정보를 atom에 저장
        setUserData({
          name: data.user.name,
          email: data.user.email,
          userId: data.user.userId,
          socialId: data.user.social_id,
          socialProvider: data.user.social_provider || null,
          visitCount: data.user.visitCount || 0,
          mostVisitedDays: data.user.mostVisitedDays || null,
        });
        
        // atom 업데이트가 완료되도록 충분한 시간 대기 (React 상태 업데이트 + atom 업데이트)
        // sessionStorage에 저장되는 시간까지 고려하여 대기 시간 증가
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return hydrateUserFromToken(retryCount + 1);
        }
        throw error;
      }
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

      if (isProcessingRef.current) {
        return;
      }

      isProcessingRef.current = true;

      try {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("code");
        window.history.replaceState({}, "", newUrl.toString());

        const isGoogle = window.location.pathname.includes("/google");
        const response = isGoogle
          ? await authApi.loginWithGoogle(code)
          : await authApi.loginWithKakao(code);

        if (!response.success) {
          const errorMsg = (response as any).error || "로그인에 실패했습니다.";
          showError("로그인 실패", errorMsg);
          navigate("/", { replace: true });
          return;
        }

        if (response.token) {
          try {
            localStorage.setItem("accessToken", response.token);
          } catch (storageError) {
            // localStorage 저장 실패 시 쿠키 인증으로 계속 진행
          }
        } else {
          showError("로그인 오류", "토큰을 받지 못했습니다. 다시 시도해주세요.");
          navigate("/", { replace: true });
          return;
        }

        if (response.user) {
          try {
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
          } catch (userError) {
            // 사용자 정보 설정 실패는 치명적이지 않을 수 있음
          }
        }

        // atom 업데이트가 완료되도록 충분한 시간 대기
        // sessionStorage에 저장되는 시간까지 고려하여 대기 시간 증가
        await new Promise(resolve => setTimeout(resolve, 300));

        if (redirectToPendingInvite()) {
          showSuccess("로그인 성공", "로그인에 성공했습니다!");
          return;
        }
        
        showSuccess("로그인 성공", "로그인에 성공했습니다!");
        
        let targetPath = "/home";
        if (response.redirectUrl) {
          try {
            const url = new URL(response.redirectUrl, window.location.origin);
            targetPath = url.pathname + url.search;
          } catch {
            targetPath = response.redirectUrl.startsWith("/") 
              ? response.redirectUrl 
              : `/${response.redirectUrl}`;
          }
        }
        
        // 사용자 정보가 완전히 로드될 때까지 추가 대기 후 이동
        await new Promise(resolve => setTimeout(resolve, 200));
        navigate(targetPath, { replace: true });
      } catch (error) {
        handleError(error);
        
        let errorMessage = "로그인 처리 중 오류가 발생했습니다.";
        if ((error as any)?.status === 0) {
          errorMessage = "서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.";
        } else if ((error as any)?.status === 401) {
          errorMessage = "인증에 실패했습니다. 다시 시도해주세요.";
        } else if ((error as any)?.status === 500) {
          errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        } else if ((error as any)?.data?.error) {
          errorMessage = (error as any).data.error;
        } else if ((error as any)?.data?.message) {
          errorMessage = (error as any).data.message;
        } else if ((error as any)?.message) {
          errorMessage = (error as any).message;
        }
        
        showError("로그인 실패", errorMessage);
        navigate("/", { replace: true });
      } finally {
        isProcessingRef.current = false;
      }
    };

    if (code) {
      handleOAuthCallback();
      return;
    }

    if (token) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("token");
      window.history.replaceState({}, "", newUrl.toString());
      
      try {
        localStorage.setItem("accessToken", token);
        await hydrateUserFromToken();
        
        // 사용자 정보가 완전히 로드될 때까지 추가 대기
        await new Promise(resolve => setTimeout(resolve, 300));
        
        showSuccess("로그인 성공", "로그인에 성공했습니다!");
        if (redirectToPendingInvite()) {
          return;
        }
        navigate("/home", { replace: true });
        return;
      } catch (error) {
        handleError(error);
        showError("로그인 오류", "로그인 정보를 확인할 수 없습니다. 다시 시도해주세요.");
        navigate("/", { replace: true });
        return;
      }
    }

    try {
      await hydrateUserFromToken();
      
      // 사용자 정보가 완전히 로드될 때까지 추가 대기
      await new Promise(resolve => setTimeout(resolve, 300));
      
      showSuccess("로그인 성공", "로그인에 성공했습니다!");
      if (redirectToPendingInvite()) {
        return;
      }
      navigate("/home", { replace: true });
    } catch (error) {
      if (loginSuccess === "true") {
        await handleSuccess();
      } else if (loginError === "true") {
        const displayMessage = errorMessage || "로그인에 실패했습니다. 다시 시도해주세요.";
        showError("로그인 실패", displayMessage);
        navigate("/", { replace: true });
      } else {
        handleError(error);
        showError("로그인 오류", "로그인 정보를 확인할 수 없습니다. 다시 시도해주세요.");
        navigate("/", { replace: true });
      }
    }
    };
    
    processAuth();
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