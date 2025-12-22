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

  // 큰글씨 모드에 따른 텍스트 크기
  const baseFontSize = isLargeTextMode ? 20 : 16;
  const headerFontSize = isLargeTextMode ? 22 : 18;
  
  const baseTextStyle: React.CSSProperties = { 
    fontSize: `${baseFontSize}px`, 
    wordBreak: 'keep-all', 
    overflowWrap: 'break-word' as const 
  };
  const headerTextStyle: React.CSSProperties = { 
    fontSize: `${headerFontSize}px`,
    wordBreak: 'keep-all',
    overflowWrap: 'break-word' as const
  };

  const providerLabelMap: Record<string, string> = {
    kakao: "카카오",
    google: "구글",
  };

  const providerLabel =
    providerLabelMap[user?.socialProvider || ""] || "알 수 없음";

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
          <h3 className="text-black font-bold mb-4" style={headerTextStyle}>내 정보</h3>
          <div className="bg-white rounded-[16px] space-y-2 px-4 pt-4 pb-3 shadow-md border border-gray-100">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <Icons.font className="w-6 h-6 mr-3 text-gray-600" />
                <span className="font-medium" style={baseTextStyle}>큰글씨 모드</span>
              </div>
              <button
                onClick={toggleLargeTextMode}
                className={`relative w-11 h-6 rounded-full flex items-center transition-colors duration-200 cursor-pointer ${
                  isLargeTextMode ? "bg-[#00DAAA]" : "bg-gray-300"
                }`}
                style={{ padding: '2px' }}
                role="switch"
                aria-checked={isLargeTextMode}
                aria-label="큰글씨 모드"
              >
                <div
                  className={`absolute w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out ${
                    isLargeTextMode ? "translate-x-5" : "translate-x-0.5"
                  }`}
                  style={{ 
                    willChange: 'transform'
                  }}
                ></div>
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <Icons.audio className="w-6 h-6 mr-3 text-gray-600" />
                <span className="font-medium" style={baseTextStyle}>오디오 항상 듣기</span>
              </div>
              <button
                onClick={toggleAudioAlwaysPlay}
                className={`relative w-11 h-6 rounded-full flex items-center transition-colors duration-200 cursor-pointer ${
                  isAudioAlwaysPlay ? "bg-[#00DAAA]" : "bg-gray-300"
                }`}
                style={{ padding: '2px' }}
                role="switch"
                aria-checked={isAudioAlwaysPlay}
                aria-label="오디오 항상 듣기"
              >
                <div
                  className={`absolute w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out ${
                    isAudioAlwaysPlay ? "translate-x-5" : "translate-x-0.5"
                  }`}
                  style={{ 
                    willChange: 'transform'
                  }}
                ></div>
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <Icons.login className="w-6 h-6 mr-3 text-gray-600" />
                <span className="font-medium" style={baseTextStyle}>로그인 정보</span>
              </div>
            <span className="text-green-600 font-semibold" style={{ ...baseTextStyle, paddingRight: '4px' }}>
              {providerLabel}
            </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <button onClick={onLogout} className="flex items-center">
                <Icons.logout className="w-6 h-6 mr-3 text-gray-600" />
                <span className="font-medium" style={baseTextStyle}>로그아웃</span>
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <button onClick={onEditFriends} className="flex items-center">
                <Icons.profile className="w-6 h-6 mr-3 text-gray-600" />
                <span className="font-medium" style={baseTextStyle}>친구목록 편집</span>
              </button>
            </div>
          </div>
        </div>

        {/* 앱 정보 섹션 */}
        <div>
          <h3 className="text-black font-bold mb-4" style={headerTextStyle}>앱 정보</h3>
          <div className="bg-white rounded-[16px] flex flex-col gap-5 p-5 shadow-md border border-gray-100">
            <button
              onClick={() => navigate("/introduction", { state: { fromHelp: true } })}
              className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <Icons.help className="w-6 h-6 mr-3" />
              <span style={baseTextStyle}>도움말</span>
            </button>
            <button
              onClick={() => navigate("/announcements")}
              className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <Icons.announcement className="w-6 h-6 mr-3" />
              <span style={baseTextStyle}>공지사항</span>
            </button>
            <button
              onClick={() => navigate("/privacy-policy")}
              className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <span style={baseTextStyle}>개인정보처리방침</span>
            </button>
            <button
              onClick={() => navigate("/terms-of-service")}
              className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <span style={baseTextStyle}>서비스 이용약관</span>
            </button>
            <button
              onClick={() => navigate("/notification-history")}
              className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <Icons.notification className="w-6 h-6 mr-3" />
              <span style={baseTextStyle}>알림 기록</span>
            </button>
            <button
              onClick={() => navigate("/version-info")}
              className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <span style={baseTextStyle}>버전정보</span>
            </button>
            <button
              onClick={() => navigate("/delete-account")}
              className="flex items-center hover:bg-red-50 p-2 rounded-lg transition-colors text-red-600"
            >
              <span style={baseTextStyle}>회원 탈퇴</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default UserSettings;
