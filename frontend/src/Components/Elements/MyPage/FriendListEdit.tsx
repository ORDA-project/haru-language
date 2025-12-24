import React, { useState, useCallback } from "react";

interface Friend {
  id?: number;
  userName: string;
  stats: string;
}

interface FriendListEditProps {
  friendList: Friend[];
  onBack: () => void;
  onDeleteSelected: (friendIds: number[]) => void;
  isLoading?: boolean;
}

const FriendListEdit = React.memo(function FriendListEdit({
  friendList,
  onBack,
  onDeleteSelected,
  isLoading = false,
}: FriendListEditProps) {
  const [selectedFriends, setSelectedFriends] = useState<Set<number>>(new Set());

  const toggleFriendSelection = useCallback((friendId: number) => {
    setSelectedFriends((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(friendId)) {
        newSet.delete(friendId);
      } else {
        newSet.add(friendId);
      }
      return newSet;
    });
  }, []);

  const handleDelete = useCallback(() => {
    const friendIds = Array.from(selectedFriends);
    if (friendIds.length > 0) {
      onDeleteSelected(friendIds);
      setSelectedFriends(new Set());
    }
  }, [selectedFriends, onDeleteSelected]);

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="w-full">
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
        <div className="flex items-center justify-between mb-4 pt-6 pb-4">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="text-black mr-4 text-2xl hover:opacity-70 transition-opacity"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
            </button>
            <span className="text-black font-bold text-2xl">친구 목록 편집</span>
          </div>
          <button
            onClick={handleDelete}
            disabled={selectedFriends.size === 0}
            className={`px-5 py-2.5 rounded-lg text-base font-semibold shadow-md transition-colors flex items-center gap-2 ${
              selectedFriends.size > 0
                ? "bg-red-500 text-white hover:bg-red-600 active:bg-red-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {selectedFriends.size > 0 && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            {selectedFriends.size > 0 ? `삭제 (${selectedFriends.size})` : '삭제'}
          </button>
        </div>
        <div className="space-y-3">
          {friendList.length === 0 ? (
            <div className="bg-white rounded-[16px] p-8 shadow-md border border-gray-100 text-center">
              <p className="text-gray-500">친구가 없습니다.</p>
            </div>
          ) : (
            friendList.map((friend, index) => {
              if (!friend.id) return null;
              const isSelected = selectedFriends.has(friend.id);
              return (
                <div
                  key={friend.id || index}
                  className={`rounded-lg p-4 shadow-sm border transition-all duration-200 ${
                    isSelected
                      ? "bg-red-50 border-red-200 ring-2 ring-red-500 ring-offset-2"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* 체크박스 (왼쪽에 배치) */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => toggleFriendSelection(friend.id!)}
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-red-500 border-red-500"
                            : "bg-white border-gray-300 hover:border-red-400"
                        }`}
                        aria-label={isSelected ? "선택 해제" : "선택"}
                      >
                        {isSelected && (
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-[#00DAAA] to-[#00D999] rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {friend.userName?.charAt(0) || "F"}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div
                          className={`font-semibold text-lg mb-1 truncate ${
                            isSelected ? "text-gray-900" : "text-gray-900"
                          }`}
                        >
                          {friend.userName}
                        </div>
                        <div
                          className={`text-sm truncate ${
                            isSelected ? "text-gray-600" : "text-gray-500"
                          }`}
                        >
                          {friend.stats}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
});

export default FriendListEdit;

