import NavBar from "../Templates/Navbar";
import { useState } from "react";
import { useAtom } from "jotai";
import { userAtom, logoutAtom } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
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

  const handleLogout = () => {
    logout();
    navigate("/");
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
