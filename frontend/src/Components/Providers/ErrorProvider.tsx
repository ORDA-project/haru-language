import React, { ReactNode, useEffect } from 'react';
import { useAtom } from 'jotai';
import { setGlobalErrorAtom, addToastAtom } from '../../store/errorStore';
import { CustomError, handleApiError } from '../../utils/errorHandler';
import Toast from '../Elements/Toast';

interface ErrorProviderProps {
  children: ReactNode;
}

const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [, setGlobalError] = useAtom(setGlobalErrorAtom);
  const [, addToast] = useAtom(addToastAtom);

  useEffect(() => {
    // Global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (import.meta.env.DEV) {
        console.error('Unhandled promise rejection:', event.reason);
      }
      
      const error = handleApiError(event.reason);
      setGlobalError(error);
      
      event.preventDefault();
    };

    // Global error handler for JavaScript errors
    const handleError = (event: ErrorEvent) => {
      if (import.meta.env.DEV) {
        console.error('Global error:', event.error);
      }
      
      const error = new CustomError(
        event.message || '예상치 못한 오류가 발생했습니다.',
        'JAVASCRIPT_ERROR',
        undefined,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          ...(import.meta.env.DEV && { stack: event.error?.stack })
        }
      );
      
      setGlobalError(error);
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [setGlobalError]);

  return (
    <>
      {children}
      <Toast />
    </>
  );
};

export default ErrorProvider;