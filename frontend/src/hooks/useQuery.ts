import { useQuery as useTanstackQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '../utils/http';
import { useErrorHandler } from './useErrorHandler';

interface UseQueryOptions<T> {
  queryKey: (string | number | boolean | null | undefined)[];
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  retry?: number | boolean;
  showErrorToast?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

export const useQuery = <T>(
  fetchFn: () => Promise<T>,
  options: UseQueryOptions<T>
) => {
  const { handleError } = useErrorHandler();

  return useTanstackQuery<T, Error>({
    queryKey: options.queryKey,
    queryFn: fetchFn,
    enabled: options.enabled,
    staleTime: options.staleTime,
    gcTime: options.cacheTime,
    refetchOnWindowFocus: options.refetchOnWindowFocus,
    refetchOnMount: options.refetchOnMount,
    retry: options.retry,
    onSuccess: options.onSuccess,
    onError: (error) => {
      if (options.showErrorToast !== false) {
        handleError(error, true);
      }
      options.onError?.(error);
    },
  });
};

export const useGetQuery = <T>(
  path: string,
  options?: Omit<UseQueryOptions<T>, 'queryKey'> & {
    queryKey?: (string | number | boolean | null | undefined)[];
    searchParams?: Record<string, string | string[] | undefined>;
    headers?: Record<string, string | undefined>;
  }
) => {
  const queryKey = options?.queryKey || [path, options?.searchParams];
  
  return useQuery<T>(
    () => http.get<T>(path, { 
      searchParams: options?.searchParams,
      headers: options?.headers 
    }),
    {
      queryKey,
      ...options,
    }
  );
};

interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: any, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: any | null, variables: TVariables) => void;
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

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: (data, variables) => {
      if (options?.showSuccessMessage) {
        showSuccess(options.showSuccessMessage);
      }
      
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      if (options?.showErrorToast !== false) {
        handleError(error, true);
      }
      options?.onError?.(error, variables);
    },
    onSettled: options?.onSettled,
  });
};

export const usePostMutation = <TData = unknown, TVariables = unknown>(
  path: string,
  options?: UseMutationOptions<TData, TVariables> & {
    headers?: Record<string, string | undefined>;
  }
) => {
  return useMutation<TData, TVariables>(
    (variables) => http.post<TData>(path, { 
      json: variables,
      headers: options?.headers 
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
    (variables) => http.patch<TData>(path, { 
      json: variables,
      headers: options?.headers 
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
    (variables) => http.put<TData>(path, { 
      json: variables,
      headers: options?.headers 
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
    (variables) => http.delete<TData>(path, { 
      json: variables,
      headers: options?.headers,
      searchParams: options?.searchParams
    }),
    options
  );
};