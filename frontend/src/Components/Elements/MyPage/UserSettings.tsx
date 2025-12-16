import React from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { Icons } from "../Icons";
import { userAtom } from "../../../store/authStore";
import { isLargeTextModeAtom, isAudioAlwaysPlayAtom } from "../../../store/dataStore";

interface UserSettingsProps {
  onLogout: () => void;
  onEditFriends?: () => void;
}

const UserSettings = React.memo(function UserSettings({
  onLogout,
  onEditFriends,
}: UserSettingsProps) {
  const navigate = useNavigate();
  const [user] = useAtom(userAtom);
  const [isLargeTextMode, setIsLargeTextMode] = useAtom(isLargeTextModeAtom);
  const [isAudioAlwaysPlay, setIsAudioAlwaysPlay] = useAtom(isAudioAlwaysPlayAtom);

  const providerLabelMap: Record<string, string> = {
    kakao: "카카오",
    google: "구글",
  };

  const providerLabel =
    providerLabelMap[user?.socialProvider || ""] || "알 수 없음";

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const toggleLargeTextMode = () => {
    setIsLargeTextMode(!isLargeTextMode);
  };

  const toggleAudioAlwaysPlay = () => {
    setIsAudioAlwaysPlay(!isAudioAlwaysPlay);
  };
  return (
    <div className="mb-6">
      <div className="w-full space-y-6">
        <div>
          <h3 className="text-black font-bold text-xl mb-4">내 정보</h3>
          <div className="bg-white rounded-[16px] space-y-2 p-4 shadow-md border border-gray-100">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <Icons.font className="w-6 h-6 mr-3 text-gray-600" />
                <span className="font-medium">큰글씨 모드</span>
              </div>
              <button
                onClick={toggleLargeTextMode}
                className={`relative w-12 h-6 rounded-full flex items-center transition-colors cursor-pointer ${
                  isLargeTextMode ? "bg-[#00DAAA]" : "bg-gray-300"
                }`}
                style={{ padding: '2px' }}
              >
                <div
                  className={`absolute w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ease-in-out ${
                    isLargeTextMode ? "translate-x-6" : "translate-x-0.5"
                  }`}
                ></div>
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <Icons.audio className="w-6 h-6 mr-3 text-gray-600" />
                <span className="font-medium">오디오 항상 듣기</span>
              </div>
              <button
                onClick={toggleAudioAlwaysPlay}
                className={`relative w-12 h-6 rounded-full flex items-center transition-colors cursor-pointer ${
                  isAudioAlwaysPlay ? "bg-[#00DAAA]" : "bg-gray-300"
                }`}
                style={{ padding: '2px' }}
              >
                <div
                  className={`absolute w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ease-in-out ${
                    isAudioAlwaysPlay ? "translate-x-6" : "translate-x-0.5"
                  }`}
                ></div>
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <Icons.login className="w-6 h-6 mr-3 text-gray-600" />
                <span className="font-medium">로그인 정보</span>
              </div>
            <span className="text-green-600 font-semibold">
              {providerLabel}
            </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <button onClick={onLogout} className="flex items-center">
                <Icons.logout className="w-6 h-6 mr-3 text-gray-600" />
                <span className="font-medium">로그아웃</span>
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <button onClick={onEditFriends} className="flex items-center">
                <Icons.profile className="w-6 h-6 mr-3 text-gray-600" />
                <span className="font-medium">친구목록 편집</span>
              </button>
            </div>
          </div>
        </div>

        {/* 앱 정보 섹션 */}
        <div>
          <h3 className="text-black font-bold text-xl mb-4">앱 정보</h3>
          <div className="bg-white rounded-[16px] flex flex-col gap-5 p-5 shadow-md border border-gray-100">
            <button
              onClick={() => navigate("/introduction", { state: { fromHelp: true } })}
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
