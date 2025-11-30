import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import { useNavigate, useSearchParams } from "react-router-dom";
import { userAtom } from "../../store/authStore";
import { useRespondInvitation } from "../../entities/friends/queries";
import { useErrorHandler } from "../../hooks/useErrorHandler";

type InviteStatus = "idle" | "processing" | "login" | "success" | "error";

const readPendingToken = () => {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("pendingFriendInvitationToken") || "";
};

const FriendInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [user] = useAtom(userAtom);
  const { handleError, showSuccess, showError } = useErrorHandler();
  const respondInvitation = useRespondInvitation();
  const navigate = useNavigate();

  const [pendingToken, setPendingToken] = useState(() => readPendingToken());
  const [status, setStatus] = useState<InviteStatus>("idle");
  const [message, setMessage] = useState<string>("친구 초대 정보를 확인하는 중입니다.");
  const processedTokenRef = useRef<string | null>(null);

  const urlToken = searchParams.get("token")?.trim() || "";
  const responseParam = searchParams.get("response") === "decline" ? "decline" : "accept";

  const storePendingToken = useCallback((token: string | null) => {
    if (typeof window === "undefined") {
      return;
    }
    if (token) {
      sessionStorage.setItem("pendingFriendInvitationToken", token);
      setPendingToken(token);
    } else {
      sessionStorage.removeItem("pendingFriendInvitationToken");
      setPendingToken("");
    }
  }, []);

  useEffect(() => {
    if (urlToken) {
      storePendingToken(urlToken);
      processedTokenRef.current = null;
    }
  }, [urlToken, storePendingToken]);

  const effectiveToken = useMemo(() => urlToken || pendingToken, [urlToken, pendingToken]);

  const acceptInvitation = useCallback(
    async (token: string) => {
      setStatus("processing");
      setMessage("친구 초대를 확인하고 있어요...");
      try {
        await respondInvitation.mutateAsync({
          token,
          response: responseParam,
        });
        storePendingToken(null);
        setStatus("success");
        setMessage("친구와 성공적으로 연결되었습니다!");
        showSuccess("친구 연결 완료", "함께 학습을 시작해보세요.");
      } catch (error) {
        // 409 Conflict (이미 친구인 경우)는 성공으로 처리
        const httpError = error as any;
        if (httpError?.status === 409 && httpError?.data?.message?.includes("이미 친구")) {
          storePendingToken(null);
          setStatus("success");
          setMessage("이미 친구입니다.");
          showSuccess("친구 확인", "이미 친구로 등록되어 있습니다.");
          return;
        }
        
        handleError(error);
        setStatus("error");
        const errorMessage =
          (error as any)?.data?.message ||
          (error as Error)?.message ||
          "초대 링크를 처리하는 중 오류가 발생했습니다.";
        setMessage(errorMessage);
        showError("친구 연결 실패", "링크가 만료되었거나 다시 시도가 필요합니다.");
      }
    },
    [respondInvitation, responseParam, handleError, showSuccess, showError, storePendingToken]
  );

  useEffect(() => {
    if (!effectiveToken) {
      setStatus("error");
      setMessage("유효하지 않은 초대 링크입니다.");
      processedTokenRef.current = null;
      return;
    }

    // 토큰이 localStorage에 있으면 로그인된 것으로 간주 (user atom보다 우선)
    const hasToken = typeof window !== "undefined" && !!localStorage.getItem("accessToken");
    
    if (!user && !hasToken) {
      setStatus("login");
      setMessage("친구 연결을 완료하려면 먼저 로그인해주세요.");
      processedTokenRef.current = null;
      return;
    }

    if (processedTokenRef.current === effectiveToken) {
      return;
    }

    // user atom이 설정되었거나 토큰이 있으면 API 호출
    // (로그인 직후 user atom이 아직 업데이트되지 않았을 수 있으므로 토큰도 확인)
    processedTokenRef.current = effectiveToken;
    acceptInvitation(effectiveToken);
  }, [effectiveToken, user, acceptInvitation]);

  const handleGoLogin = () => {
    if (effectiveToken) {
      storePendingToken(effectiveToken);
    }
    navigate("/", { replace: false });
  };

  const handleGoHome = () => {
    navigate("/home", { replace: true });
  };

  const handleRetry = () => {
    if (!effectiveToken) {
      setStatus("error");
      setMessage("다시 시도할 유효한 초대 토큰이 없습니다.");
      return;
    }
    processedTokenRef.current = null;
    acceptInvitation(effectiveToken);
  };

  const renderActionButton = () => {
    if (status === "login") {
      return (
        <button
          onClick={handleGoLogin}
          className="w-full py-3 bg-[#00DAAA] hover:bg-[#00C495] text-white rounded-xl font-semibold transition-colors"
        >
          로그인하러 가기
        </button>
      );
    }

    if (status === "success") {
      return (
        <button
          onClick={handleGoHome}
          className="w-full py-3 bg-[#00DAAA] hover:bg-[#00C495] text-white rounded-xl font-semibold transition-colors"
        >
          홈으로 이동
        </button>
      );
    }

    if (status === "error") {
      return (
        <div className="w-full flex flex-col gap-2">
          <button
            onClick={handleRetry}
            className="w-full py-3 bg-[#00DAAA] hover:bg-[#00C495] text-white rounded-xl font-semibold transition-colors"
          >
            다시 시도하기
          </button>
          <button
            onClick={handleGoHome}
            className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#00DAAA] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">잠시만 기다려주세요...</p>
      </div>
    );
  };

  return (
    <div className="w-full h-screen flex flex-col items-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#ecfffb]">
      <div className="flex-1 w-full px-4 flex items-center justify-center">
        <div className="w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-[#00DAAA]/10 text-[#00B893] rounded-full flex items-center justify-center text-2xl font-bold">
              🤝
            </div>
            <h1 className="text-2xl font-bold text-gray-900">친구 초대 링크</h1>
          </div>
          <p className="text-gray-600 leading-relaxed">{message}</p>
          {renderActionButton()}
        </div>
      </div>
    </div>
  );
};

export default FriendInvite;


