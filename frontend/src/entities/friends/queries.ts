import { useGetQuery, usePostMutation, useDeleteMutation } from "../../hooks/useQuery";
import {
  CreateInvitationResponse,
  RespondInvitationParams,
  RespondInvitationResponse,
  GetFriendsResponse,
  SendNotificationResponse,
} from "./types";

export const useGetFriends = (enabled = true) => {
  return useGetQuery<GetFriendsResponse>("/friends", {
    queryKey: ["friends"],
    enabled,
    refetchOnWindowFocus: true, // 창 포커스 시 자동 refetch
    refetchInterval: 10000, // 10초마다 자동 refetch
  });
};

export const useCreateInvitation = () => {
  return usePostMutation<CreateInvitationResponse, void>("/friends/invite", {
    showSuccessMessage: undefined, // FriendInviteModal에서 직접 처리
  });
};

export const useRespondInvitation = () => {
  return usePostMutation<RespondInvitationResponse, RespondInvitationParams>("/friends/respond", {
    showSuccessMessage: "친구 요청에 응답했습니다.",
    invalidateQueries: [["friends"]],
    onError: (error: any) => {
      // 409 Conflict (이미 친구인 경우)는 성공으로 처리
      if (error?.status === 409 && error?.data?.message?.includes("이미 친구")) {
        // 에러 토스트를 표시하지 않음 (성공 메시지로 처리)
        return;
      }
      // 다른 에러는 기본 처리
    },
    showErrorToast: (error: any) => {
      // 409 Conflict (이미 친구인 경우)는 에러 토스트를 표시하지 않음
      if (error?.status === 409 || (error?.data?.message && error.data.message.includes("이미 친구"))) {
        return false;
      }
      return true;
    },
  });
};

export const useDeleteFriend = () => {
  return useDeleteMutation<{ message: string }, { friendId: number }>("/friends/remove", {
    showSuccessMessage: "친구를 삭제했어요.",
    invalidateQueries: [["friends"]],
  });
};

export const useSendFriendNotification = () => {
  return usePostMutation<SendNotificationResponse, { receiverId: number }>("/friends/notifications/send", {
    showSuccessMessage: undefined,
  });
};
