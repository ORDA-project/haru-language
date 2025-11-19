import { http } from "../../utils/http";
import {
  CreateInvitationResponse,
  RespondInvitationParams,
  RespondInvitationResponse,
  GetFriendsResponse,
} from "./types";

export const friendApi = {
  createInvitation: (): Promise<CreateInvitationResponse> => {
    return http.post("/friends/invite");
  },

  respondInvitation: (params: RespondInvitationParams): Promise<RespondInvitationResponse> => {
    return http.post("/friends/respond", { json: params });
  },

  getFriends: (): Promise<GetFriendsResponse> => {
    return http.get("/friends");
  },

  deleteFriend: (friendId: number): Promise<{ message: string }> => {
    return http.delete("/friends/remove", { json: { friendId } });
  },
};