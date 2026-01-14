import { useState, useEffect, useCallback, useRef } from "react";
import { useAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { userAtom } from "../../../../store/authStore";
import {
  useGetChatMessages,
  useSaveChatMessage,
  useSaveChatMessages,
  ChatMessage,
} from "../../../../entities/chat-messages/queries";
import { useErrorHandler } from "../../../../hooks/useErrorHandler";
import { http } from "../../../../utils/http";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  examples?: Array<{
    context: string;
    dialogue: {
      A: { english: string; korean?: string };
      B: { english: string; korean?: string };
    };
  }>;
  imageUrl?: string;
}

// 서버 응답을 로컬 Message 형식으로 변환
const convertToLocalMessage = (msg: ChatMessage): Message => ({
  id: msg.id,
  type: msg.type,
  content: msg.content,
  timestamp: typeof msg.timestamp === "string" ? new Date(msg.timestamp) : msg.timestamp,
  examples: msg.examples,
  imageUrl: msg.imageUrl,
});

// 로컬 Message를 서버 형식으로 변환
const convertToServerMessage = (msg: Message): Omit<ChatMessage, "id" | "timestamp"> => ({
  type: msg.type,
  content: msg.content,
  examples: msg.examples,
  imageUrl: msg.imageUrl,
});

export const useChatMessages = () => {
  const [user] = useAtom(userAtom);
  const [messages, setMessages] = useState<Message[]>([]);
  const userId = user?.userId;
  const { showError } = useErrorHandler();
  const queryClient = useQueryClient();
  
  // 초기화 완료 여부 추적 (userId별로, 한 번만 실행)
  const initCompletedRef = useRef<Set<number>>(new Set());

  // 서버에서 메시지 조회
  const { data: serverMessages, isLoading, isError } = useGetChatMessages();
  const saveMessageMutation = useSaveChatMessage();
  const saveMessagesMutation = useSaveChatMessages();

  // userId 변경 시 초기화
  useEffect(() => {
    if (!userId) {
      setMessages([]);
      return;
    }
  }, [userId]);

  // 서버 메시지 동기화 - 서버 응답만 믿고 처리
  useEffect(() => {
    if (!userId) {
      setMessages([]);
      return;
    }

    // 로딩 중이거나 에러가 있으면 아무것도 하지 않음
    if (isLoading || isError) {
      return;
    }

    // 서버 응답이 배열이면 그대로 사용
    if (Array.isArray(serverMessages)) {
      const convertedMessages = serverMessages.map(convertToLocalMessage);
      setMessages(convertedMessages);
    } else {
      setMessages([]);
    }
  }, [userId, serverMessages, isLoading, isError]);

  // 초기 인사말 생성 - 로딩 완료 후 한 번만 실행 (완전히 분리)
  useEffect(() => {
    // 조건 체크
    if (!userId) return;
    if (isLoading || isError) return;
    if (!Array.isArray(serverMessages)) return;
    
    // 이미 초기화했으면 절대 스킵
    if (initCompletedRef.current.has(userId)) return;
    
    // 메시지가 없을 때만 초기화
    if (serverMessages.length === 0) {
      // 즉시 마킹하여 중복 호출 완전 방지
      initCompletedRef.current.add(userId);
      
      // 초기화 API 호출
      http.post<ChatMessage>("/chat-message/initialize", {})
        .then(() => {
          // 성공 시 쿼리 무효화하여 재조회
          queryClient.invalidateQueries({ 
            queryKey: ["chat-messages", userId] 
          });
        })
        .catch((error) => {
          console.error("초기 인사말 생성 실패:", error);
          // 실패 시 플래그 제거하여 재시도 가능하게
          initCompletedRef.current.delete(userId);
          // 실패해도 다시 조회 (이미 생성되었을 수 있음)
          queryClient.invalidateQueries({ 
            queryKey: ["chat-messages", userId] 
          });
        });
    } else {
      // 메시지가 있으면 초기화 완료로 표시
      initCompletedRef.current.add(userId);
    }
  }, [userId, isLoading, isError]); // serverMessages를 dependency에서 완전히 제거

  // serverMessages가 변경될 때 초기화 상태 업데이트 (별도 effect)
  useEffect(() => {
    if (!userId) return;
    if (!Array.isArray(serverMessages)) return;
    
    // 메시지가 있으면 초기화 완료로 표시
    if (serverMessages.length > 0) {
      initCompletedRef.current.add(userId);
    }
  }, [userId, serverMessages?.length]);

  const addMessage = useCallback(
    async (message: Message) => {
      if (!userId) return;

      // 즉시 UI에 반영
      setMessages((prev) => [...prev, message]);

      // 서버에 저장
      try {
        await saveMessageMutation.mutateAsync(convertToServerMessage(message));
      } catch (error) {
        console.error("메시지 저장 실패:", error);
        showError("저장 실패", "메시지 저장 중 오류가 발생했습니다.");
        // 저장 실패 시 UI에서 제거
        setMessages((prev) => prev.filter((m) => m.id !== message.id));
      }
    },
    [userId, saveMessageMutation, showError]
  );

  const updateMessages = useCallback(
    (updater: (prev: Message[]) => Message[]) => {
      if (!userId) return;

      setMessages((prev) => {
        const updated = updater(prev);
        
        // 서버에 일괄 저장
        if (updated.length > 0) {
          const serverMessages = updated.map(convertToServerMessage);
          saveMessagesMutation.mutate(
            { messages: serverMessages as any },
            {
              onError: (error) => {
                console.error("메시지 일괄 저장 실패:", error);
              },
            }
          );
        }
        
        return updated;
      });
    },
    [userId, saveMessagesMutation]
  );

  return {
    messages,
    setMessages: updateMessages,
    addMessage,
    isLoading,
  };
};
