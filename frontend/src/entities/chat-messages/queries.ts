import { useGetQuery, useMutation } from "../../hooks/useQuery";
import { API_ENDPOINTS } from "../../config/api";
import { http } from "../../utils/http";

export interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date | string;
  examples?: Array<{
    context: string;
    dialogue: {
      A: { english: string; korean?: string };
      B: { english: string; korean?: string };
    };
  }>;
  imageUrl?: string;
}

/**
 * 최근 채팅 메시지 조회 (오늘 날짜 기준)
 */
export const useGetChatMessages = () => {
  return useGetQuery<ChatMessage[]>("/chat-message", {
    queryKey: ["chat-messages"],
    refetchOnWindowFocus: false,
  });
};

/**
 * 날짜별 채팅 메시지 조회
 */
export const useGetChatMessagesByDate = (date: string) => {
  return useGetQuery<ChatMessage[]>(`/chat-message/date/${date}`, {
    queryKey: ["chat-messages", date],
    refetchOnWindowFocus: false,
    enabled: !!date,
  });
};

/**
 * 채팅 메시지 저장 (단일)
 */
export const useSaveChatMessage = () => {
  return useMutation<ChatMessage, {
    type: "user" | "ai";
    content: string;
    examples?: Array<any>;
    imageUrl?: string;
    questionId?: number;
  }>(
    (data) =>
      http.post<ChatMessage>("/chat-message", {
        json: data,
      }),
    {
      invalidateQueries: [["chat-messages"]],
    }
  );
};

/**
 * 채팅 메시지 일괄 저장
 */
export const useSaveChatMessages = () => {
  return useMutation<ChatMessage[], { messages: ChatMessage[] }>(
    (data) =>
      http.post<ChatMessage[]>("/chat-message/batch", {
        json: data,
      }),
    {
      invalidateQueries: [["chat-messages"]],
    }
  );
};

/**
 * 채팅 메시지 삭제 (단일)
 */
export const useDeleteChatMessage = () => {
  return useMutation<void, string>(
    (messageId) =>
      http.delete(`/chat-message/${messageId}`),
    {
      invalidateQueries: [["chat-messages"]],
    }
  );
};

/**
 * 채팅 메시지 일괄 삭제
 */
export const useDeleteChatMessages = () => {
  return useMutation<void, string[]>(
    (messageIds) =>
      http.delete("/chat-message/batch", {
        json: { messageIds },
      }),
    {
      invalidateQueries: [["chat-messages"]],
    }
  );
};

