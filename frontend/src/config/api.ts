export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const API_ENDPOINTS = {
  auth: `${API_BASE_URL}/auth`,
  home: `${API_BASE_URL}/home`,
  userDetails: `${API_BASE_URL}/userDetails`,
  songLyric: `${API_BASE_URL}/songLyric`,
  songYoutube: `${API_BASE_URL}/songYoutube`,
  friends: `${API_BASE_URL}/friends`,
  example: `${API_BASE_URL}/example`,
  question: `${API_BASE_URL}/question`,
  writing: `${API_BASE_URL}/writing`,
  tts: `${API_BASE_URL}/api/tts`,
} as const;