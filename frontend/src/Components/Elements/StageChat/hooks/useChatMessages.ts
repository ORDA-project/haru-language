import { useState, useEffect, useCallback } from "react";
import { useAtom } from "jotai";
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

  // 서버에서 메시지 조회
  const { data: serverMessages, isLoading } = useGetChatMessages();
  const saveMessageMutation = useSaveChatMessage();
  const saveMessagesMutation = useSaveChatMessages();

  useEffect(() => {
    if (!userId) {
      // 로그아웃 상태: 메시지 초기화
      setMessages([]);
      return;
    }

    // 서버에서 메시지 로드
    if (serverMessages && serverMessages.length > 0) {
      const convertedMessages = serverMessages.map(convertToLocalMessage);
      setMessages(convertedMessages);
    } else if (!isLoading && serverMessages && serverMessages.length === 0) {
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
  }, [userId, serverMessages, isLoading, saveMessageMutation]);

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

