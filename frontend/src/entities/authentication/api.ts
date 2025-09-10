import { http } from '../../utils/http';
import { AuthCheckResponse } from './types';

export const authApi = {
  checkAuth: (): Promise<AuthCheckResponse> => {
    return http.get('/auth/check');
  },

  logout: (): Promise<string> => {
    return http.get('/auth/logout');
  },

  loginWithGoogle: (code: string): Promise<{ redirectUrl: string }> => {
    return http.get('/auth/google/callback', {
      searchParams: { code }
    });
  },

  loginWithKakao: (code: string): Promise<{ redirectUrl: string }> => {
    return http.get('/auth/kakao/callback', {
      searchParams: { code }
    });
  },
};