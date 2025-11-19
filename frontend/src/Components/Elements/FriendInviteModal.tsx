import React, { useState } from "react";
import { useCreateInvitation } from "../../entities/friends/queries";
import { useErrorHandler } from "../../hooks/useErrorHandler";

interface FriendInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FriendInviteModal = ({ isOpen, onClose }: FriendInviteModalProps) => {
  const [inviteLink, setInviteLink] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useErrorHandler();
  const createInvitation = useCreateInvitation();

  const handleCreateInvite = async () => {
    try {
      setIsLoading(true);
      const result = await createInvitation.mutateAsync({
        inviterId: 1, // TODO: 실제 사용자 ID로 변경
      });

      setInviteLink(result.inviteLink);
      showSuccess(
        "초대 링크 생성 완료",
        "친구에게 공유할 링크가 생성되었습니다!"
      );
    } catch (error) {
      console.error("초대 링크 생성 실패:", error);
      showError("초대 링크 생성 실패", "다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      showSuccess("링크 복사 완료", "친구에게 공유할 링크가 복사되었습니다!");
    } catch (error) {
      console.error("링크 복사 실패:", error);
      showError("링크 복사 실패", "수동으로 링크를 복사해주세요.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">친구 초대하기</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#00DAAA] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
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
            <p className="text-gray-600 text-sm">
              친구와 함께 영어 학습을 시작해보세요!
            </p>
          </div>

          {!inviteLink ? (
            <button
              onClick={handleCreateInvite}
              disabled={isLoading}
              className="w-full py-3 bg-[#00DAAA] hover:bg-[#00C495] disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors"
            >
              {isLoading ? "링크 생성 중..." : "초대 링크 생성하기"}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">초대 링크</p>
                <p className="text-sm text-gray-800 break-all">{inviteLink}</p>
              </div>
              <button
                onClick={handleCopyLink}
                className="w-full py-3 bg-[#00DAAA] hover:bg-[#00C495] text-white font-semibold rounded-xl transition-colors"
              >
                링크 복사하기
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            친구가 링크를 통해 가입하면 자동으로 친구가 됩니다
          </p>
        </div>
      </div>
    </div>
  );
};

export default FriendInviteModal;



