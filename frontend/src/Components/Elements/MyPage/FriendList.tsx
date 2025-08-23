import { Icons } from "../Icons";

interface Friend {
  userName: string;
  stats: string;
  buttonText: string;
  buttonColor: string;
}

interface FriendListProps {
  friendList: Friend[];
}

export default function FriendList({ friendList }: FriendListProps) {
  return (
    <div className="mb-6">
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="text-black font-bold text-2xl">
            나의 친구({friendList.length})
          </div>
          <button className="bg-[#00DAAA] text-black px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm hover:bg-[#00DAAA]/80 transition-colors">
            친구링크 복사
            <Icons.link className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          {friendList.map((friend, index) => (
            <div
              key={index}
              className="bg-white rounded-[16px] p-5 shadow-md border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full mr-4 flex items-center justify-center shadow-sm overflow-hidden">
                    {index === 2 ? (
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
                    <div className="text-sm text-gray-500">{friend.stats}</div>
                  </div>
                </div>
                <button
                  className={`${friend.buttonColor} text-black px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm hover:opacity-80 transition-opacity`}
                >
                  {friend.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
