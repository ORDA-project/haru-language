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

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
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
  (error: AxiosError) => {
    return Promise.reject(handleApiError(error));
  }
);

export const handleApiError = (error: any): CustomError => {
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
        // Clear stored auth data
        localStorage.removeItem('authToken');
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