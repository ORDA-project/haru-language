import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";
import axios from "axios";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import ImageUploadModal from "./ImageUploadModal";
import { Icons } from "./Icons";
import { getTodayStringBy4AM } from "../../utils/dateUtils";
import { dataURItoBlob, MAX_IMAGE_SIZE } from "../../utils/imageUtils";
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
  imageUrl?: string;
}

interface StageChatProps {
  onBack: () => void;
}

// 예문 생성과 동일한 헬퍼 함수들
const API_TIMEOUT = 60000; // 60초 타임아웃

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const createFormDataFromImage = (image: string | File): FormData => {
  const formData = new FormData();
  if (typeof image === "string") {
    const blob = dataURItoBlob(image);
    if (blob.size > MAX_IMAGE_SIZE) {
      throw new Error("이미지 파일이 너무 큽니다. (5MB 이하로 해주세요)");
    }
    const fileName = blob.type === "image/jpeg" ? "cropped-image.jpg" : "cropped-image.png";
    formData.append("image", blob, fileName);
  } else {
    formData.append("image", image);
  }
  return formData;
};

interface ExampleApiResponse {
  generatedExample?: {
    generatedExample?: any;
    examples?: Array<any>;
    description?: string;
  };
}

const normalizeExampleResponse = (response: ExampleApiResponse) => {
  let actualExample = response?.generatedExample;
  if (actualExample?.generatedExample) {
    actualExample = actualExample.generatedExample;
  }
  return actualExample;
};

