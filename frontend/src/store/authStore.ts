import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

// 사용자 타입 정의
interface User {
  name: string;
  email?: string;
  id?: string;
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
export const setUserAtom = atom(null, (get, set, user: User | null) => {
  console.log("=== setUserAtom called ===");
  console.log("Setting user:", user);

  set(userAtom, user);

  // atomWithStorage가 자동으로 sessionStorage에 저장하지만 확인용 로그
  setTimeout(() => {
    console.log("After set - userAtom:", get(userAtom));
    console.log("After set - sessionStorage:", sessionStorage.getItem("user"));
  }, 0);
});

// 로그아웃 함수
export const logoutAtom = atom(null, (get, set) => {
  set(userAtom, null);
});
