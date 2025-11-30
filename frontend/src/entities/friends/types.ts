export interface FriendSummary {
  id: number;
  socialId: string | null;
  name: string;
  goal?: string | null;
  gender?: string | null;
  stats?: string | null | {
    learningCount?: number;
    writingCount?: number;
  };
}

export interface CreateInvitationResponse {
  inviteLink: string;
  limit: number;
}

export interface RespondInvitationParams {
  token: string;
  response: "accept" | "decline";
  inviteeId?: string;
}

export interface RespondInvitationResponse {
  message: string;
}

export interface GetFriendsResponse {
  friends: FriendSummary[];
  count: number;
  limit: number;
}

export interface SendNotificationResponse {
  message: string;
}