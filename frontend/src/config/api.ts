// 프로덕션 환경에서는 VITE_API_BASE_URL이 반드시 설정되어야 함
const getApiBaseUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (!apiUrl) {
    if (import.meta.env.PROD) {
      throw new Error(
        "VITE_API_BASE_URL 환경 변수가 설정되지 않았습니다. 프로덕션 배포를 위해 환경 변수를 설정해주세요."
      );
    }
    // 개발 환경에서만 localhost fallback 허용
    console.warn(
      "VITE_API_BASE_URL이 설정되지 않아 localhost를 사용합니다. 프로덕션 배포 전에 환경 변수를 설정해주세요."
    );
    return "http://localhost:8000";
  }
  
  return apiUrl;
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  auth: `${API_BASE_URL}/auth`,
  home: `${API_BASE_URL}/home`,
  userDetails: `${API_BASE_URL}/userDetails`,
  songLyric: `${API_BASE_URL}/songLyric`,
  songYoutube: `${API_BASE_URL}/songYoutube`,
  friends: `${API_BASE_URL}/friends`,
  example: `${API_BASE_URL}/example`,
  question: `${API_BASE_URL}/question`,
  quiz: `${API_BASE_URL}/quiz`,
  writing: `${API_BASE_URL}/writing`,
  tts: `${API_BASE_URL}/api/tts`,
} as const;
