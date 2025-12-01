import {
  useQuery as useTanstackQuery,
  useMutation as useTanstackMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { http } from "../utils/http";
import { useErrorHandler } from "./useErrorHandler";

interface UseQueryOptions<T> {
  queryKey: (string | number | boolean | null | undefined)[];
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number | false;
  retry?: number | boolean;
  showErrorToast?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export const useQuery = <T>(
  fetchFn: () => Promise<T>,
  options: UseQueryOptions<T>
) => {
  const { handleError } = useErrorHandler();

  // 보안: 404 에러는 재시도하지 않음 (무한 재시도 방지)
  const shouldRetry = (failureCount: number, error: Error) => {
    // 404는 재시도하지 않음
    if (error instanceof Error && error.message.includes("404")) {
      return false;
    }
    // retry 옵션이 false면 재시도 안함
    if (options.retry === false) {
      return false;
    }
    // retry 옵션이 숫자면 그만큼만 재시도
    if (typeof options.retry === "number") {
      return failureCount < options.retry;
    }
    // 기본값: 최대 1번만 재시도
    return failureCount < 1;
  };

  const query = useTanstackQuery<T, Error>({
    queryKey: options.queryKey,
    queryFn: fetchFn,
    enabled: options.enabled,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 기본 5분
    gcTime: options.gcTime ?? 10 * 60 * 1000, // 기본 10분
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false, // 기본값: false
    refetchOnMount: options.refetchOnMount ?? true,
    refetchInterval: options.refetchInterval,
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 지수 백오프
  });

  // onSuccess 처리
  useEffect(() => {
    if (query.isSuccess && query.data && options.onSuccess) {
      options.onSuccess(query.data);
    }
  }, [query.isSuccess, query.data, options.onSuccess]);

  // onError 처리
  useEffect(() => {
    if (query.isError && query.error) {
      if (options.showErrorToast !== false) {
        handleError(query.error, true);
      }
      options.onError?.(query.error);
    }
  }, [
    query.isError,
    query.error,
    options.showErrorToast,
    options.onError,
    handleError,
  ]);

  return query;
};

export const useGetQuery = <T>(
  path: string,
  options?: Omit<UseQueryOptions<T>, "queryKey"> & {
    queryKey?: (string | number | boolean | null | undefined)[];
    searchParams?: Record<string, string | string[] | undefined>;
    headers?: Record<string, string | undefined>;
  }
) => {
  const queryKey =
    options?.queryKey ||
    ([path, options?.searchParams] as (
      | string
      | number
      | boolean
      | null
      | undefined
    )[]);

  return useQuery<T>(
    () =>
      http.get<T>(path, {
        searchParams: options?.searchParams,
        headers: options?.headers,
      }),
    {
      queryKey,
      ...options,
    }
  );
};

interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables
  ) => void;
  showErrorToast?: boolean | ((error: Error) => boolean);
  showSuccessMessage?: string;
  invalidateQueries?: (string | number | boolean | null | undefined)[][];
}

export const useMutation = <TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TVariables>
) => {
  const { handleError, showSuccess } = useErrorHandler();
  const queryClient = useQueryClient();

  const mutation = useTanstackMutation<TData, Error, TVariables>({
    mutationFn,
  });

  // onSuccess 처리
  useEffect(() => {
    if (mutation.isSuccess && mutation.data) {
      if (options?.showSuccessMessage) {
        showSuccess(options.showSuccessMessage);
      }

      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      // variables가 undefined일 수 있으므로 옵셔널 체이닝 사용
      options?.onSuccess?.(mutation.data, mutation.variables as TVariables);
    }
  }, [
    mutation.isSuccess,
    mutation.data,
    mutation.variables,
    options,
    showSuccess,
    queryClient,
  ]);

  // onError 처리
  useEffect(() => {
    if (mutation.isError && mutation.error) {
      // showErrorToast가 함수인 경우 함수 결과를 사용, 아니면 boolean 값 사용
      const shouldShowError = typeof options?.showErrorToast === 'function' 
        ? options.showErrorToast(mutation.error)
        : options?.showErrorToast !== false;
      
      if (shouldShowError) {
        handleError(mutation.error, true);
      }
      // variables가 undefined일 수 있으므로 옵셔널 체이닝 사용
      options?.onError?.(mutation.error, mutation.variables as TVariables);
    }
  }, [
    mutation.isError,
    mutation.error,
    mutation.variables,
    options,
    handleError,
  ]);

  // onSettled 처리
  useEffect(() => {
    if (mutation.isSuccess || mutation.isError) {
      // variables가 undefined일 수 있으므로 옵셔널 체이닝 사용
      options?.onSettled?.(mutation.data, mutation.error, mutation.variables as TVariables);
    }
  }, [
    mutation.isSuccess,
    mutation.isError,
    mutation.data,
    mutation.error,
    mutation.variables,
    options,
  ]);

  return mutation;
};

export const usePostMutation = <TData = unknown, TVariables = unknown>(
  path: string,
  options?: UseMutationOptions<TData, TVariables> & {
    headers?: Record<string, string | undefined>;
  }
) => {
  return useMutation<TData, TVariables>(
    (variables) =>
      http.post<TData>(path, {
        json: variables,
        headers: options?.headers,
      }),
    options
  );
};

export const usePatchMutation = <TData = unknown, TVariables = unknown>(
  path: string,
  options?: UseMutationOptions<TData, TVariables> & {
    headers?: Record<string, string | undefined>;
  }
) => {
  return useMutation<TData, TVariables>(
    (variables) =>
      http.patch<TData>(path, {
        json: variables,
        headers: options?.headers,
      }),
    options
  );
};

export const usePutMutation = <TData = unknown, TVariables = unknown>(
  path: string,
  options?: UseMutationOptions<TData, TVariables> & {
    headers?: Record<string, string | undefined>;
  }
) => {
  return useMutation<TData, TVariables>(
    (variables) =>
      http.put<TData>(path, {
        json: variables,
        headers: options?.headers,
      }),
    options
  );
};

export const useDeleteMutation = <TData = unknown, TVariables = unknown>(
  path: string,
  options?: UseMutationOptions<TData, TVariables> & {
    headers?: Record<string, string | undefined>;
    searchParams?: Record<string, string | string[] | undefined>;
  }
) => {
  return useMutation<TData, TVariables>(
    (variables) =>
      http.delete<TData>(path, {
        json: variables,
        headers: options?.headers,
        searchParams: options?.searchParams,
      }),
    options
  );
};
