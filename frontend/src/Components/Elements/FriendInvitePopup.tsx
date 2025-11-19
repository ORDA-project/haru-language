import React, { useEffect } from "react";

interface FriendInvitePopupProps {
  isVisible: boolean;
  onClose: () => void;
  inviteLink?: string;
}

const FriendInvitePopup = React.memo(function FriendInvitePopup({
  isVisible,
  onClose,
  inviteLink,
}: FriendInvitePopupProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 1000); // 1초 후 자동으로 사라짐

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl p-8 mx-4 max-w-sm w-full shadow-2xl">
        <div className="text-center">
          {/* 친구 초대 이미지 */}
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-[#00DAAA] to-[#00D999] rounded-2xl flex items-center justify-center">
            <img
              src="/invite.png"
              alt="친구 초대"
              className="w-24 h-24 object-contain"
              onError={(e) => {
                // 이미지 로드 실패시 기본 아이콘 표시
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.nextElementSibling?.classList.remove("hidden");
                target.nextElementSibling?.classList.add("flex");
              }}
            />
            <div className="hidden w-24 h-24 items-center justify-center">
              <svg
                className="w-16 h-16 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
          </div>

          {/* 성공 메시지 */}
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            친구링크 복사 완료!
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            친구에게 링크를 공유해서
            <br />
            함께 학습해보세요
          </p>

          {/* 복사된 링크 미리보기 (선택사항) */}
          {inviteLink && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">복사된 링크:</p>
              <p className="text-xs text-gray-700 break-all">
                {inviteLink.length > 30
                  ? `${inviteLink.substring(0, 30)}...`
                  : inviteLink}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default FriendInvitePopup;
