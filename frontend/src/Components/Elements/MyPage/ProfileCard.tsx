import React from "react";
import { ArrowRight } from "lucide-react";

interface UserDataProps {
  userName: string;
  visitCount: number;
  gender: string;
  interest: string;
}

interface ProfileCardProps {
  userData: UserDataProps;
  onNextClick: () => void;
}

const ProfileCard = React.memo(function ProfileCard({
  userData,
  onNextClick,
}: ProfileCardProps) {
  return (
    <div className="mb-6">
      <div className="w-full rounded-[20px] bg-[#6770F6] px-6 py-8 shadow-lg">
        <div className="flex flex-col">
          {/* 상단: 이미지와 사용자 정보 */}
          <div className="flex items-center mb-4">
            <div className="w-16 h-16 bg-white rounded-full mr-4 flex items-center justify-center shadow-md overflow-hidden">
              {/* 실제 이미지가 있으면 여기에 표시, 없으면 기본 아바타 */}
              <div className="w-12 h-12 bg-gradient-to-br from-[#00DAAA] to-[#00D999] rounded-full flex items-center justify-center text-white font-bold text-lg">
                {userData.userName?.charAt(0) || "U"}
              </div>
            </div>
            <div>
              <h2 className="text-white font-bold text-xl mb-2">
                {userData.userName}
              </h2>
              <p className="text-white text-base opacity-90">
                {userData.visitCount}번째 방문했어요!
              </p>
            </div>
          </div>

          {/* 하단: 태그들과 다음 버튼 */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2">
              <span className="bg-white text-black px-6 py-2 rounded-full text-sm font-semibold shadow-sm">
                {userData.gender}
              </span>
              <span className="bg-white text-black px-6 py-2 rounded-full text-sm font-semibold shadow-sm">
                {userData.interest}
              </span>
            </div>
            <button
              onClick={onNextClick}
              className="rounded-[70px] bg-gradient-to-r from-transparent to-white py-2 px-6 hover:opacity-90 transition-opacity shadow-md flex items-center justify-end flex-1"
            >
              <ArrowRight className="w-7 h-7 text-black" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProfileCard;
