import { useAtom } from 'jotai';
import { useCallback } from 'react';
import {
  addToastAtom,
  setGlobalErrorAtom,
  showSuccessToastAtom,
  showWarningToastAtom,
  showInfoToastAtom,
} from '../store/errorStore';
import { CustomError, handleApiError } from '../utils/errorHandler';

export const useErrorHandler = () => {
  const [, addToast] = useAtom(addToastAtom);
  const [, setGlobalError] = useAtom(setGlobalErrorAtom);
  const [, showSuccessToast] = useAtom(showSuccessToastAtom);
  const [, showWarningToast] = useAtom(showWarningToastAtom);
  const [, showInfoToast] = useAtom(showInfoToastAtom);

  const handleError = useCallback(
    (error: any, showToast: boolean = true) => {
      const customError = error instanceof CustomError ? error : handleApiError(error);
      
      if (import.meta.env.DEV) {
        console.error('Error handled:', customError);
      }
      
      if (showToast) {
        addToast({
          type: 'error',
          title: 'Error',
          message: customError.message,
        });
      }
      
      // Set global error for debugging/logging purposes
      setGlobalError(customError);
      
      return customError;
    },
    [addToast, setGlobalError]
  );

  const showError = useCallback(
    (message: string, title: string = 'Error') => {
      addToast({
        type: 'error',
        title,
        message,
      });
    },
    [addToast]
  );

  const showSuccess = useCallback(
    (title: string, message?: string) => {
      showSuccessToast(title, message);
    },
    [showSuccessToast]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => {
      showWarningToast(title, message);
    },
    [showWarningToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => {
      showInfoToast(title, message);
    },
    [showInfoToast]
  );

  return {
    handleError,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };
};

// Hook for API calls with error handling
export const useApiCall = () => {
  const { handleError, showSuccess } = useErrorHandler();

  const executeApiCall = useCallback(
    async <T>(
      apiCall: () => Promise<T>,
      options?: {
        showSuccessMessage?: string;
        showErrorToast?: boolean;
        onSuccess?: (data: T) => void;
        onError?: (error: CustomError) => void;
      }
    ): Promise<T | null> => {
      try {
        const result = await apiCall();
        
        if (options?.showSuccessMessage) {
          showSuccess(options.showSuccessMessage);
        }
        
        if (options?.onSuccess) {
          options.onSuccess(result);
        }
        
        return result;
      } catch (error) {
        const customError = handleError(error, options?.showErrorToast ?? true);
        
        if (options?.onError) {
          options.onError(customError);
        }
        
        return null;
      }
    },
    [handleError, showSuccess]
  );

  return { executeApiCall };
};