import { useState, useEffect, useCallback } from "react";
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

  // 서버에서 메시지 조회
  const { data: serverMessages, isLoading, isError } = useGetChatMessages();
  const saveMessageMutation = useSaveChatMessage();
  const saveMessagesMutation = useSaveChatMessages();

  // userId 변경 시 이전 캐시 제거 및 메시지 초기화
  useEffect(() => {
    if (!userId) {
      // 로그아웃 상태: 메시지 초기화 및 모든 캐시 제거
      setMessages([]);
      // React Query 캐시 완전 초기화 (모든 chat-messages 관련 캐시 제거)
      queryClient.removeQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === "chat-messages";
        }
      });
      queryClient.resetQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === "chat-messages";
        }
      });
      return;
    }

    // userId가 변경되었을 때 이전 사용자의 캐시 제거
    queryClient.removeQueries({ 
      predicate: (query) => {
        const key = query.queryKey;
        return Array.isArray(key) && 
               key[0] === "chat-messages" && 
               key[1] !== userId; // 현재 userId가 아닌 모든 캐시 제거
      }
    });
  }, [userId, queryClient]);

  useEffect(() => {
    if (!userId) {
      // 로그아웃 상태: 메시지 초기화 (이미 위에서 캐시 제거됨)
      setMessages([]);
      return;
    }

    // 서버 조회가 실패한 경우(예: 304/캐시/네트워크 이슈 등)에는
    // "메시지가 없다"로 오판하여 초기 인사 메시지를 생성/저장하지 않도록 방지
    if (!isLoading && isError) {
      return;
    }

    // 서버에서 메시지 로드 (로그인한 경우에만)
    // enabled 옵션으로 로그인하지 않은 경우 호출되지 않지만, 캐시가 남아있을 수 있으므로 명시적으로 체크
    // serverMessages가 undefined이거나 null이면 빈 배열로 처리
    if (serverMessages && Array.isArray(serverMessages)) {
      if (serverMessages.length > 0) {
        const convertedMessages = serverMessages.map(convertToLocalMessage);
        setMessages(convertedMessages);
      } else {
        // 빈 배열인 경우 초기 메시지 생성
        if (!isLoading) {
          const initialMessage: Message = {
            id: "initial",
            type: "ai",
            content: "안녕하세요! 영어 학습을 도와드릴 AI 튜터입니다. 궁금한 것이 있으시면 언제든지 질문해주세요!",
            timestamp: new Date(),
          };
          setMessages([initialMessage]);
          
          // 서버에 초기 메시지 저장
          saveMessageMutation.mutate(
            {
              type: "ai",
              content: initialMessage.content,
            },
            {
              onSuccess: (saved) => {
                setMessages([convertToLocalMessage(saved)]);
              },
              onError: (error) => {
                console.error("초기 메시지 저장 실패:", error);
              },
            }
          );
        }
      }
    } else if (!isLoading && (serverMessages === undefined || serverMessages === null)) {
      // 메시지가 없으면 초기 메시지 생성
      const initialMessage: Message = {
        id: "initial",
        type: "ai",
        content: "안녕하세요! 영어 학습을 도와드릴 AI 튜터입니다. 궁금한 것이 있으시면 언제든지 질문해주세요!",
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
      
      // 서버에 초기 메시지 저장
      saveMessageMutation.mutate(
        {
          type: "ai",
          content: initialMessage.content,
        },
        {
          onSuccess: (saved) => {
            setMessages([convertToLocalMessage(saved)]);
          },
          onError: (error) => {
            console.error("초기 메시지 저장 실패:", error);
          },
        }
      );
    }
  }, [userId, serverMessages, isLoading, isError, saveMessageMutation, queryClient]);

  const addMessage = useCallback(
    async (message: Message) => {
      if (!userId) return; // 로그인하지 않은 경우 추가하지 않음

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
      if (!userId) return; // 로그인하지 않은 경우 업데이트하지 않음

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

