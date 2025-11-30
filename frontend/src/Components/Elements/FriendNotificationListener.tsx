import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { userAtom } from "../../store/authStore";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { http } from "../../utils/http";

interface FriendNotification {
  id: number;
  message: string;
  senderName?: string;
  createdAt?: string;
}

const FriendNotificationListener = () => {
  const [user] = useAtom(userAtom);
  const { showInfo } = useErrorHandler();
  const lastUserIdRef = useRef<number | undefined>(undefined);
  const processedNotificationIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!user?.userId) {
      lastUserIdRef.current = undefined;
      processedNotificationIdsRef.current.clear();
      return;
    }

    // 사용자가 변경되었거나 처음 로그인한 경우에만 알림 체크
    if (lastUserIdRef.current === user.userId) {
      return;
    }

    lastUserIdRef.current = user.userId;
    processedNotificationIdsRef.current.clear();

    const fetchUnreadNotifications = async () => {
      try {
        const response = await http.get<{
          notifications?: FriendNotification[];
        }>("/friends/notifications/unread");

        const notifications = response.notifications || [];
        if (notifications.length > 0) {
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
            }, index * 500); // 0.5초 간격으로 표시
          });

          // 모든 알림을 표시한 후 읽음 처리 (실무 표준)
          if (notificationIds.length > 0) {
            // 알림 표시 후 약간의 딜레이를 두고 읽음 처리
            setTimeout(async () => {
              try {
                await http.post("/friends/notifications/read", {
                  json: { notificationIds },
                });
              } catch (error) {
                console.error("알림 읽음 처리 실패:", error);
              }
            }, notifications.length * 500 + 1000); // 모든 알림 표시 후 1초 뒤 읽음 처리
          }
        }
      } catch (error) {
        console.error("친구 알림 조회 실패:", error);
      }
    };

    fetchUnreadNotifications();
  }, [user?.userId, showInfo]);

  return null;
};

export default FriendNotificationListener;



