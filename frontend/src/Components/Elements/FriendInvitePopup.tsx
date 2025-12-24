import React, { useCallback, useEffect, useState } from "react";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";

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
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle"
  );
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  
  const baseFontSize = isLargeTextMode ? 18 : 16;
  const smallFontSize = isLargeTextMode ? 16 : 14;
  const headerFontSize = isLargeTextMode ? 22 : 20;
  const xSmallFontSize = isLargeTextMode ? 14 : 12;
  
  const baseTextStyle: React.CSSProperties = { fontSize: `${baseFontSize}px` };
  const smallTextStyle: React.CSSProperties = { fontSize: `${smallFontSize}px` };
  const headerTextStyle: React.CSSProperties = { fontSize: `${headerFontSize}px` };
  const xSmallTextStyle: React.CSSProperties = { fontSize: `${xSmallFontSize}px` };

  useEffect(() => {
    if (!isVisible) {
      setCopyStatus("idle");
    }
  }, [isVisible]);

  useEffect(() => {
    let timer: number | undefined;
    if (copyStatus === "copied") {
      timer = window.setTimeout(() => setCopyStatus("idle"), 2000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [copyStatus]);

  const handleCopyLink = useCallback(async () => {
    if (!inviteLink) return;
    // 브라우저 클립보드 API 지원 확인
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      setCopyStatus("error");
      return;
    }
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopyStatus("copied");
    } catch (error) {
      console.error("링크 복사 실패:", error);
      setCopyStatus("error");
    }
  }, [inviteLink]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 mx-4 max-w-sm w-full shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          aria-label="닫기"
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
        <div className="text-center">
          {/* 친구 초대 이미지 */}
          <div className="mx-auto mb-6 flex items-center justify-center">
            <img
              src="/invite.png"
              alt="친구 초대"
              className="w-64 h-64 object-contain"
              onError={(e) => {
                // 이미지 로드 실패시 기본 아이콘 표시
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.nextElementSibling?.classList.remove("hidden");
                target.nextElementSibling?.classList.add("flex");
              }}
            />
            <div className="hidden w-64 h-64 items-center justify-center">
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
          <h3 className="font-bold text-gray-800 mb-2" style={headerTextStyle}>
            나의 친구링크가 복사되었어요.
          </h3>
          <p className="text-gray-600 leading-relaxed mb-4" style={smallTextStyle}>
            친구에게 링크를 공유해서 함께 학습해보세요
          </p>

          {/* 복사된 링크 미리보기 */}
          {inviteLink && (
            <div className="mt-4 text-left">
              <p className="text-gray-800 mb-2 font-medium" style={smallTextStyle}>복사된 링크</p>
              <div className="bg-gray-100 rounded-lg p-3 mb-4">
                <p className="text-gray-700 break-all" style={xSmallTextStyle}>{inviteLink}</p>
              </div>
              <div className="flex items-center justify-end gap-2">
                {copyStatus === "copied" && (
                  <span className="text-[#00B085]" style={xSmallTextStyle}>
                    링크가 복사되었습니다.
                  </span>
                )}
                {copyStatus === "error" && (
                  <span className="text-red-500" style={xSmallTextStyle}>
                    복사에 실패했습니다. 다시 시도해주세요.
                  </span>
                )}
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 font-medium text-white bg-[#00DAAA] hover:bg-[#00C495] rounded-lg transition-colors"
                  style={smallTextStyle}
                >
                  다시 복사
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default FriendInvitePopup;
