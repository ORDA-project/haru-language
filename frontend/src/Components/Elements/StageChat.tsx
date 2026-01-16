import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";
import axios from "axios";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { ChatMessage } from "./StageChat/components/ChatMessage";
import { ChatExampleCard } from "./StageChat/components/ChatExampleCard";
import { MessageInput } from "./StageChat/components/MessageInput";
import { useChatMessages } from "./StageChat/hooks/useChatMessages";
import { useChatTTS } from "../Pages/QuestionDetail/hooks/useChatTTS";

interface ExampleData {
  context: string;
  dialogue: {
    A: { english: string; korean?: string };
    B: { english: string; korean?: string };
  };
}

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  examples?: ExampleData[];
}

interface StageChatProps {
  onBack: () => void;
}

// API 헬퍼 함수들
const API_TIMEOUT = 60000; // 60초 타임아웃

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const StageChat = ({ onBack }: StageChatProps) => {
  const { messages, setMessages, addMessage } = useChatMessages();
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  const [exampleScrollIndices, setExampleScrollIndices] = useState<Record<string, number>>({});
  const exampleScrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMessageCountRef = useRef<number>(0);
  const lastMessageIdRef = useRef<string | null>(null);
  const isScrollingRef = useRef<boolean>(false);
  
  // TTS 훅 사용
  const { isPlayingTTS, playingChatExampleId, playChatExampleTTS, stopTTS } = useChatTTS();

  // 큰글씨 모드에 따른 텍스트 크기 (중년층용)
  const baseFontSize = isLargeTextMode ? 18 : 16;
  const largeFontSize = isLargeTextMode ? 22 : 20;
  const headerFontSize = isLargeTextMode ? 22 : 18;
  
  const baseTextStyle: React.CSSProperties = { fontSize: `${baseFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const largeTextStyle: React.CSSProperties = { fontSize: `${largeFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const headerTextStyle: React.CSSProperties = { fontSize: `${headerFontSize}px` };
  const { showError, showSuccess } = useErrorHandler();

  useEffect(() => {
    return () => {
      stopTTS();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [stopTTS]);

  // 메시지 스크롤 최적화: 새 메시지가 추가되었을 때만 스크롤, 디바운싱 적용
  useEffect(() => {
    // 메시지가 없으면 초기화하고 스킵
    if (messages.length === 0) {
      lastMessageCountRef.current = 0;
      lastMessageIdRef.current = null;
      return;
    }

    // 마지막 메시지 ID 확인
    const lastMessage = messages[messages.length - 1];
    const currentMessageId = lastMessage?.id;
    const currentMessageCount = messages.length;

    // 실제로 새 메시지가 추가되었는지 확인 (개수 증가 또는 마지막 메시지 ID 변경)
    const hasNewMessage = 
      currentMessageCount > lastMessageCountRef.current || 
      currentMessageId !== lastMessageIdRef.current;

    // 새 메시지가 없거나 이미 스크롤 중이면 스킵 (ref는 나중에 업데이트)
    if (!hasNewMessage || isScrollingRef.current) {
      return;
    }

    // 컨테이너와 타겟 요소 확인
    const container = messagesContainerRef.current;
    const target = messagesEndRef.current;
    
    if (!container || !target) {
      // ref 업데이트는 여기서 해도 됨 (스크롤하지 않으므로)
      lastMessageCountRef.current = currentMessageCount;
      lastMessageIdRef.current = currentMessageId || null;
      return;
    }

    // 이전 스크롤 타이머 취소
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // 디바운싱: 짧은 시간 내 여러 업데이트를 하나로 묶음
    scrollTimeoutRef.current = setTimeout(() => {
      const currentContainer = messagesContainerRef.current;
      const currentTarget = messagesEndRef.current;
      
      if (!currentContainer || !currentTarget || isScrollingRef.current) {
        // ref 업데이트
        lastMessageCountRef.current = currentMessageCount;
        lastMessageIdRef.current = currentMessageId || null;
        return;
      }

      isScrollingRef.current = true;

      // 현재 스크롤 위치가 하단 근처인지 확인 (사용자가 위로 스크롤한 경우 스크롤하지 않음)
      const isNearBottom = 
        currentContainer.scrollHeight - currentContainer.scrollTop - currentContainer.clientHeight < 100;
      
      if (isNearBottom) {
        // 직접 스크롤 위치 설정 (리플로우 최소화, requestAnimationFrame 없이도 충분)
        currentContainer.scrollTop = currentContainer.scrollHeight;
      }
      
      // ref 업데이트
      lastMessageCountRef.current = currentMessageCount;
      lastMessageIdRef.current = currentMessageId || null;
      
      // 스크롤 완료 후 플래그 해제
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 50);
    }, 50); // 50ms 디바운싱
  }, [messages.length]); // messages.length만 dependency로 사용

  const handleSendMessage = async () => {
    // 텍스트가 있어야 전송 가능
    if (!inputMessage.trim() || isLoading) return;

    const messageContent = inputMessage.trim();
    const userMessageId = Date.now().toString();
    
    // 사용자 메시지 즉시 저장
    const userMessage: Message = {
      id: userMessageId,
      type: "user",
      content: messageContent,
      timestamp: new Date(),
    };
    addMessage(userMessage);
    
    setInputMessage("");
    setIsLoading(true);

    try {
      const headers = getAuthHeaders();
      
      // 질문 API 호출
      const response = await axios.post<{
        answer: string | { answer: string };
      }>("/question", 
        { question: messageContent },
        {
          baseURL: API_BASE_URL,
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          withCredentials: true,
          timeout: API_TIMEOUT,
        }
      );

      // AI 응답 포맷팅
      let formattedContent = "";
      if (typeof response.data.answer === "string") {
        formattedContent = response.data.answer;
      } else if (
        response.data.answer &&
        typeof response.data.answer === "object"
      ) {
        // 객체인 경우 answer 필드만 추출
        formattedContent =
          response.data.answer.answer || JSON.stringify(response.data.answer);
      } else {
        formattedContent = JSON.stringify(response.data.answer);
      }

      // 원본 텍스트 그대로 저장 (렌더링할 때만 변환)
      // 서버에서 받은 이상한 패턴 제거
      let cleanedContent = formattedContent;
      if (typeof cleanedContent === "string") {
        cleanedContent = cleanedContent
          .replace(/"text-decoration:\s*underline;\s*color:\s*#00DAAA;\s*font-weight:\s*500;">/gi, '')
          .replace(/"text-decoration:\s*underline;\s*color:\s*#00DAAA;\s*font-weight:\s*500;"/gi, '');
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: cleanedContent,
        timestamp: new Date(),
      };

      addMessage(aiMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      
      let errorMessage = "메시지를 전송하는 중 오류가 발생했습니다.";
      if (axios.isAxiosError(error)) {
        if (import.meta.env.DEV) {
          console.error("응답 데이터:", error.response?.data);
          console.error("응답 상태:", error.response?.status);
        }
        const status = error.response?.status;
        const data = error.response?.data as any;
        errorMessage = data?.message || `서버 오류 (${status || "알 수 없음"})`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      showError("메시지 전송 오류", errorMessage);

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: errorMessage + " 다시 시도해주세요.",
        timestamp: new Date(),
      };
      addMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  return (
    <div className="w-full flex-1 flex flex-col bg-[#F7F8FB] relative">
      {/* Header - 고정 */}
      <div className={`flex items-center justify-between ${isLargeTextMode ? "py-3 px-5" : "py-3 px-4"} bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 max-w-[440px] mx-auto`} style={{ height: isLargeTextMode ? "56px" : "48px" }}>
        <button
          onClick={onBack}
          className={`${isLargeTextMode ? "w-10 h-10" : "w-8 h-8"} flex items-center justify-center`}
        >
          <svg
            className={`${isLargeTextMode ? "w-6 h-6" : "w-5 h-5"} text-gray-600`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="text-center">
          <h1 className="font-semibold text-gray-800" style={headerTextStyle}>
            AI 대화
          </h1>
        </div>
        <div className="w-8"></div>
      </div>

      {/* Chat Content */}
      <>
          {/* Messages - 스크롤 가능 (헤더 아래 여백 추가) */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-4 space-y-3" 
            style={{ paddingTop: isLargeTextMode ? 'calc(56px + 1rem)' : 'calc(48px + 1rem)', paddingBottom: 'calc(72px + 5rem)' }}
          >
            {messages.map((message, index) => {
              const currentIndex = exampleScrollIndices[message.id] ?? 0;
              const currentExample = message.examples?.[currentIndex];
              const exampleId = message.examples ? `${message.id}-${currentIndex}` : null;
              const isPlaying = exampleId && playingChatExampleId === exampleId && isPlayingTTS;

              return (
                <React.Fragment key={message.id}>
                  {message.examples && message.examples.length > 0 ? (
                    <ChatExampleCard
                      example={currentExample || message.examples[0]}
                      currentIndex={currentIndex}
                      totalExamples={message.examples.length}
                      onPrevious={() => {
                        const newIndex = Math.max(0, currentIndex - 1);
                        setExampleScrollIndices((prev) => ({
                          ...prev,
                          [message.id]: newIndex,
                        }));
                      }}
                      onNext={() => {
                        const newIndex = Math.min(message.examples!.length - 1, currentIndex + 1);
                        setExampleScrollIndices((prev) => ({
                          ...prev,
                          [message.id]: newIndex,
                        }));
                      }}
                      onPlay={() => {
                        if (currentExample?.dialogue?.A?.english && currentExample?.dialogue?.B?.english) {
                          playChatExampleTTS(
                            currentExample.dialogue.A.english,
                            currentExample.dialogue.B.english,
                            exampleId!
                          );
                        }
                      }}
                      isPlaying={!!isPlaying}
                      isLargeTextMode={isLargeTextMode}
                    />
                  ) : (
                    <ChatMessage
                      message={message}
                      isLargeTextMode={isLargeTextMode}
                      baseTextStyle={baseTextStyle}
                    />
                  )}
                </React.Fragment>
              );
            })}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-gray-500" style={{ fontSize: `${isLargeTextMode ? 18 : 14}px` }}>
                      {isLargeTextMode ? "답변을 준비중입니다..." : "AI가 답변을 준비하고 있습니다..."}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input - 고정 */}
          <MessageInput
            inputMessage={inputMessage}
            isLoading={isLoading}
            isLargeTextMode={isLargeTextMode}
            baseTextStyle={baseTextStyle}
            onInputChange={setInputMessage}
            onSend={handleSendMessage}
            onKeyPress={handleKeyPress}
          />
        </>
    </div>
  );
};

export default StageChat;
