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
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedFriends.size > 0
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            삭제
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
                  className={`rounded-[16px] p-4 shadow-md border transition-colors ${
                    isSelected
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-[#00DAAA] to-[#00D999] rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {friend.userName?.charAt(0) || "F"}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div
                          className={`font-semibold text-lg mb-1 truncate ${
                            isSelected ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {friend.userName}
                        </div>
                        <div
                          className={`text-sm truncate ${
                            isSelected ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          {friend.stats}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#00DAAA]"
                          : "bg-gray-200 border-2 border-gray-300"
                      }`}
                      onClick={() => toggleFriendSelection(friend.id!)}
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
                      {!isSelected && (
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      )}
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

