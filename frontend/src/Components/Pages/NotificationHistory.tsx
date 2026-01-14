import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { userAtom } from "../../store/authStore";
import { isLargeTextModeAtom } from "../../store/dataStore";
import { createTextStyles } from "../../utils/styleUtils";
import { http } from "../../utils/http";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import NavBar from "../Templates/Navbar";
import { ChevronLeft } from "lucide-react";

interface NotificationItem {
  id: number;
  message: string;
  senderName: string;
  createdAt: string;
}

const NotificationHistory = () => {
  const navigate = useNavigate();
  const [user] = useAtom(userAtom);
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showError } = useErrorHandler();
  
  const textStyles = createTextStyles(isLargeTextMode);
  const baseTextStyle = textStyles.base;
  const smallTextStyle = textStyles.small;
  const headerTextStyle = textStyles.header;

  useEffect(() => {
    if (!user?.userId) {
      navigate("/home");
      return;
    }

    fetchNotifications();
  }, [user?.userId, navigate]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await http.get<{
        notifications?: NotificationItem[];
      }>("/friends/notifications/read-list?limit=100");

      setNotifications(response.notifications || []);
    } catch (error) {
      console.error("알림 기록 조회 실패:", error);
      showError("알림 기록 조회 실패", "알림 기록을 불러올 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="w-full h-[calc(100vh-72px)] flex flex-col max-w-[440px] mx-auto bg-[#F7F8FB] shadow-[0_0_10px_0_rgba(0,0,0,0.1)]">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center"
            aria-label="뒤로 가기"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-semibold text-gray-800" style={headerTextStyle}>알림 기록</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-[72px]">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">알림 기록을 불러오는 중...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-12">
            <div className="text-gray-400 text-center mb-2" style={baseTextStyle}>알림 기록이 없습니다</div>
            <div className="text-gray-400 text-center" style={smallTextStyle}>
              친구가 콕 찌르기를 보내면 여기에 표시됩니다
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-800 font-medium mb-1" style={baseTextStyle}>
                      {notification.message}
                    </div>
                    <div className="text-gray-500" style={smallTextStyle}>
                      {formatDate(notification.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NavBar currentPage={"MyPage"} />
    </div>
  );
};

export default NotificationHistory;

