import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { userAtom } from "../../../store/authStore";

interface UserDataProps {
  userName: string;
  visitCount: number;
  gender: string;
  interest: string;
}

interface AccountProfileProps {
  userData: UserDataProps;
}

export default function AccountProfile({ userData }: AccountProfileProps) {
  const navigate = useNavigate();
  const [user] = useAtom(userAtom);

  const handleEditClick = () => {
    navigate("/mypage/edit");
  };
  return (
    <div className="mb-6">
      <div className="w-full rounded-[20px] bg-[#6770F6] p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="w-16 h-16 bg-white rounded-full mr-4 flex items-center justify-center shadow-md overflow-hidden">
              {/* 실제 이미지가 있으면 여기에 표시, 없으면 기본 아바타 */}
              <div className="w-12 h-12 bg-gradient-to-br from-[#00DAAA] to-[#00D999] rounded-full flex items-center justify-center text-white font-bold text-lg relative">
                {userData.userName?.charAt(0) || "U"}
                {/* 우측 상단 장식 요소 */}
                <div className="absolute -top-1 -right-1 w-4 h-3 bg-[#00DAAA] rounded-full transform rotate-12"></div>
              </div>
            </div>
            <h2 className="text-white font-bold text-xl">
              {userData.userName}
            </h2>
          </div>
          <button
            onClick={handleEditClick}
            className="rounded-[70px] bg-white py-3 px-6 hover:opacity-90 transition-opacity shadow-md flex items-center ml-4"
          >
            <span className="text-gray-600 text-base mr-2">
              수정하러 가기
            </span>
            <ChevronRight className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}
