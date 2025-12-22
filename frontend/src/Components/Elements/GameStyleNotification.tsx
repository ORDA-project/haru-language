import React, { useEffect, useState } from 'react';

interface GameStyleNotificationProps {
  title: string;
  message: string;
  duration?: number;
  onClose: () => void;
}

const GameStyleNotification: React.FC<GameStyleNotificationProps> = ({
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 페이드인 애니메이션 (requestAnimationFrame으로 분할)
    const fadeInId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });

    // 자동으로 사라지기
    const exitTimer = setTimeout(() => {
      // 상태 업데이트를 requestAnimationFrame으로 감싸서 블로킹 방지
      requestAnimationFrame(() => {
        setIsExiting(true);
        // 페이드아웃 후 닫기 (추가 프레임으로 분할)
        requestAnimationFrame(() => {
          setTimeout(() => {
            onClose();
          }, 300); // 페이드아웃 애니메이션 시간
        });
      });
    }, duration);

    return () => {
      cancelAnimationFrame(fadeInId);
      clearTimeout(exitTimer);
    };
  }, [duration, onClose]);

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] transition-all duration-300 ${
        isVisible && !isExiting
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4'
      }`}
      style={{
        maxWidth: 'calc(100% - 32px)',
        width: 'auto',
        minWidth: '280px',
      }}
    >
      <div
        className={`bg-gradient-to-r from-[#00DAAA] to-[#00C495] rounded-2xl px-6 py-4 shadow-2xl border-2 border-white/30 ${
          isVisible && !isExiting ? 'animate-bounceIn' : ''
        }`}
        style={{
          boxShadow: '0 10px 40px rgba(0, 218, 170, 0.4), 0 0 20px rgba(0, 218, 170, 0.2)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-base mb-1">{title}</div>
            <div className="text-white/90 text-sm">{message}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameStyleNotification;

