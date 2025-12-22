import { useAtom } from "jotai";
import { useEffect, useRef, useCallback, useState } from "react";
import { userAtom } from "../../store/authStore";
import { http } from "../../utils/http";
import GameStyleNotification from "./GameStyleNotification";

interface FriendNotification {
  id: number;
  message: string;
  senderName?: string;
  createdAt?: string;
}

// 상수
const NOTIFICATION_CHECK_INTERVAL = 10000; // 10초마다 새 알림 체크
const NOTIFICATION_DISPLAY_DELAY = 500; // 알림 표시 간격 (ms) - 여러 알림이 있을 때 순차적으로 표시
const READ_NOTIFICATION_DELAY = 1000; // 읽음 처리 딜레이 (ms) - 알림 표시 후 읽음 처리까지 대기 시간
const NOTIFICATION_DURATION = 5000; // 알림 표시 시간 (ms) - 각 알림이 화면에 머무는 시간: 5초

interface NotificationDisplay {
  id: number;
  title: string;
  message: string;
}

const FriendNotificationListener = () => {
  const [user] = useAtom(userAtom);
  const [currentNotification, setCurrentNotification] = useState<NotificationDisplay | null>(null);
  const notificationQueueRef = useRef<NotificationDisplay[]>([]);
  const lastUserIdRef = useRef<number | undefined>(undefined);
  const processedNotificationIdsRef = useRef<Set<number>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isShowingNotificationRef = useRef(false);

  // 알림 표시 함수
  const showNextNotification = useCallback(() => {
    if (isShowingNotificationRef.current || notificationQueueRef.current.length === 0) {
      return;
    }

    const notification = notificationQueueRef.current.shift();
    if (notification) {
      isShowingNotificationRef.current = true;
      setCurrentNotification(notification);
    }
  }, []);

  // 알림 닫기 함수
  const handleNotificationClose = useCallback(() => {
    setCurrentNotification(null);
    isShowingNotificationRef.current = false;
    
    // 다음 알림 표시 (requestAnimationFrame으로 분할하여 성능 최적화)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          showNextNotification();
        }, 300); // 페이드아웃 애니메이션 시간
      });
    });
  }, [showNextNotification]);

  // 알림 조회 및 표시 함수 (비동기 처리로 성능 개선)
  const fetchAndDisplayNotifications = useCallback(async () => {
    if (!user?.userId) return;

    try {
      // API 호출을 비동기로 처리하여 메인 스레드 블로킹 방지
      const response = await http.get<{
        notifications?: FriendNotification[];
      }>("/friends/notifications/unread");

      const notifications = response.notifications || [];
      if (notifications.length === 0) return;

      // 상태 업데이트를 다음 프레임으로 지연시켜 메인 스레드 부하 감소 (requestAnimationFrame 사용)
      await new Promise(resolve => requestAnimationFrame(resolve));

      const notificationIds: number[] = [];

      // 각 알림을 큐에 추가 (배치 처리)
      notifications.forEach((notification) => {
        // 이미 처리한 알림은 건너뛰기
        if (processedNotificationIdsRef.current.has(notification.id)) {
          return;
        }

        notificationIds.push(notification.id);
        processedNotificationIdsRef.current.add(notification.id);

        const senderName = notification.senderName || "친구";
        notificationQueueRef.current.push({
          id: notification.id,
          title: "콕 찌르기 알림",
          message: `${senderName}님이 콕 찔렀습니다.`,
        });
      });

      // 알림 표시 시작 (다음 프레임에서 실행 - requestAnimationFrame 사용)
      if (notificationQueueRef.current.length > 0 && !isShowingNotificationRef.current) {
        requestAnimationFrame(() => {
          showNextNotification();
        });
      }

      // 모든 알림을 표시한 후 읽음 처리 (비동기로 처리, requestAnimationFrame으로 분할)
      if (notificationIds.length > 0) {
        const delay = notificationIds.length * NOTIFICATION_DISPLAY_DELAY + READ_NOTIFICATION_DELAY;
        setTimeout(() => {
          // API 호출을 requestAnimationFrame으로 감싸서 메인 스레드 블로킹 방지
          requestAnimationFrame(async () => {
            try {
              await http.post("/friends/notifications/read", {
                json: { notificationIds },
              });
            } catch (error) {
              if (import.meta.env.DEV) {
                console.error("알림 읽음 처리 실패:", error);
              }
            }
          });
        }, delay);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("친구 알림 조회 실패:", error);
      }
    }
  }, [user?.userId, showNextNotification]);

  useEffect(() => {
    // 사용자가 없으면 정리
    if (!user?.userId) {
      lastUserIdRef.current = undefined;
      processedNotificationIdsRef.current.clear();
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 사용자가 변경된 경우 초기화
    if (lastUserIdRef.current !== user.userId) {
      lastUserIdRef.current = user.userId;
      processedNotificationIdsRef.current.clear();
      
      // 기존 인터벌 정리
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
      
      // 즉시 한 번 체크 (requestAnimationFrame 사용)
      requestAnimationFrame(() => {
        fetchAndDisplayNotifications();
      });
      
      // 주기적으로 알림 체크 (재귀적 setTimeout 사용으로 이전 작업 완료 후 실행)
      const scheduleNextCheck = () => {
        intervalRef.current = setTimeout(async () => {
          await fetchAndDisplayNotifications();
          scheduleNextCheck(); // 다음 체크 예약
        }, NOTIFICATION_CHECK_INTERVAL);
      };
      
      scheduleNextCheck();
    }

    // cleanup
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user?.userId, fetchAndDisplayNotifications]);

  return (
    <>
      {currentNotification && (
        <GameStyleNotification
          title={currentNotification.title}
          message={currentNotification.message}
          duration={NOTIFICATION_DURATION}
          onClose={handleNotificationClose}
        />
      )}
    </>
  );
};

export default FriendNotificationListener;



