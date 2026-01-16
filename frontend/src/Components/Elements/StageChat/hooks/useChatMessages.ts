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
}

// 초기 인사말 (프론트엔드 고정)
const INITIAL_GREETING: Message = {
  id: "initial-greeting",
  type: "ai",
  content: "안녕하세요! 영어 학습을 도와드릴 AI 튜터입니다. 궁금한 것이 있으시면 언제든지 질문해주세요!",
  timestamp: new Date(),
};

// 서버 응답을 로컬 Message 형식으로 변환
const convertToLocalMessage = (msg: ChatMessage): Message => ({
  id: msg.id,
  type: msg.type,
  content: msg.content,
  timestamp: typeof msg.timestamp === "string" ? new Date(msg.timestamp) : msg.timestamp,
  examples: msg.examples,
});

// 로컬 Message를 서버 형식으로 변환
const convertToServerMessage = (msg: Message): Omit<ChatMessage, "id" | "timestamp"> => {
  return {
    type: msg.type,
    content: msg.content,
    examples: msg.examples,
  };
};

export const useChatMessages = () => {
  const [user] = useAtom(userAtom);
  const [messages, setMessages] = useState<Message[]>([]);
  const userId = user?.userId;
  const { showError } = useErrorHandler();

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

  // 서버 메시지 동기화 - 초기 인사말을 맨 앞에 추가
  useEffect(() => {
    if (!userId) {
      setMessages([]);
      return;
    }

    // 로딩 중이거나 에러가 있으면 아무것도 하지 않음
    if (isLoading || isError) {
      return;
    }

    // 서버 응답이 배열이면 처리
    if (Array.isArray(serverMessages)) {
      const convertedMessages = serverMessages.map(convertToLocalMessage);
      
      // 초기 인사말을 맨 앞에 추가 (이미 있으면 추가하지 않음)
      const hasInitialGreeting = convertedMessages.some(
        (msg) => msg.id === INITIAL_GREETING.id || 
        msg.content === INITIAL_GREETING.content
      );
      
      if (!hasInitialGreeting) {
        setMessages([INITIAL_GREETING, ...convertedMessages]);
      } else {
        setMessages(convertedMessages);
      }
    } else {
      // 서버 메시지가 없으면 초기 인사말만 표시
      setMessages([INITIAL_GREETING]);
    }
  }, [userId, serverMessages, isLoading, isError]);

  const addMessage = useCallback(
    async (message: Message) => {
      if (!userId) return;

      // 초기 인사말은 서버에 저장하지 않음
      if (message.id === INITIAL_GREETING.id) {
        return;
      }

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
        
        // 초기 인사말 제외하고 서버에 일괄 저장
        const messagesToSave = updated.filter((msg) => msg.id !== INITIAL_GREETING.id);
        
        if (messagesToSave.length > 0) {
          const serverMessages = messagesToSave.map(convertToServerMessage);
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
