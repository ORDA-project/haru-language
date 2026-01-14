import { API_BASE_URL } from '../config/api';

export class HttpError<T = unknown> extends Error {
  readonly status: number;
  readonly data?: T | undefined;
  readonly name = "HttpError";

  constructor(status: number, data?: T | undefined) {
    super(`HTTP Error ${status}`);
    this.status = status;
    this.data = data;
  }
}

export function isHttpError<T = unknown>(e: unknown): e is HttpError<T> {
  return e instanceof HttpError;
}

type HttpRequestMethod = 'get' | 'post' | 'patch' | 'put' | 'delete';

interface HttpRequestOptions {
  json?: unknown;
  formData?: FormData;
  searchParams?: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | undefined>;
}

export class Http {
  async get<T>(path: string, options?: Omit<HttpRequestOptions, 'json'>): Promise<T> {
    return this.request<T>('get', path, options);
  }

  async post<T>(path: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('post', path, options);
  }

  async patch<T>(path: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('patch', path, options);
  }

  async put<T>(path: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('put', path, options);
  }

  async delete<T>(path: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('delete', path, options);
  }

  private async request<T>(method: HttpRequestMethod, path: string, options?: HttpRequestOptions): Promise<T> {
    const url = new URL(path, API_BASE_URL);
    const { searchParams, headers: optionsHeaders = {}, json, formData } = this.parseRequestOptions(options || {});

    // Add search parameters
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => url.searchParams.append(key, v));
        } else {
          url.searchParams.set(key, value);
        }
      }
    });

    // JWT 토큰 가져오기 (없어도 쿠키 인증으로 진행 가능)
    const token = localStorage.getItem("accessToken");

    // 헤더 구성
    const requestHeaders: Record<string, string> = {
      "Accept": "application/json",
      "X-Requested-With": "XMLHttpRequest", // AJAX 요청임을 명시
    };

    // FormData인 경우 Content-Type을 설정하지 않음 (브라우저가 자동으로 boundary 설정)
    if (!formData) {
      requestHeaders["Content-Type"] = "application/json";
    }

    // 옵션에서 전달된 헤더 추가 (FormData인 경우 Content-Type 덮어쓰기 방지)
    Object.entries(optionsHeaders).forEach(([key, value]) => {
      if (value !== undefined) {
        // FormData인 경우 Content-Type은 브라우저가 자동으로 설정하므로 건너뛰기
        if (formData && key.toLowerCase() === "content-type") {
          return;
        }
        requestHeaders[key] = value;
      }
    });

    // 토큰이 있으면 반드시 Authorization 헤더에 추가
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    const requestInit: RequestInit = {
      method: method.toUpperCase(),
      credentials: "include",
      redirect: "error" as RequestRedirect,
      headers: requestHeaders,
    };

    // FormData 우선, 그 다음 json
    if (formData && (method === 'post' || method === 'patch' || method === 'put' || method === 'delete')) {
      requestInit.body = formData;
    } else if (json !== undefined && json !== null && (method === 'post' || method === 'patch' || method === 'put' || method === 'delete')) {
      requestInit.body = JSON.stringify(json);
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), requestInit);
    } catch (error) {
      // 네트워크 오류나 CORS 오류, 리다이렉트 오류 등
      if (error instanceof TypeError && error.message.includes("redirect")) {
        throw new HttpError(0, {
          error: "Redirect Error",
          message: "백엔드가 리다이렉트를 반환했습니다. JSON 응답이 필요합니다.",
        });
      }
      throw new HttpError(0, {
        error: "Network Error",
        message: error instanceof Error ? error.message : "네트워크 오류가 발생했습니다.",
      });
    }

    // 리다이렉트 응답 처리 (백엔드가 JSON을 반환해야 하므로 리다이렉트는 오류)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("Location");
      throw new HttpError(response.status, {
        error: "Unexpected Redirect",
        message: "백엔드가 리다이렉트를 반환했습니다. JSON 응답이 필요합니다.",
        redirectUrl: location,
      });
    }

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        try {
          errorData = await response.text();
        } catch {
          errorData = { message: `HTTP ${response.status} 오류` };
        }
      }
      
      // 401 에러 발생 시 로그인 페이지로 리다이렉트 (로그인 관련 경로 제외)
      if (response.status === 401) {
        const isLoginPath = path.includes('/auth/') || path === '/login' || path === '/';
        if (!isLoginPath) {
          // 토큰 삭제
          localStorage.removeItem("accessToken");
          // 사용자 정보 삭제
          sessionStorage.removeItem("user");
          // 로그인 페이지로 리다이렉트
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        }
      }
      
      throw new HttpError(response.status, errorData);
    }

    try {
      return await response.json();
    } catch (error) {
      throw new HttpError(response.status, {
        error: "Invalid JSON Response",
        message: "서버가 유효한 JSON을 반환하지 않았습니다.",
      });
    }
  }

  private parseRequestOptions(options: HttpRequestOptions) {
    return {
      searchParams: options.searchParams || {},
      headers: options.headers || {},
      json: options.json,
      formData: options.formData,
    };
  }
}

export const http = new Http();