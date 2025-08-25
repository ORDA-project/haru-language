import NavBar from "../Templates/Navbar";
import { useState } from "react";
import { useAtom } from "jotai";
import { userAtom, logoutAtom } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import {
  ProfileCard,
  FriendList,
  AccountProfile,
  UserSettings,
  PageHeader,
} from "../Elements/MyPage";

interface UserDataProps {
  userName: string;
  visitCount: number;
  gender: string;
  interest: string;
}

export default function MyPage() {
  const [user] = useAtom(userAtom);
  const [, logout] = useAtom(logoutAtom);
  const navigate = useNavigate();
  const { showSuccess, showError, handleError } = useErrorHandler();
  const [showAccountInfo, setShowAccountInfo] = useState(false);

  const friendList = [
    {
      userName: "정찬우",
      stats: "학습7회, 작문15회",
      buttonText: "콕 찌르기",
      buttonColor: "bg-[#00DAAA]",
    },
    {
      userName: "강숙희",
      stats: "학습1회, 작문8회",
      buttonText: "콕 찌르기",
      buttonColor: "bg-[#00DAAA]",
    },
    {
      userName: "장환희",
      stats: "학습10회, 작문32회",
      buttonText: "콕 찌르기",
      buttonColor: "bg-[#00DAAA]",
    },
  ];

  const [userData, setUserData] = useState<UserDataProps>({
    userName: user?.name || "김진희",
    visitCount: 17,
    gender: "여성",
    interest: "회화",
  });

  const handleLogout = async () => {
    try {
      // 로그아웃 진행 중 토스트 표시
      showSuccess('로그아웃 중', '잠시만 기다려주세요...');
      
      // 로그아웃 처리
      logout();
      
      // 성공 토스트 표시
      showSuccess('로그아웃 완료', '안전하게 로그아웃되었습니다.');
      
      // 약간의 딜레이 후 로그인 페이지로 이동
      setTimeout(() => {
        navigate("/");
      }, 1000);
      
    } catch (error) {
      console.error("Logout error:", error);
      handleError(error);
      showError('로그아웃 실패', '로그아웃 중 오류가 발생했습니다.');
    }
  };

  const handleNextClick = () => {
    setShowAccountInfo(true);
  };

  const handleBackClick = () => {
    setShowAccountInfo(false);
  };

  return (
    <div className="w-full h-full flex flex-col items-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#F5F6FA]">
      <div className="h-[calc(100vh-80px)] p-0 px-5 w-full max-w-[440px] box-border mx-auto overflow-y-scroll">
        {!showAccountInfo ? (
          // 첫 번째 화면 (프로필 + 친구 목록)
          <>
            <PageHeader title="프로필" />
            <ProfileCard userData={userData} onNextClick={handleNextClick} />
            <FriendList friendList={friendList} />
          </>
        ) : (
          // 두 번째 화면 (내 계정)
          <>
            <PageHeader
              title="내 계정"
              showBackButton={true}
              onBackClick={handleBackClick}
            />
            <AccountProfile userData={userData} />
            <UserSettings onLogout={handleLogout} />
          </>
        )}
      </div>
      <NavBar currentPage={"Home"} />
    </div>
  );
}
