import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../config/api';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  data?: any;
}

export class CustomError extends Error {
  public code?: string;
  public status?: number;
  public data?: any;

  constructor(message: string, code?: string, status?: number, data?: any) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.status = status;
    this.data = data;
  }
}

// Create axios instance with interceptors
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 리프레시 토큰 갱신 플래그 (중복 요청 방지)
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// 리프레시 토큰으로 액세스 토큰 갱신
const refreshAccessToken = async (): Promise<string | null> => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.token) {
        localStorage.setItem("accessToken", data.token);
        return data.token;
      }
      return null;
    } catch (error) {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(handleApiError(error));
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // 401 에러이고 리프레시 엔드포인트가 아닌 경우에만 갱신 시도
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;

      const newToken = await refreshAccessToken();
      
      if (newToken) {
        // 새 토큰으로 재시도
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } else {
        // 리프레시 실패 시 로그아웃 처리 (기존 동작 유지)
        localStorage.removeItem('accessToken');
        sessionStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    }

    return Promise.reject(handleApiError(error));
  }
);

export const handleApiError = (error: any): CustomError => {
  // Handle HttpError from http.ts
  if (error && typeof error === 'object' && error.name === 'HttpError') {
    const httpError = error as { status: number; data?: any; message?: string };
    const status = httpError.status || 0;
    const data = httpError.data;
    
    let message = '알 수 없는 오류가 발생했습니다.';
    let code = 'UNKNOWN_ERROR';
    
    if (data && typeof data === 'object') {
      message = data.message || data.error || httpError.message || message;
      code = data.code || `HTTP_${status}`;
    } else if (httpError.message) {
      message = httpError.message;
    }
    
    // Handle specific status codes
    if (status === 0) {
      message = data?.message || '네트워크 연결을 확인해주세요.';
      code = 'NETWORK_ERROR';
    } else {
      switch (status) {
        case 400:
          message = message || '잘못된 요청입니다.';
          code = 'BAD_REQUEST';
          break;
        case 401:
          message = '인증이 필요합니다. 다시 로그인해주세요.';
          code = 'UNAUTHORIZED';
          // 보안: 401 에러가 발생해도 즉시 로그아웃하지 않음 (토큰 만료 등 일시적 오류일 수 있음)
          // 단, 명시적으로 로그아웃이 필요한 경우에만 토큰 삭제
          // localStorage.removeItem('accessToken');
          // window.location.href = '/';
          break;
        case 403:
          message = '접근 권한이 없습니다.';
          code = 'FORBIDDEN';
          break;
        case 404:
          message = '요청한 리소스를 찾을 수 없습니다.';
          code = 'NOT_FOUND';
          break;
        case 429:
          message = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
          code = 'TOO_MANY_REQUESTS';
          break;
        case 500:
          message = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
          code = 'INTERNAL_SERVER_ERROR';
          break;
        case 502:
        case 503:
        case 504:
          message = '서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
          code = 'SERVER_UNAVAILABLE';
          break;
      }
    }
    
    return new CustomError(message, code, status, data);
  }
  
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    // Network error
    if (!axiosError.response) {
      return new CustomError(
        '네트워크 연결을 확인해주세요.',
        'NETWORK_ERROR',
        0,
        { originalError: axiosError }
      );
    }

    const { status, data } = axiosError.response;
    
    // Extract error message from response
    let message = '알 수 없는 오류가 발생했습니다.';
    let code = 'UNKNOWN_ERROR';
    
    if (data && typeof data === 'object') {
      message = (data as any).message || (data as any).error || message;
      code = (data as any).code || `HTTP_${status}`;
    }

    // Handle specific status codes
    switch (status) {
      case 400:
        message = message || '잘못된 요청입니다.';
        code = 'BAD_REQUEST';
        break;
      case 401:
        message = '인증이 필요합니다. 다시 로그인해주세요.';
        code = 'UNAUTHORIZED';
        // 보안: 401 에러가 발생해도 즉시 로그아웃하지 않음 (토큰 만료 등 일시적 오류일 수 있음)
        // 단, 명시적으로 로그아웃이 필요한 경우에만 토큰 삭제
        // localStorage.removeItem('accessToken');
        // window.location.href = '/';
        break;
      case 403:
        message = '접근 권한이 없습니다.';
        code = 'FORBIDDEN';
        break;
      case 404:
        message = '요청한 리소스를 찾을 수 없습니다.';
        code = 'NOT_FOUND';
        break;
      case 429:
        message = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
        code = 'TOO_MANY_REQUESTS';
        break;
      case 500:
        message = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        code = 'INTERNAL_SERVER_ERROR';
        break;
      case 502:
      case 503:
      case 504:
        message = '서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
        code = 'SERVER_UNAVAILABLE';
        break;
    }

    return new CustomError(message, code, status, data);
  }

  // Handle non-Axios errors
  if (error instanceof Error) {
    return new CustomError(
      error.message || '예상치 못한 오류가 발생했습니다.',
      'GENERAL_ERROR',
      undefined,
      { originalError: error }
    );
  }

  // Handle string errors
  if (typeof error === 'string') {
    return new CustomError(error, 'STRING_ERROR');
  }

  // Handle unknown errors
  return new CustomError(
    '알 수 없는 오류가 발생했습니다.',
    'UNKNOWN_ERROR',
    undefined,
    { originalError: error }
  );
};

// Utility function to check if error is retriable
export const isRetriableError = (error: CustomError): boolean => {
  if (!error.status) return false;
  
  // Network errors and server errors are retriable
  return error.status >= 500 || error.status === 0 || error.code === 'NETWORK_ERROR';
};

// Utility function to get user-friendly error message
export const getUserFriendlyErrorMessage = (error: CustomError): string => {
  // Return the error message as it's already user-friendly
  return error.message;
};

// Retry utility
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: CustomError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof CustomError ? error : handleApiError(error);
      
      // Don't retry if error is not retriable or we've reached max retries
      if (!isRetriableError(lastError) || i === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  
  throw lastError!;
};