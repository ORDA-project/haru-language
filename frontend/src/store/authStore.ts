import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { API_ENDPOINTS } from "../config/api";

// 사용자 타입 정의
interface User {
  name: string;
  email?: string | null;
  userId?: number;
  socialId?: string | null;
  visitCount?: number;
  mostVisitedDays?: string | null;
  isOnboarded?: boolean;
}

// sessionStorage를 사용하는 storage 생성
const storage = createJSONStorage<User | null>(() => sessionStorage);

// 사용자 정보를 sessionStorage에 저장하는 atom
export const userAtom = atomWithStorage<User | null>("user", null, storage);

// 로그인 상태를 파생 atom으로 계산
export const isLoggedInAtom = atom((get) => {
  const user = get(userAtom);
  return user !== null;
});

// 사용자 정보를 설정하는 함수 (atomWithStorage가 자동으로 sessionStorage 처리)
export const setUserAtom = atom(null, (_get, set, user: User | null) => {
  set(userAtom, user);
});

// 로그아웃 함수
export const logoutAtom = atom(null, (get, set) => {
  set(userAtom, null);
});

// 온보딩 완료 상태 확인
export const isOnboardedAtom = atom((get) => {
  const user = get(userAtom);
  return user?.isOnboarded || false;
});

// 온보딩 완료 설정
export const setOnboardedAtom = atom(null, (get, set) => {
  const user = get(userAtom);
  if (user) {
    set(userAtom, { ...user, isOnboarded: true });
  }
});

// 사용자 온보딩 상태 확인 함수 (API 호출)
export const checkUserOnboardingAtom = atom(null, async (get, set) => {
  const user = get(userAtom);
  if (!user) return false;

  try {
    const response = await fetch(`${API_ENDPOINTS.userDetails}/info`, {
      method: "GET",
      credentials: "include", // 세션 쿠키 포함
    });

    if (response.ok) {
      // 사용자 정보가 존재하면 온보딩 완료된 것으로 간주
      const userData = await response.json();
      if (userData && (userData.gender || userData.goal)) {
        set(userAtom, { ...user, isOnboarded: true });
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error checking user onboarding:", error);
    return false;
  }
});
