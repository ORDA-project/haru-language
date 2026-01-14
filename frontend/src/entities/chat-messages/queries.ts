import { useGetQuery, useMutation } from "../../hooks/useQuery";
import { API_ENDPOINTS } from "../../config/api";
import { http } from "../../utils/http";
import { useAtom } from "jotai";
import { userAtom } from "../../store/authStore";

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
  const [user] = useAtom(userAtom);
  return useGetQuery<ChatMessage[]>("/chat-message", {
    queryKey: ["chat-messages", user?.userId],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 30 * 1000, // 30초간 fresh 상태 유지 (불필요한 재조회 방지)
    enabled: !!user?.userId, // 로그인한 경우에만 호출
  });
};

/**
 * 날짜별 채팅 메시지 조회
 */
export const useGetChatMessagesByDate = (date: string) => {
  const [user] = useAtom(userAtom);
  return useGetQuery<ChatMessage[]>(`/chat-message/date/${date}`, {
    queryKey: ["chat-messages", date, user?.userId],
    refetchOnWindowFocus: false,
    enabled: !!date && !!user?.userId, // 날짜와 로그인 상태 모두 확인
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

