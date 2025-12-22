import { useAtom } from "jotai";
import { useEffect, useRef, useCallback } from "react";
import { userAtom } from "../../store/authStore";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { http } from "../../utils/http";

interface FriendNotification {
  id: number;
  message: string;
  senderName?: string;
  createdAt?: string;
}

// 상수
const NOTIFICATION_CHECK_INTERVAL = 10000; // 10초마다 체크
const NOTIFICATION_DISPLAY_DELAY = 500; // 알림 표시 간격 (ms)
const READ_NOTIFICATION_DELAY = 1000; // 읽음 처리 딜레이 (ms)

const FriendNotificationListener = () => {
  const [user] = useAtom(userAtom);
  const { showInfo } = useErrorHandler();
  const lastUserIdRef = useRef<number | undefined>(undefined);
  const processedNotificationIdsRef = useRef<Set<number>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 알림 조회 및 표시 함수
  const fetchAndDisplayNotifications = useCallback(async () => {
    if (!user?.userId) return;

    try {
      const response = await http.get<{
        notifications?: FriendNotification[];
      }>("/friends/notifications/unread");

      const notifications = response.notifications || [];
      if (notifications.length === 0) return;

      const notificationIds: number[] = [];

      // 각 알림을 약간의 딜레이를 두고 표시 (동시에 여러 개가 뜨지 않도록)
      notifications.forEach((notification, index) => {
        // 이미 처리한 알림은 건너뛰기
        if (processedNotificationIdsRef.current.has(notification.id)) {
          return;
        }

        notificationIds.push(notification.id);
        processedNotificationIdsRef.current.add(notification.id);

        setTimeout(() => {
          const senderName = notification.senderName || "친구";
          showInfo("콕 찌르기 알림", `${senderName}님이 콕 찔렀습니다.`);
        }, index * NOTIFICATION_DISPLAY_DELAY);
      });

      // 모든 알림을 표시한 후 읽음 처리 (실무 표준)
      if (notificationIds.length > 0) {
        setTimeout(async () => {
          try {
            await http.post("/friends/notifications/read", {
              json: { notificationIds },
            });
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error("알림 읽음 처리 실패:", error);
            }
          }
        }, notifications.length * NOTIFICATION_DISPLAY_DELAY + READ_NOTIFICATION_DELAY);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("친구 알림 조회 실패:", error);
      }
    }
  }, [user?.userId, showInfo]);

  useEffect(() => {
    // 사용자가 없으면 정리
    if (!user?.userId) {
      lastUserIdRef.current = undefined;
      processedNotificationIdsRef.current.clear();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
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
        clearInterval(intervalRef.current);
      }
      
      // 즉시 한 번 체크
      fetchAndDisplayNotifications();
      
      // 주기적으로 알림 체크 (실무 표준: polling 방식)
      intervalRef.current = setInterval(() => {
        fetchAndDisplayNotifications();
      }, NOTIFICATION_CHECK_INTERVAL);
    }

    // cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user?.userId, fetchAndDisplayNotifications]);

  return null;
};

export default FriendNotificationListener;



