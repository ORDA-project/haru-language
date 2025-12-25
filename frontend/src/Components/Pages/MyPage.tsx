import NavBar from "../Templates/Navbar";
import React, { useState, useMemo, useCallback, useEffect } from "react";
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
  FriendListEdit,
} from "../Elements/MyPage";
import { useGetUserInfo } from "../../entities/user-details/queries";
import {
  useGetFriends,
  useCreateInvitation,
  useDeleteFriend,
  useSendFriendNotification,
} from "../../entities/friends/queries";
import { http } from "../../utils/http";
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
  const [showFriendEdit, setShowFriendEdit] = useState(false);
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [copiedInviteLink, setCopiedInviteLink] = useState<string>("");
  const [totalVisitCount, setTotalVisitCount] = useState<number>(0);
  const [pokedFriends, setPokedFriends] = useState<Record<number, boolean>>({});

  // API queries - 회원정보 조회 (저장 후 갱신을 위해 refetchOnMount: true)
  const { data: userInfo, isLoading: userInfoLoading, refetch: refetchUserInfo } = useGetUserInfo();
  const { data: friendsData, isLoading: friendsLoading } = useGetFriends(Boolean(user?.userId));
  const createInvitationMutation = useCreateInvitation();
  const deleteFriendMutation = useDeleteFriend();
  const sendNotificationMutation = useSendFriendNotification();

  // 방문 횟수 가져오기 (프로필용)
  useEffect(() => {
    if (user?.userId) {
      http.get<{ userData?: { visitCount?: number } }>("/home")
        .then((res) => {
          if (res?.userData?.visitCount) {
            setTotalVisitCount(res.userData.visitCount);
          }
        })
        .catch((err) => {
          console.error("방문 횟수 가져오기 실패:", err);
        });
    }
  }, [user?.userId]);

  // 성별 한글 변환 함수
  const getGenderLabel = (gender?: string): string => {
    const genderMap: Record<string, string> = {
      female: "여성",
      male: "남성",
      private: "비공개",
    };
    return genderMap[gender || ""] || "미설정";
  };

  // 관심사 한글 변환 함수 (첫 번째 관심사만 표시)
  const getInterestLabel = (interests?: string[]): string => {
    if (!interests || interests.length === 0) return "미설정";
    
    const interestMap: Record<string, string> = {
      conversation: "회화",
      reading: "독해",
      grammar: "문법분석",
      business: "비즈니스",
      vocabulary: "어휘",
    };
    
    return interestMap[interests[0]] || interests[0] || "미설정";
  };

  // Memoized user data derived from API
  const userData = useMemo((): UserDataProps => {
    if (userInfoLoading || !userInfo) {
      return {
        userName: user?.name || "사용자",
        visitCount: totalVisitCount || 0,
        gender: "미설정",
        interest: "미설정",
      };
    }

    return {
      userName: userInfo.name || user?.name || "사용자",
      visitCount: totalVisitCount || 0, // 전체 누적 방문 횟수
      gender: getGenderLabel(userInfo.gender), // 실제 API 데이터 사용
      interest: getInterestLabel(userInfo.interests), // 실제 API 데이터 사용
    };
  }, [userInfo, userInfoLoading, user?.name, totalVisitCount]);

  // Memoized friends list derived from API
  const friendList = useMemo(() => {
    if (friendsLoading || !friendsData?.friends) {
      return [];
    }

    return friendsData.friends.map((friend) => {
      // stats가 객체인 경우 (방문 횟수, 학습 횟수)
      let statsText = "기록이 없어요ㅠ.ㅠ";
      if (friend.stats && typeof friend.stats === "object") {
        const visitCount = friend.stats.visitCount || 0;
        const learningCount = friend.stats.learningCount || 0;
        if (visitCount > 0 || learningCount > 0) {
          statsText = `방문 ${visitCount}회, 학습 ${learningCount}회`;
        }
      } else if (typeof friend.stats === "string" && friend.stats) {
        statsText = friend.stats;
      }

      return {
        id: friend.id,
        userName: friend.name,
        stats: statsText,
        buttonText: "콕 찌르기",
        buttonColor: "bg-[#00DAAA]",
        status: "accepted" as const,
      };
    });
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
      if (response && typeof response === 'object' && 'inviteLink' in response && response.inviteLink) {
        const link = String(response.inviteLink);
        // 브라우저 클립보드 API 지원 확인
        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(link);
          } catch (error) {
            console.warn("클립보드 복사 실패:", error);
          }
        }
        setCopiedInviteLink(link);
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

  const handleDeleteSelectedFriends = useCallback(
    async (friendIds: number[]) => {
      try {
        for (const friendId of friendIds) {
          await deleteFriendMutation.mutateAsync({ friendId });
        }
        showSuccess("친구 삭제", `${friendIds.length}명의 친구가 삭제되었습니다.`);
        setShowFriendEdit(false);
      } catch (error) {
        console.error("Delete friends error:", error);
        handleError(error);
        showError("친구 삭제 실패", "친구 삭제 중 오류가 발생했습니다.");
      }
    },
    [deleteFriendMutation, showSuccess, showError, handleError]
  );

  const handleEditFriendsClick = useCallback(() => {
    setShowFriendEdit(true);
  }, []);

  const handleFriendEditBack = useCallback(() => {
    setShowFriendEdit(false);
  }, []);

  const handlePokeFriend = useCallback(
    async (friendId: number, friendName?: string) => {
      try {
        if (!friendId) {
          showError("오류", "유효한 친구 정보를 찾을 수 없어요.");
          return;
        }
        await sendNotificationMutation.mutateAsync({ receiverId: friendId });
        setPokedFriends((prev) => ({ ...prev, [friendId]: true }));
        showSuccess("콕 찌르기 완료", `${friendName || "친구"}님에게 콕 찔렀습니다!`);
      } catch (error) {
        console.error("Send friend notification error:", error);
        handleError(error);
        showError("콕 찌르기 실패", "친구에게 알림을 보내지 못했어요.");
      }
    },
    [sendNotificationMutation, showSuccess, showError, handleError]
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
      <div className="h-[calc(100vh-72px)] p-0 px-5 pb-[72px] w-full max-w-[440px] box-border mx-auto overflow-y-scroll">
        {showFriendEdit ? (
          // 친구 목록 편집 화면
          <FriendListEdit
            friendList={friendList}
            onBack={handleFriendEditBack}
            onDeleteSelected={handleDeleteSelectedFriends}
            isLoading={friendsLoading}
          />
        ) : !showAccountInfo ? (
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
              onPokeFriend={handlePokeFriend}
              pokedFriendIds={pokedFriends}
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
            <UserSettings onLogout={handleLogout} onEditFriends={handleEditFriendsClick} />
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
