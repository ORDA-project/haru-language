import NavBar from "../Templates/Navbar";
import { useState, useMemo, useCallback } from "react";
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
import { useGetUserInfo } from "../../entities/user-details/queries";
import {
  useGetFriends,
  useCreateInvitation,
  useDeleteFriend,
} from "../../entities/friends/queries";
import FriendInvitePopup from "../Elements/FriendInvitePopup";

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
  const [isEditingFriends, setIsEditingFriends] = useState(false);
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [copiedInviteLink, setCopiedInviteLink] = useState<string>("");

  // API queries
  const { data: userInfo, isLoading: userInfoLoading } = useGetUserInfo();
  const { data: friendsData, isLoading: friendsLoading } = useGetFriends(Boolean(user?.userId));
  const createInvitationMutation = useCreateInvitation();
  const deleteFriendMutation = useDeleteFriend();

  // Memoized user data derived from API
  const userData = useMemo((): UserDataProps => {
    if (userInfoLoading || !userInfo) {
      return {
        userName: user?.name || "김진희",
        visitCount: 17,
        gender: "여성",
        interest: "회화",
      };
    }

    return {
      userName: userInfo.name || user?.name || "김진희",
      visitCount: 17, // This should come from user activity data
      gender: "여성", // This should come from user details
      interest: "회화", // This should come from user interests
    };
  }, [userInfo, userInfoLoading, user?.name]);

  // Memoized friends list derived from API
  const friendList = useMemo(() => {
    if (friendsLoading || !friendsData?.friends) {
      return [];
    }

    return friendsData.friends.map((friend) => ({
      id: friend.id,
      userName: friend.name,
      stats: friend.stats || "학습 데이터 준비 중",
      buttonText: "콕 찌르기",
      buttonColor: "bg-[#00DAAA]",
      status: "accepted" as const,
    }));
  }, [friendsData, friendsLoading]);

  // Check if friend limit is reached (5 friends max)
  const isFriendLimitReached = useMemo(() => {
    if (!friendsData) {
      return false;
    }
    return friendsData.count >= friendsData.limit;
  }, [friendsData]);

  // Memoized event handlers
  const handleLogout = useCallback(async () => {
    try {
      // 로그아웃 진행 중 토스트 표시
      showSuccess("로그아웃 중", "잠시만 기다려주세요...");

      // 로그아웃 처리
      logout();

      // 성공 토스트 표시
      showSuccess("로그아웃 완료", "안전하게 로그아웃되었습니다.");

      // 약간의 딜레이 후 로그인 페이지로 이동
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      console.error("Logout error:", error);
      handleError(error);
      showError("로그아웃 실패", "로그아웃 중 오류가 발생했습니다.");
    }
  }, [logout, navigate, showSuccess, showError, handleError]);

  const handleNextClick = useCallback(() => {
    setShowAccountInfo(true);
  }, []);

  const handleBackClick = useCallback(() => {
    setShowAccountInfo(false);
  }, []);

  const handleCreateInvitation = useCallback(async () => {
    try {
      if (!user) {
        showError("오류", "로그인이 필요합니다.");
        return;
      }

      const response = await createInvitationMutation.mutateAsync();

      // 클립보드에 링크 복사
      if (response.inviteLink) {
        await navigator.clipboard.writeText(response.inviteLink);
        setCopiedInviteLink(response.inviteLink);
        setShowInvitePopup(true);
      }

      showSuccess("초대 링크 생성", "친구 초대 링크가 생성되었습니다!");
    } catch (error) {
      console.error("Create invitation error:", error);
      handleError(error);
      showError(
        "초대 링크 생성 실패",
        "친구 초대 링크 생성 중 오류가 발생했습니다."
      );
    }
  }, [user, createInvitationMutation, showSuccess, showError, handleError]);

  const handleDeleteFriend = useCallback(
    async (friendId: number) => {
      try {
        await deleteFriendMutation.mutateAsync({ friendId });
        showSuccess("친구 삭제", "친구가 삭제되었습니다.");
      } catch (error) {
        console.error("Delete friend error:", error);
        handleError(error);
        showError("친구 삭제 실패", "친구 삭제 중 오류가 발생했습니다.");
      }
    },
    [deleteFriendMutation, showSuccess, showError, handleError]
  );

  const handleEditFriends = useCallback(() => {
    setIsEditingFriends(!isEditingFriends);
  }, [isEditingFriends]);

  const handleCloseInvitePopup = useCallback(() => {
    setShowInvitePopup(false);
    setCopiedInviteLink("");
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#F5F6FA]">
      <div className="h-[calc(100vh-72px)] p-0 px-5 w-full max-w-[440px] box-border mx-auto overflow-y-scroll">
        {!showAccountInfo ? (
          // 첫 번째 화면 (프로필 + 친구 목록)
          <>
            <PageHeader title="프로필" />
            <ProfileCard userData={userData} onNextClick={handleNextClick} />
            <FriendList
              friendList={friendList}
              isEditing={isEditingFriends}
              onEditClick={handleEditFriends}
              onCreateInvitation={handleCreateInvitation}
              onDeleteFriend={handleDeleteFriend}
              isLoading={friendsLoading}
              isFriendLimitReached={isFriendLimitReached}
            />
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

      {/* 친구 초대 팝업 */}
      <FriendInvitePopup
        isVisible={showInvitePopup}
        onClose={handleCloseInvitePopup}
        inviteLink={copiedInviteLink}
      />
    </div>
  );
}
