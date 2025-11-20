import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import { API_ENDPOINTS } from "../../config/api";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { http } from "../../utils/http";
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
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [cropStage, setCropStage] = useState<"chat" | "crop">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cropperRef = useRef<any>(null);
  const { showError, showSuccess } = useErrorHandler();

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
      const response = await http.post<{
        answer: string | { answer: string };
      }>("/question", {
        json: { question: userMessage.content },
      });

      // AI 응답 포맷팅
      let formattedContent = "";
      if (typeof response.answer === "string") {
        formattedContent = response.answer;
      } else if (
        response.answer &&
        typeof response.answer === "object"
      ) {
        // 객체인 경우 answer 필드만 추출
        formattedContent =
          response.answer.answer || JSON.stringify(response.answer);
      } else {
        formattedContent = JSON.stringify(response.answer);
      }

      // 개행 문자 처리 및 마크다운 스타일 적용
      formattedContent = formattedContent
        .replace(/\\n/g, "\n") // \n을 실제 개행으로 변환
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // **텍스트**를 <strong>으로 변환
        .replace(
          /"([^"]*)"/g,
          '<span style="color: #00DAAA; font-weight: 500;">"$1"</span>'
        ) // 따옴표 안의 텍스트를 하이라이트
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
    // 파일 형식 검사
    if (!file.type.startsWith("image/")) {
      showError("잘못된 파일 형식", "이미지 파일만 업로드 가능합니다.");
      return;
    }

    // 파일 크기 검사 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError(
        "파일 크기 초과",
        "이미지 파일이 너무 큽니다. (10MB 이하로 해주세요)"
      );
      return;
    }

    try {
      const imageURL = URL.createObjectURL(file);
      setUploadedImage(imageURL);
      setCropStage("crop");
      setIsModalOpen(false);
    } catch (error) {
      showError("이미지 로드 오류", "이미지를 불러올 수 없습니다.");
      console.error("File upload error:", error);
    }
  };

  const handleCrop = () => {
    try {
      const cropper = cropperRef.current?.cropper;
      if (!cropper) {
        showError(
          "자르기 오류",
          "이미지를 자를 수 없습니다. 다시 시도해주세요."
        );
        return;
      }

      const croppedCanvas = cropper.getCroppedCanvas({
        width: 800, // 최대 폭 제한
        height: 600, // 최대 높이 제한
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      });

      if (!croppedCanvas) {
        showError("자르기 오류", "이미지를 자를 수 없습니다.");
        return;
      }

      const croppedDataURL = croppedCanvas.toDataURL("image/jpeg", 0.8);
      setCroppedImage(croppedDataURL);
      setCropStage("chat");

      // 이미지를 메시지로 추가
      const imageMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: `[이미지 업로드됨]`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, imageMessage]);

      // AI에게 이미지 분석 요청
      handleImageAnalysis(croppedDataURL);

      showSuccess(
        "이미지 업로드 완료",
        "이미지가 성공적으로 업로드되었습니다!"
      );
    } catch (error) {
      showError(
        "이미지 처리 오류",
        "이미지를 처리하는 중 오류가 발생했습니다."
      );
      console.error("Crop error:", error);
    }
  };

  const handleBackToChat = () => {
    setUploadedImage(null);
    setCroppedImage(null);
    setCropStage("chat");
  };

  const handleImageAnalysis = async (imageData: string) => {
    setIsLoading(true);

    try {
      // 이미지를 Blob으로 변환
      const blob = dataURItoBlob(imageData);
      const formData = new FormData();
      formData.append("image", blob, "cropped-image.png");

      // AI에게 이미지 분석 요청 (예문 생성 API 사용)
      // http 유틸리티 사용 - JWT 토큰 자동 포함
      const response = await http.post<{
        generatedExample: any;
      }>("/example", {
        formData: formData,
      });

      if (response && response.generatedExample) {
        const { generatedExample } = response;
        const actualExample =
          generatedExample.generatedExample || generatedExample;

        let analysisContent = "";
        if (actualExample.description) {
          analysisContent += `<strong>이미지 분석 결과:</strong><br/><br/>${actualExample.description}<br/><br/>`;
        }

        if (actualExample.examples && actualExample.examples.length > 0) {
          analysisContent += `<strong>학습 예문:</strong><br/>`;
          actualExample.examples.forEach((example: any, index: number) => {
            if (example.dialogue) {
              analysisContent += `<br/><strong>예문 ${
                index + 1
              }:</strong><br/>`;
              analysisContent += `A: ${example.dialogue.A?.english || ""}<br/>`;
              analysisContent += `B: ${example.dialogue.B?.english || ""}<br/>`;
            }
          });
        }

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content:
            analysisContent ||
            "이미지를 분석했습니다. 궁금한 점이 있으시면 질문해주세요!",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error("이미지 분석 결과를 받을 수 없습니다.");
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      showError("이미지 분석 오류", "이미지 분석 중 오류가 발생했습니다.");

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "이미지 분석 중 오류가 발생했습니다. 다시 시도해주세요.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const dataURItoBlob = (dataURI: string): Blob => {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F7F8FB] relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <button
          onClick={cropStage === "crop" ? handleBackToChat : onBack}
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
          <h1 className="text-lg font-semibold text-gray-800">
            {cropStage === "crop" ? "이미지 자르기" : "AI 대화"}
          </h1>
        </div>
        <div className="w-8"></div>
      </div>

      {/* Crop Stage */}
      {cropStage === "crop" && uploadedImage && (
        <div className="flex-1 flex flex-col p-4">
          <div className="mb-4">
            <p className="text-lg font-medium text-gray-800 text-center">
              어떤 부분을 분석하고 싶으신가요?
            </p>
          </div>

          <div className="h-80 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <Cropper
              src={uploadedImage}
              style={{ height: "320px", width: "100%" }}
              initialAspectRatio={16 / 9}
              guides={true}
              ref={cropperRef}
              viewMode={1}
              dragMode="move"
              autoCropArea={0.8}
              restore={false}
              modal={false}
              highlight={false}
              cropBoxMovable={true}
              cropBoxResizable={true}
              toggleDragModeOnDblclick={false}
            />
          </div>

          {/* Buttons */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleCrop}
              className="w-full py-4 bg-[#00DAAA] hover:bg-[#00C495] active:bg-[#00B085] text-white font-semibold rounded-full transition-colors shadow-lg"
            >
              선택 영역 분석하기
            </button>
            <button
              onClick={handleBackToChat}
              className="w-full py-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-medium rounded-full border border-gray-300 transition-colors"
            >
              다른 사진 선택하기
            </button>
          </div>
        </div>
      )}

      {/* Chat Stage */}
      {cropStage === "chat" && (
        <>
          {/* Date Separator */}
          <div className="px-4 py-2">
            <div className="flex items-center">
              <div className="flex-1 h-px bg-gray-300"></div>
              <div className="px-4">
                <span className="text-sm text-gray-500 font-medium">
                  {
                    new Date().toLocaleDateString("ko-KR", {
                      year: "2-digit",
                      month: "2-digit",
                      day: "2-digit",
                      weekday: "short",
                    })
                    //.replace(".", "")
                    //.replace(".", "")
                    //.replace(".", "")
                  }
                </span>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
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
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  inputMessage.trim() && !isLoading
                    ? "bg-[#00DAAA] hover:bg-[#00C495] cursor-pointer"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
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
        </>
      )}

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
