import React from "react";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../../store/dataStore";
import { Icons } from "../Icons";

interface Friend {
  id?: number;
  userName: string;
  stats: string;
  buttonText: string;
  buttonColor: string;
  status?: "pending" | "accepted" | "blocked";
}

interface FriendListProps {
  friendList: Friend[];
  isEditing?: boolean;
  onEditClick?: () => void;
  onCreateInvitation?: () => void;
  onDeleteFriend?: (friendId: number) => void;
  onPokeFriend?: (friendId: number, friendName?: string) => void;
  pokedFriendIds?: Record<number, boolean>;
  isLoading?: boolean;
  isFriendLimitReached?: boolean;
}

const FriendList = React.memo(function FriendList({
  friendList,
  isEditing = false,
  onEditClick,
  onCreateInvitation,
  onDeleteFriend,
  onPokeFriend,
  pokedFriendIds = {},
  isLoading = false,
  isFriendLimitReached = false,
}: FriendListProps) {
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  
  // 큰글씨 모드에 따른 텍스트 크기
  const baseFontSize = isLargeTextMode ? 18 : 16;
  const largeFontSize = isLargeTextMode ? 22 : 20;
  const xLargeFontSize = isLargeTextMode ? 26 : 24;
  const smallFontSize = isLargeTextMode ? 18 : 14;
  const xSmallFontSize = isLargeTextMode ? 16 : 12;
  
  const baseTextStyle: React.CSSProperties = { fontSize: `${baseFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const largeTextStyle: React.CSSProperties = { fontSize: `${largeFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const xLargeTextStyle: React.CSSProperties = { fontSize: `${xLargeFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const smallTextStyle: React.CSSProperties = { fontSize: `${smallFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const xSmallTextStyle: React.CSSProperties = { fontSize: `${xSmallFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  
  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="text-black font-bold" style={xLargeTextStyle}>나의 친구</div>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00DAAA]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="text-black font-bold" style={xLargeTextStyle}>
            나의 친구({friendList.length})
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <button
                onClick={onEditClick}
                className="bg-gray-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:bg-gray-600 transition-colors"
              >
                완료
              </button>
            ) : (
              <button
                onClick={onEditClick}
                className="bg-gray-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:bg-gray-600 transition-colors"
              >
                편집
              </button>
            )}
            <button
              onClick={onCreateInvitation}
              disabled={isFriendLimitReached}
              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm transition-colors ${
                isFriendLimitReached
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#00DAAA] text-black hover:bg-[#00DAAA]/80"
              }`}
            >
              {isFriendLimitReached ? "친구 5명 제한" : "친구링크 복사"}
              <Icons.link className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {friendList.length === 0 ? (
            <div className="bg-white rounded-[16px] p-8 shadow-md border border-gray-100 text-center">
              <div className="text-gray-500 mb-4">
                <Icons.link className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="font-medium" style={largeTextStyle}>아직 친구가 없어요</p>
                <p style={smallTextStyle}>
                  친구 링크를 공유해서 친구를 초대해보세요!
                </p>
              </div>
            </div>
          ) : isFriendLimitReached ? (
            <div className="bg-yellow-50 rounded-[16px] p-4 shadow-md border border-yellow-200 text-center">
              <div className="text-yellow-700">
                <p className="font-medium" style={smallTextStyle}>
                  친구 5명 제한에 도달했습니다
                </p>
                <p className="mt-1" style={xSmallTextStyle}>
                  친구를 삭제한 후 새로운 친구를 추가할 수 있습니다
                </p>
              </div>
            </div>
          ) : null}

          {friendList.length > 0 &&
            friendList.map((friend, index) => (
              <div
                key={friend.id || index}
                className="bg-white rounded-[16px] p-5 shadow-md border border-gray-100"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm overflow-hidden">
                      {friend.status === "blocked" ? (
                        <div className="w-full h-full relative">
                          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {friend.userName?.charAt(0) || "F"}
                          </div>
                          <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#00DAAA] to-[#00D999] rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {friend.userName?.charAt(0) || "F"}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold mb-1 text-gray-900 truncate" style={largeTextStyle}>
                        {friend.userName}
                      </div>
                      <div className="text-gray-500 truncate" style={smallTextStyle}>
                        {friend.stats}
                      </div>
                      {friend.status && (
                        <div className="text-gray-400 mt-1" style={xSmallTextStyle}>
                          상태:{" "}
                          {friend.status === "pending"
                            ? "대기중"
                            : friend.status === "accepted"
                            ? "수락됨"
                            : "차단됨"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {isEditing && friend.id ? (
                      <button
                        onClick={() => onDeleteFriend?.(friend.id!)}
                        className="bg-red-500 text-white px-5 py-2.5 rounded-lg text-base font-semibold shadow-md hover:bg-red-600 active:bg-red-700 transition-colors min-w-[80px] flex items-center justify-center gap-2"
                        style={baseTextStyle}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        삭제
                      </button>
                    ) : (
                      (() => {
                        const isPoked = !!(friend.id && pokedFriendIds[friend.id]);
                        const baseClasses =
                          "px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm min-w-[110px]";
                        const activeClasses = `${friend.buttonColor} text-black hover:opacity-80 transition-opacity`;
                        const disabledClasses = "bg-gray-200 text-gray-500 cursor-not-allowed";

                        return (
                          <button
                            onClick={() => friend.id && !isPoked && onPokeFriend?.(friend.id, friend.userName)}
                            disabled={isPoked}
                            className={`${baseClasses} ${isPoked ? disabledClasses : activeClasses}`}
                          >
                            {isPoked ? "콕 찌르기 완료" : friend.buttonText}
                          </button>
                        );
                      })()
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
});

export default FriendList;
