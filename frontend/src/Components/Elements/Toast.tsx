import React, { useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { toastMessagesAtom, removeToastAtom, ToastMessage } from '../../store/errorStore';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const Toast: React.FC = () => {
  const toastMessages = useAtomValue(toastMessagesAtom);
  const [, removeToast] = useAtom(removeToastAtom);

  const getToastIcon = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getToastClasses = (type: ToastMessage['type']) => {
    const baseClasses = 'alert shadow-lg max-w-sm';
    switch (type) {
      case 'success':
        return `${baseClasses} alert-success`;
      case 'error':
        return `${baseClasses} alert-error`;
      case 'warning':
        return `${baseClasses} alert-warning`;
      case 'info':
        return `${baseClasses} alert-info`;
      default:
        return `${baseClasses} alert-info`;
    }
  };

  return (
    <div className="toast toast-top toast-end z-50">
      {toastMessages.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
          getIcon={getToastIcon}
          getClasses={getToastClasses}
        />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
  getIcon: (type: ToastMessage['type']) => React.ReactNode;
  getClasses: (type: ToastMessage['type']) => string;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove, getIcon, getClasses }) => {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div className={`${getClasses(toast.type)} animate-slide-in-right`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getIcon(toast.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{toast.title}</div>
          {toast.message && (
            <div className="text-xs opacity-90 mt-1">{toast.message}</div>
          )}
        </div>
        <button
          className="btn btn-ghost btn-xs p-1 hover:bg-base-200/50"
          onClick={() => onRemove(toast.id)}
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;