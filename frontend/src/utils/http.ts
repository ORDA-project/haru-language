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
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

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

  /**
   * 리프레시 토큰으로 액세스 토큰 갱신
   * 리프레시 토큰이 없거나 갱신 실패 시 null 반환 (기존 동작 유지)
   */
  private async refreshAccessToken(): Promise<string | null> {
    // 이미 갱신 중이면 기존 Promise 반환
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
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
          // 리프레시 토큰이 없거나 만료된 경우 (기존 사용자 호환성 유지)
          // 쿠키 인증으로 계속 시도할 수 있으므로 null만 반환
          return null;
        }

        const data = await response.json();
        if (data.token) {
          localStorage.setItem("accessToken", data.token);
          return data.token;
        }
        return null;
      } catch (error) {
        // 네트워크 오류 등 - 기존 동작 유지
        return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
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

    // 사용자별 동적 API에서 304/캐시로 인한 상태 꼬임(예: 채팅 초기 인사 중복)을 막기 위해
    // GET 요청은 기본적으로 캐시를 우회하도록 설정
    if (method === "get") {
      requestHeaders["Cache-Control"] = "no-cache";
      requestHeaders["Pragma"] = "no-cache";
    }

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
      
      // 401 에러 발생 시 리프레시 토큰으로 자동 갱신 시도
      if (response.status === 401) {
        const isLoginPath = path.includes('/auth/') || path === '/login' || path === '/';
        const isRefreshPath = path.includes('/auth/refresh');
        
        // 리프레시 엔드포인트가 아니고, 로그인 관련 경로가 아닌 경우에만 갱신 시도
        if (!isLoginPath && !isRefreshPath) {
          const newToken = await this.refreshAccessToken();
          
          if (newToken) {
            // 새 토큰으로 원래 요청 재시도
            requestHeaders["Authorization"] = `Bearer ${newToken}`;
            
            const retryResponse = await fetch(url.toString(), {
              ...requestInit,
              headers: requestHeaders,
            });
            
            if (retryResponse.ok) {
              try {
                return await retryResponse.json();
              } catch (error) {
                throw new HttpError(retryResponse.status, {
                  error: "Invalid JSON Response",
                  message: "서버가 유효한 JSON을 반환하지 않았습니다.",
                });
              }
            }
            
            // 재시도도 실패한 경우 로그아웃 처리
            localStorage.removeItem("accessToken");
            sessionStorage.removeItem("user");
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          } else {
            // 리프레시 토큰이 없거나 갱신 실패한 경우
            // 기존 사용자 호환성을 위해 쿠키 인증으로 계속 시도할 수 있지만,
            // 이미 401 에러가 발생했으므로 로그아웃 처리 (기존 동작 유지)
            localStorage.removeItem("accessToken");
            sessionStorage.removeItem("user");
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          }
        } else if (!isRefreshPath) {
          // 로그인 관련 경로가 아닌 경우에만 토큰 삭제
          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("user");
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