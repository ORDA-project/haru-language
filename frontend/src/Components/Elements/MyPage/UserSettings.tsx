import { Icons } from "../Icons";

interface UserSettingsProps {
  onLogout: () => void;
}

export default function UserSettings({ onLogout }: UserSettingsProps) {
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
            <div className="flex items-center">
              <Icons.help className="w-6 h-6 mr-3" />
              <span>도움말</span>
            </div>
            <div className="flex items-center">
              <Icons.announcement className="w-6 h-6 mr-3" />
              <span>공지사항</span>
            </div>
            <div className="flex items-center">
              <span>개인정보처리방침</span>
            </div>
            <div className="flex items-center">
              <span>서비스 이용약관</span>
            </div>
            <div className="flex items-center">
              <span>버전정보</span>
            </div>
            <div className="flex items-center">
              <span>오픈소스 라이센스</span>
            </div>
            <div className="flex items-center">
              <span>회원 탈퇴</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
