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
    const { searchParams, headers = {}, json } = this.parseRequestOptions(options || {});

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

    const requestInit: RequestInit = {
      method: method.toUpperCase(),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    if (json && (method === 'post' || method === 'patch' || method === 'put')) {
      requestInit.body = JSON.stringify(json);
    }

    const response = await fetch(url.toString(), requestInit);

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      throw new HttpError(response.status, errorData);
    }

    try {
      return await response.json();
    } catch {
      return undefined as T;
    }
  }

  private parseRequestOptions(options: HttpRequestOptions) {
    return {
      searchParams: options.searchParams || {},
      headers: options.headers || {},
      json: options.json,
    };
  }
}

export const http = new Http();