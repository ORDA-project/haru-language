import { useState, useEffect } from "react";
import { getTodayStringBy4AM } from "../../../../utils/dateUtils";

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

const getStorageKey = () => {
  const dateKey = getTodayStringBy4AM();
  return `stage_chat_messages_${dateKey}`;
};

const saveMessages = (msgs: Message[]) => {
  try {
    const storageKey = getStorageKey();
    const messagesToSave = msgs.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp ? msg.timestamp.toISOString() : new Date().toISOString(),
    }));
    localStorage.setItem(storageKey, JSON.stringify(messagesToSave));
  } catch (error) {
    console.error("대화 내역 저장 실패:", error);
  }
};

const loadMessages = (): Message[] | null => {
  try {
    const storageKey = getStorageKey();
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      }));
    }
  } catch (error) {
    console.error("대화 내역 불러오기 실패:", error);
  }
  return null;
};

export const useChatMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const savedMessages = loadMessages();
    if (savedMessages && savedMessages.length > 0) {
      setMessages(savedMessages);
    } else {
      const initialMessage: Message = {
        id: "1",
        type: "ai",
        content: "안녕하세요! 영어 학습을 도와드릴 AI 튜터입니다. 궁금한 것이 있으시면 언제든지 질문해주세요!",
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
      saveMessages([initialMessage]);
    }
  }, []);

  const addMessage = (message: Message) => {
    setMessages((prev) => {
      const updated = [...prev, message];
      saveMessages(updated);
      return updated;
    });
  };

  const updateMessages = (updater: (prev: Message[]) => Message[]) => {
    setMessages((prev) => {
      const updated = updater(prev);
      saveMessages(updated);
      return updated;
    });
  };

  return {
    messages,
    setMessages: updateMessages,
    addMessage,
  };
};

