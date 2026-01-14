import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { userAtom } from "../../store/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 보호된 라우트 컴포넌트
 * 로그인하지 않은 사용자를 로그인 페이지로 리다이렉트합니다.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const [user] = useAtom(userAtom);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    
    // user가 없거나 userId가 없고 토큰도 없으면 로그인 페이지로 리다이렉트
    if ((!user || !user.userId) && !token) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // 로그인하지 않은 경우 아무것도 렌더링하지 않음 (리다이렉트 중)
  const token = localStorage.getItem("accessToken");
  if ((!user || !user.userId) && !token) {
    return null;
  }

  return <>{children}</>;
};

