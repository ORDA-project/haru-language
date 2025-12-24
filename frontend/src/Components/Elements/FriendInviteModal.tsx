import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";
import { useCreateInvitation } from "../../entities/friends/queries";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import FriendInvitePopup from "./FriendInvitePopup";

interface FriendInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FriendInviteModal = ({ isOpen, onClose }: FriendInviteModalProps) => {
  const [inviteLink, setInviteLink] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const { showError } = useErrorHandler();
  const createInvitation = useCreateInvitation();
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  
  const baseFontSize = isLargeTextMode ? 18 : 16;
  const smallFontSize = isLargeTextMode ? 16 : 14;
  const headerFontSize = isLargeTextMode ? 22 : 20;
  const xSmallFontSize = isLargeTextMode ? 14 : 12;
  
  const baseTextStyle: React.CSSProperties = { fontSize: `${baseFontSize}px` };
  const smallTextStyle: React.CSSProperties = { fontSize: `${smallFontSize}px` };
  const headerTextStyle: React.CSSProperties = { fontSize: `${headerFontSize}px` };
  const xSmallTextStyle: React.CSSProperties = { fontSize: `${xSmallFontSize}px` };

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setInviteLink("");
      setIsLoading(false);
      setShowPopup(false);
    }
  }, [isOpen]);

  const handleCreateInvite = async () => {
    try {
      setIsLoading(true);
      const response = await createInvitation.mutateAsync();

      // 응답 구조 확인 및 링크 설정
      if (response && typeof response === 'object' && 'inviteLink' in response && response.inviteLink) {
        const link = String(response.inviteLink);
        // 클립보드에 링크 복사 (브라우저 지원 확인)
        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(link);
          } catch (error) {
            console.warn("클립보드 복사 실패:", error);
          }
        }
        // 상태 업데이트를 명시적으로 처리
        setInviteLink(link);
        // 모달 닫고 팝업 표시
        onClose();
        setShowPopup(true);
      } else {
        // 응답 구조가 예상과 다를 경우
        console.error("초대 링크가 응답에 없습니다. 응답:", response);
        showError("초대 링크 생성 실패", "응답에 링크가 없습니다.");
      }
    } catch (error: unknown) {
      console.error("초대 링크 생성 실패:", error);
      let errorMessage = "다시 시도해주세요.";
      if (error && typeof error === 'object') {
        const httpError = error as { data?: { message?: string }; message?: string };
        errorMessage = httpError?.data?.message || httpError?.message || errorMessage;
      }
      showError("초대 링크 생성 실패", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-gray-800" style={headerTextStyle}>친구 초대하기</h2>
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
            <p className="text-gray-600" style={smallTextStyle}>
              친구와 함께 영어 학습을 시작해보세요!
            </p>
          </div>

          <button
            onClick={handleCreateInvite}
            disabled={isLoading}
            className="w-full py-3 bg-[#00DAAA] hover:bg-[#00C495] disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors"
            style={baseTextStyle}
          >
            {isLoading ? "링크 생성 중..." : "초대 링크 생성하기"}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-gray-500 text-center" style={xSmallTextStyle}>
            친구가 링크를 통해 가입하면 자동으로 친구가 됩니다
          </p>
        </div>
      </div>
    </div>
      )}
      <FriendInvitePopup
        isVisible={showPopup}
        onClose={() => setShowPopup(false)}
        inviteLink={inviteLink}
      />
    </>
  );
};

export default FriendInviteModal;

