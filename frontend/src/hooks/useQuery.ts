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

  const query = useTanstackQuery<T, Error>({
    queryKey: options.queryKey,
    queryFn: fetchFn,
    enabled: options.enabled,
    staleTime: options.staleTime,
    gcTime: options.gcTime,
    refetchOnWindowFocus: options.refetchOnWindowFocus,
    refetchOnMount: options.refetchOnMount,
    retry: options.retry,
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
  showErrorToast?: boolean;
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
    if (mutation.isSuccess && mutation.data && mutation.variables) {
      if (options?.showSuccessMessage) {
        showSuccess(options.showSuccessMessage);
      }

      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      options?.onSuccess?.(mutation.data, mutation.variables);
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
    if (mutation.isError && mutation.error && mutation.variables) {
      if (options?.showErrorToast !== false) {
        handleError(mutation.error, true);
      }
      options?.onError?.(mutation.error, mutation.variables);
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
    if ((mutation.isSuccess || mutation.isError) && mutation.variables) {
      options?.onSettled?.(mutation.data, mutation.error, mutation.variables);
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
