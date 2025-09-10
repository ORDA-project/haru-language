export interface Friend {
  id: number;
  userId: number;
  friendId: number;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: number;
  inviterId: number;
  inviteCode: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvitationParams {
  inviterId: number;
}

export interface CreateInvitationResponse {
  inviteLink: string;
}

export interface RespondInvitationParams {
  inviteCode: string;
  response: 'accept' | 'decline';
}

export interface RespondInvitationResponse {
  message: string;
  success: boolean;
}

export interface GetFriendsResponse {
  friends: Friend[];
}