const StageChat = ({ onBack }: StageChatProps) => {
  const { messages, setMessages, addMessage } = useChatMessages();
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [cropStage, setCropStage] = useState<"chat" | "crop">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  const [exampleScrollIndices, setExampleScrollIndices] = useState<Record<string, number>>({});
  const exampleScrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // TTS 훅 사용
  const { isPlayingTTS, playingChatExampleId, playChatExampleTTS, stopTTS } = useChatTTS();
  
  // 큰글씨 모드에 따른 텍스트 크기 (중년층용)
  const baseFontSize = isLargeTextMode ? 18 : 16;
  const largeFontSize = isLargeTextMode ? 22 : 20;
  const headerFontSize = isLargeTextMode ? 22 : 18;
  
  const baseTextStyle: React.CSSProperties = { fontSize: `${baseFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const largeTextStyle: React.CSSProperties = { fontSize: `${largeFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const headerTextStyle: React.CSSProperties = { fontSize: `${headerFontSize}px` };
  const cropperRef = useRef<any>(null);
  const { showError, showSuccess } = useErrorHandler();

  useEffect(() => {
    return () => {
      stopTTS();
    };
  }, [stopTTS]);

  // 메시지 스크롤 (requestAnimationFrame 사용하여 성능 최적화)
  useEffect(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInputMessage("");
    setIsLoading(true);

    try {
      const headers = getAuthHeaders();
      
      const response = await axios.post<{
        answer: string | { answer: string };
      }>("/question", 
        { question: userMessage.content },
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

      // 원본 텍스트 그대로 저장 (예문 생성과 동일하게, 렌더링할 때만 변환)
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

  const handleCrop = async () => {
    try {
      const cropper = cropperRef.current?.cropper;
      if (!cropper) {
        showError(
          "자르기 오류",
          "이미지를 자를 수 없습니다. 다시 시도해주세요."
        );
        return;
      }

      // 사용자가 선택한 영역을 그대로 가져오되, 너무 크면 리사이즈 (OCR 성능을 위해 크기 제한)
      const croppedCanvas = cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "medium", // high -> medium으로 변경하여 처리 속도 개선
        maxWidth: 1200, // 1920 -> 1200으로 줄여서 처리 시간 단축
        maxHeight: 1200, // 1920 -> 1200으로 줄여서 처리 시간 단축
      });

      if (!croppedCanvas) {
        showError("자르기 오류", "이미지를 자를 수 없습니다.");
        return;
      }

      // 흰색 배경이 있는 새 canvas 생성
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = croppedCanvas.width;
      finalCanvas.height = croppedCanvas.height;
      const ctx = finalCanvas.getContext("2d");
      if (!ctx) {
        showError("자르기 오류", "이미지를 처리할 수 없습니다.");
        return;
      }
      
      // 흰색 배경 채우기
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      
      // 크롭된 이미지 그리기
      ctx.drawImage(croppedCanvas, 0, 0);

      // JPEG 품질을 낮춰서 파일 크기와 처리 시간 단축 (0.8 -> 0.7)
      const croppedDataURL = finalCanvas.toDataURL("image/jpeg", 0.7);
      setCroppedImage(croppedDataURL);
      setCropStage("chat");

      // 이미지를 메시지로 추가 (실제 이미지 URL 포함)
      const imageMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: "", // 텍스트 없이 이미지만 표시
        imageUrl: croppedDataURL, // 크롭된 이미지 URL 저장
        timestamp: new Date(),
      };
      addMessage(imageMessage);

      // AI에게 이미지 분석 요청 (예문 생성과 동일한 방식)
      await handleImageAnalysis(croppedDataURL);

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
      // 예문 생성과 동일한 방식으로 FormData 생성
      const formData = createFormDataFromImage(imageData);
      const headers = getAuthHeaders();
      
      if (import.meta.env.DEV) {
        console.log("이미지 분석 요청 시작...", {
          imageType: typeof imageData,
          formDataKeys: Array.from(formData.keys()),
        });
      }

      // 예문 생성과 동일한 방식으로 API 호출
      const response = await axios.post<ExampleApiResponse>("/example", formData, {
        baseURL: API_BASE_URL,
        headers: {
          ...headers,
          // Content-Type을 명시적으로 설정하지 않음 (FormData는 브라우저가 자동 설정)
        },
        withCredentials: true,
        timeout: API_TIMEOUT,
      });

      if (import.meta.env.DEV) {
        console.log("이미지 분석 응답:", response.data);
      }

      // 예문 생성과 동일한 방식으로 응답 정규화
      const actualExample = normalizeExampleResponse(response.data);

      if (!actualExample) {
        if (import.meta.env.DEV) {
          console.error("예문 데이터를 찾을 수 없습니다. 응답:", response.data);
        }
        throw new Error("예문 데이터를 찾을 수 없습니다.");
      }

      if (!actualExample.examples || !Array.isArray(actualExample.examples)) {
        if (import.meta.env.DEV) {
          console.error("예문 배열이 올바르지 않습니다. actualExample:", actualExample);
        }
        throw new Error("예문 배열이 올바르지 않습니다.");
      }

      if (actualExample.examples.length === 0) {
        throw new Error("생성된 예문이 없습니다.");
      }

      // 예문 데이터 추출
      const examples: ExampleData[] = [];
      actualExample.examples.forEach((example: any) => {
        if (example.dialogue) {
          examples.push({
            context: example.context || "예문 상황",
            dialogue: {
              A: {
                english: example.dialogue.A?.english || "",
                korean: example.dialogue.A?.korean,
              },
              B: {
                english: example.dialogue.B?.english || "",
                korean: example.dialogue.B?.korean,
              },
            },
          });
        }
      });

      if (examples.length === 0) {
        throw new Error("유효한 예문을 찾을 수 없습니다.");
      }

      // 요약 메시지 (예문 생성과 동일하게 description을 그대로 저장)
      // 서버에서 받은 이상한 패턴 제거
      let descriptionContent = actualExample.description || "이미지 분석이 완료되었습니다.";
      if (typeof descriptionContent === "string") {
        descriptionContent = descriptionContent
          .replace(/"text-decoration:\s*underline;\s*color:\s*#00DAAA;\s*font-weight:\s*500;">/gi, '')
          .replace(/"text-decoration:\s*underline;\s*color:\s*#00DAAA;\s*font-weight:\s*500;"/gi, '');
      }
      
      const summaryMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: descriptionContent,
        timestamp: new Date(),
      };

      // 예문 카드 메시지
      const exampleMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: "ai",
        content: "",
        examples: examples,
        imageUrl: croppedImage || undefined,
        timestamp: new Date(),
      };

      addMessage(summaryMessage);
      addMessage(exampleMessage);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("이미지 분석 오류 상세:", error);
        if (axios.isAxiosError(error)) {
          console.error("응답 데이터:", error.response?.data);
          console.error("응답 상태:", error.response?.status);
          console.error("요청 헤더:", error.config?.headers);
        }
      }
      
      // 예문 생성과 동일한 방식으로 에러 처리
      let errorMessage = "이미지 분석 중 오류가 발생했습니다.";
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data as any;
        errorMessage = data?.message || `서버 오류 (${status || "알 수 없음"})`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      showError("이미지 분석 오류", errorMessage);

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


  return (
    <div className="w-full flex-1 flex flex-col bg-[#F7F8FB] relative">
      {/* Header - 고정 */}
      <div className="flex items-center justify-between py-3 px-4 bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 max-w-[440px] mx-auto">
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
          <h1 className="font-semibold text-gray-800" style={headerTextStyle}>
            {cropStage === "crop" ? "이미지 자르기" : "AI 대화"}
          </h1>
        </div>
        <div className="w-8"></div>
      </div>

      {/* Crop Stage */}
      {cropStage === "crop" && uploadedImage && (
        <div className="flex-1 flex flex-col p-4">
          <div className="mb-4">
            <p className="font-medium text-gray-800 text-center" style={largeTextStyle}>
              어떤 부분을 분석하고 싶으신가요?
            </p>
          </div>

          <div className="h-80 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ touchAction: 'none' }}>
            <style>{`
              .cropper-container {
                touch-action: none !important;
              }
              .cropper-point {
                cursor: pointer !important;
              }
              .cropper-point.point-se {
                cursor: nwse-resize !important;
              }
              .cropper-point.point-sw {
                cursor: nesw-resize !important;
              }
              .cropper-point.point-nw {
                cursor: nwse-resize !important;
              }
              .cropper-point.point-ne {
                cursor: nesw-resize !important;
              }
              .cropper-point.point-n {
                cursor: ns-resize !important;
              }
              .cropper-point.point-s {
                cursor: ns-resize !important;
              }
              .cropper-point.point-w {
                cursor: ew-resize !important;
              }
              .cropper-point.point-e {
                cursor: ew-resize !important;
              }
            `}</style>
            <Cropper
              src={uploadedImage}
              style={{ height: "320px", width: "100%", touchAction: 'none' }}
              aspectRatio={NaN}
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
              zoomable={true}
              zoomOnTouch={true}
              zoomOnWheel={false}
              scalable={true}
              minCropBoxWidth={50}
              minCropBoxHeight={50}
              ready={() => {
                if (cropperRef.current?.cropper) {
                  const cropper = cropperRef.current.cropper;
                  cropper.setAspectRatio(NaN);
                }
              }}
            />
          </div>

          {/* Buttons */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleCrop}
              className="w-full py-4 bg-[#00DAAA] hover:bg-[#00C495] active:bg-[#00B085] text-white font-semibold rounded-full transition-colors shadow-lg"
              style={baseTextStyle}
            >
              선택 영역 분석하기
            </button>
            <button
              onClick={handleBackToChat}
              className="w-full py-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-medium rounded-full border border-gray-300 transition-colors"
              style={baseTextStyle}
            >
              다른 사진 선택하기
            </button>
          </div>
        </div>
      )}

      {/* Chat Stage */}
      {cropStage === "chat" && (
        <>
          {/* Date Separator - 고정 */}
          <div className="px-4 py-1 bg-white border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-1 h-px bg-gray-300"></div>
              <div className="px-4">
                <span className="text-gray-500 font-medium" style={{ fontSize: `${isLargeTextMode ? 18 : 14}px` }}>
                  {
                    new Date().toLocaleDateString("ko-KR", {
                      year: "2-digit",
                      month: "2-digit",
                      day: "2-digit",
                      weekday: "short",
                    })
                  }
                </span>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
          </div>

          {/* Messages - 스크롤 가능 */}
          <div className="flex-1 overflow-y-auto px-4 pt-2 space-y-3" style={{ paddingBottom: 'calc(72px + 5rem)' }}>
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
            onImageClick={() => setIsModalOpen(true)}
          />
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
