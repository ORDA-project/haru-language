import React from "react";
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
  isLoading?: boolean;
  isFriendLimitReached?: boolean;
}

const FriendList = React.memo(function FriendList({
  friendList,
  isEditing = false,
  onEditClick,
  onCreateInvitation,
  onDeleteFriend,
  isLoading = false,
  isFriendLimitReached = false,
}: FriendListProps) {
  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="text-black font-bold text-2xl">나의 친구</div>
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
          <div className="text-black font-bold text-2xl">
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
                <p className="text-lg font-medium">아직 친구가 없어요</p>
                <p className="text-sm">
                  친구 링크를 공유해서 친구를 초대해보세요!
                </p>
              </div>
            </div>
          ) : isFriendLimitReached ? (
            <div className="bg-yellow-50 rounded-[16px] p-4 shadow-md border border-yellow-200 text-center">
              <div className="text-yellow-700">
                <p className="text-sm font-medium">
                  친구 5명 제한에 도달했습니다
                </p>
                <p className="text-xs mt-1">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full mr-4 flex items-center justify-center shadow-sm overflow-hidden">
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
                    <div>
                      <div className="font-semibold text-lg mb-1">
                        {friend.userName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {friend.stats}
                      </div>
                      {friend.status && (
                        <div className="text-xs text-gray-400 mt-1">
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
                  <div className="flex items-center gap-2">
                    {isEditing && friend.id ? (
                      <button
                        onClick={() => onDeleteFriend?.(friend.id!)}
                        className="bg-red-500 text-white px-3 py-2 rounded-full text-sm font-medium shadow-sm hover:bg-red-600 transition-colors"
                      >
                        삭제
                      </button>
                    ) : (
                      <button
                        className={`${friend.buttonColor} text-black px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm hover:opacity-80 transition-opacity`}
                      >
                        {friend.buttonText}
                      </button>
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
