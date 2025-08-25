import React from 'react';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const ToastTester: React.FC = () => {
  const { showSuccess, showError, showWarning, showInfo } = useErrorHandler();

  const testToasts = () => {
    showSuccess('성공!', '모든 작업이 완료되었습니다.');
    
    setTimeout(() => {
      showInfo('정보', '새로운 알림이 있습니다.');
    }, 1000);
    
    setTimeout(() => {
      showWarning('주의', '중요한 변경사항이 있습니다.');
    }, 2000);
    
    setTimeout(() => {
      showError('오류', '문제가 발생했습니다.');
    }, 3000);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={testToasts}
        className="btn btn-primary btn-sm"
      >
        🧪 토스트 테스트
      </button>
    </div>
  );
};

export default ToastTester;