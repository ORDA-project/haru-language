import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import ImageUploadModal from "./ImageUploadModal";
import { Icons } from "./Icons";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface StageChatProps {
  onBack: () => void;
}

const StageChat = ({ onBack }: StageChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showError } = useErrorHandler();

  // 초기 AI 메시지
  useEffect(() => {
    const initialMessage: Message = {
      id: "1",
      type: "ai",
      content:
        "안녕하세요! 영어 학습을 도와드릴 AI 튜터입니다. 궁금한 것이 있으시면 언제든지 질문해주세요!",
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
  }, []);

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        API_ENDPOINTS.question,
        { question: userMessage.content },
        {
          withCredentials: true,
          timeout: 30000,
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

      // 개행 문자 처리 및 마크다운 스타일 적용
      formattedContent = formattedContent
        .replace(/\\n/g, "\n") // \n을 실제 개행으로 변환
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // **텍스트**를 <strong>으로 변환
        .replace(/\n/g, "<br/>"); // 개행을 <br/>로 변환

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: formattedContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      showError("오류 발생", "메시지를 전송하는 중 오류가 발생했습니다.");

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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

  const handleImageSelect = (file: File) => {
    // 이미지를 메시지로 추가
    const imageMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: `[이미지: ${file.name}]`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, imageMessage]);

    // TODO: 실제로는 이미지를 서버에 업로드하고 AI에게 분석 요청
    // 현재는 임시로 AI 응답을 추가
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content:
          "이미지를 확인했습니다. 이 이미지에 대해 궁금한 점이 있으시면 질문해주세요!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F7F8FB] relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center"
        >
          <svg
            className="w-5 h-5 text-gray-600"
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
          <h1 className="text-lg font-semibold text-gray-800">AI 대화</h1>
        </div>
        <div className="w-8"></div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                message.type === "user"
                  ? "bg-[#00DAAA] text-white"
                  : "bg-white text-gray-800 shadow-sm border border-gray-100"
              }`}
            >
              {message.type === "ai" ? (
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: message.content }}
                />
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              )}
            </div>

            {/* 카메라 버튼 - AI 메시지 옆에 표시 */}
            {message.type === "ai" && index === messages.length - 1 && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="absolute bottom-26 right-4 w-10 h-10 bg-[#00DAAA] hover:bg-[#00C495] rounded-full flex items-center justify-center shadow-lg transition-colors z-30"
              >
                <Icons.camera
                  className="w-5 h-5"
                  stroke="white"
                  strokeOpacity="1"
                />
              </button>
            )}
          </div>
        ))}

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
                <span className="text-sm text-gray-500">
                  AI가 답변을 준비하고 있습니다...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="궁금한 것을 질문해보세요..."
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#00DAAA] focus:border-transparent bg-white"
              rows={1}
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="w-12 h-12 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="text-white"
            >
              <path
                d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImageSelect={handleImageSelect}
        title="이미지 공유"
      />
    </div>
  );
};

export default StageChat;
