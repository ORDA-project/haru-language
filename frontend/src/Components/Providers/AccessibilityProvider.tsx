import React, { useEffect } from "react";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

const AccessibilityProvider = ({ children }: AccessibilityProviderProps) => {
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);

  useEffect(() => {
    // 큰 글씨 모드 상태에 따라 CSS 변수 설정
    const root = document.documentElement;

    if (isLargeTextMode) {
      // 큰 글씨 모드 (중년층용): 기본 16px → 18px
      root.style.setProperty("--text-base", "18px");
      root.style.setProperty("--text-sm", "16px");
      root.style.setProperty("--text-lg", "20px");
      root.style.setProperty("--text-xl", "22px");
      root.style.setProperty("--text-2xl", "24px");
      root.style.setProperty("--text-3xl", "28px");
    } else {
      // 기본 모드: 표준 크기
      root.style.setProperty("--text-base", "16px");
      root.style.setProperty("--text-sm", "14px");
      root.style.setProperty("--text-lg", "18px");
      root.style.setProperty("--text-xl", "20px");
      root.style.setProperty("--text-2xl", "24px");
      root.style.setProperty("--text-3xl", "30px");
    }
  }, [isLargeTextMode]);

  return <>{children}</>;
};

export default AccessibilityProvider;



