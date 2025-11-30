import { http } from '../../utils/http';
import { AuthCheckResponse } from './types';

export const authApi = {
  checkAuth: (): Promise<AuthCheckResponse> => {
    return http.get('/auth/check');
  },

  logout: (): Promise<string> => {
    return http.get('/auth/logout');
  },

  loginWithGoogle: (code: string): Promise<{ 
    success: boolean;
    token?: string;
    redirectUrl?: string;
    user?: {
      userId: number;
      name: string;
      email?: string;
      socialId: string;
      socialProvider?: string;
      visitCount: number;
      mostVisitedDays: string;
    };
  }> => {
    return http.get('/auth/google/callback', {
      searchParams: { code, format: 'json' }
    });
  },

  loginWithKakao: (code: string): Promise<{ 
    success: boolean;
    token?: string;
    redirectUrl?: string;
    user?: {
      userId: number;
      name: string;
      email?: string;
      socialId: string;
      socialProvider?: string;
      visitCount: number;
      mostVisitedDays: string;
    };
  }> => {
    return http.get('/auth/kakao/callback', {
      searchParams: { code, format: 'json' }
    });
  },
};