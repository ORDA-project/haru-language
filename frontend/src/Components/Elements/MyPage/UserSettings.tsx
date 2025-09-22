import React from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../Icons";

interface UserSettingsProps {
  onLogout: () => void;
}

const UserSettings = React.memo(function UserSettings({
  onLogout,
}: UserSettingsProps) {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };
  return (
    <div className="mb-6">
      <div className="w-full space-y-6">
        <div>
          <h3 className="text-black font-bold text-xl mb-4">내 정보</h3>
          <div className="bg-white rounded-[16px] space-y-4 p-5 shadow-md border border-gray-100">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <Icons.font className="w-6 h-6 mr-3 text-gray-600" />
                <span className="font-medium">큰글씨 모드</span>
              </div>
              <div className="w-12 h-6 bg-[#00DAAA] rounded-full flex items-center justify-end p-0.5 shadow-sm">
                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <Icons.audio className="w-6 h-6 mr-3 text-gray-600" />
                <span className="font-medium">오디오 항상 듣기</span>
              </div>
              <div className="w-12 h-6 bg-[#00DAAA] rounded-full flex items-center justify-end p-0.5 shadow-sm">
                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <Icons.login className="w-6 h-6 mr-3 text-gray-600" />
                <span className="font-medium">로그인 정보</span>
              </div>
              <span className="text-green-600 font-semibold">카카오</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <button onClick={onLogout} className="flex items-center">
                <Icons.logout className="w-6 h-6 mr-3 text-gray-600" />
                <span className="font-medium">로그아웃</span>
              </button>
            </div>
          </div>
        </div>

        {/* 앱 정보 섹션 */}
        <div>
          <h3 className="text-black font-bold text-xl mb-4">앱 정보</h3>
          <div className="bg-white rounded-[16px] flex flex-col gap-5 p-5 shadow-md border border-gray-100">
            <button
              onClick={() => handleNavigation("/help")}
              className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <Icons.help className="w-6 h-6 mr-3" />
              <span>도움말</span>
            </button>
            <button
              onClick={() => handleNavigation("/announcements")}
              className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <Icons.announcement className="w-6 h-6 mr-3" />
              <span>공지사항</span>
            </button>
            <button
              onClick={() => handleNavigation("/privacy-policy")}
              className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <span>개인정보처리방침</span>
            </button>
            <button
              onClick={() => handleNavigation("/terms-of-service")}
              className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <span>서비스 이용약관</span>
            </button>
            <button
              onClick={() => handleNavigation("/version-info")}
              className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <span>버전정보</span>
            </button>
            <button
              onClick={() => handleNavigation("/version-info")}
              className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <span>오픈소스 라이센스</span>
            </button>
            <button
              onClick={() => handleNavigation("/delete-account")}
              className="flex items-center hover:bg-red-50 p-2 rounded-lg transition-colors text-red-600"
            >
              <span>회원 탈퇴</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default UserSettings;
