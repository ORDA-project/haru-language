import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";
import axios from "axios";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import { API_ENDPOINTS } from "../../config/api";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { http } from "../../utils/http";
import ImageUploadModal from "./ImageUploadModal";
import { Icons } from "./Icons";
import { getTodayStringBy4AM } from "../../utils/dateUtils";
import { dataURItoBlob } from "../../utils/imageUtils";

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

const StageChat = ({ onBack }: StageChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
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
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [playingExampleId, setPlayingExampleId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playingExampleIdRef = useRef<string | null>(null);
  const isPlayingTTSRef = useRef<boolean>(false);

  // 대화 내역 저장/불러오기
  const getStorageKey = () => {
    const dateKey = getTodayStringBy4AM();
    return `stage_chat_messages_${dateKey}`;
  };

  const saveMessages = (msgs: Message[]) => {
    try {
      const storageKey = getStorageKey();
      const messagesToSave = msgs.map(msg => ({
        ...msg,
        timestamp: msg.timestamp ? msg.timestamp.toISOString() : new Date().toISOString()
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
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }));
      }
    } catch (error) {
      console.error("대화 내역 불러오기 실패:", error);
    }
    return null;
  };
  
  // 큰글씨 모드에 따른 텍스트 크기 (중년층용)
  const baseFontSize = isLargeTextMode ? 18 : 16;
  const largeFontSize = isLargeTextMode ? 22 : 20;
  const headerFontSize = isLargeTextMode ? 22 : 18;
  
  const baseTextStyle: React.CSSProperties = { fontSize: `${baseFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const largeTextStyle: React.CSSProperties = { fontSize: `${largeFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const headerTextStyle: React.CSSProperties = { fontSize: `${headerFontSize}px` };
  const cropperRef = useRef<any>(null);
  const { showError, showSuccess } = useErrorHandler();

  // 오디오 정리
  const stopCurrentAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCurrentAudio();
    };
  }, [stopCurrentAudio]);

  // 초기 AI 메시지 및 저장된 대화 내역 불러오기
  useEffect(() => {
    const savedMessages = loadMessages();
    if (savedMessages && savedMessages.length > 0) {
      setMessages(savedMessages);
    } else {
      const initialMessage: Message = {
        id: "1",
        type: "ai",
        content:
          "안녕하세요! 영어 학습을 도와드릴 AI 튜터입니다. 궁금한 것이 있으시면 언제든지 질문해주세요!",
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
      saveMessages([initialMessage]);
    }
  }, []);

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

    setMessages((prev) => {
      const updated = [...prev, userMessage];
      saveMessages(updated);
      return updated;
    });
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

      setMessages((prev) => {
        const updated = [...prev, aiMessage];
        saveMessages(updated);
        return updated;
      });
    } catch (error) {
      console.error("Error sending message:", error);
      showError("오류 발생", "메시지를 전송하는 중 오류가 발생했습니다.");

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.",
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const updated = [...prev, errorMessage];
        saveMessages(updated);
        return updated;
      });
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
      setMessages((prev) => {
        const updated = [...prev, imageMessage];
        saveMessages(updated);
        return updated;
      });

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
      const fileName = blob.type === "image/jpeg" ? "cropped-image.jpg" : "cropped-image.png";
      formData.append("image", blob, fileName);

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

        // 예문 데이터 추출
        const examples: ExampleData[] = [];
        if (actualExample.examples && actualExample.examples.length > 0) {
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
        }

        // 요약 메시지
        const summaryMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: actualExample.description || "답변 요약 내용",
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

        setMessages((prev) => {
          const updated = [...prev, summaryMessage, exampleMessage];
          saveMessages(updated);
          return updated;
        });
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
      setMessages((prev) => {
        const updated = [...prev, errorMessage];
        saveMessages(updated);
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="w-full flex-1 flex flex-col bg-[#F7F8FB] relative">
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
            {messages.map((message, index) => (
              <React.Fragment key={message.id}>
                {/* 일반 메시지 */}
                {!message.examples && (
                  <div
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        message.type === "user"
                          ? "bg-gray-200 text-gray-800"
                          : "bg-gray-200 text-gray-800 shadow-sm border border-gray-100"
                      }`}
                    >
                      {/* 사용자 메시지에 이미지가 있는 경우 */}
                      {message.type === "user" && message.imageUrl && (
                        <div className="mb-2">
                          <img
                            src={message.imageUrl}
                            alt="업로드된 이미지"
                            className="w-full rounded-lg object-contain max-h-64"
                          />
                        </div>
                      )}
                      {/* 텍스트 내용 표시 (이미지가 있으면 이미지 아래에 표시) */}
                      {message.content && (
                        message.type === "ai" ? (
                          <div
                            className="leading-relaxed"
                            style={baseTextStyle}
                            dangerouslySetInnerHTML={{ __html: message.content }}
                          />
                        ) : (
                          <p className="leading-relaxed whitespace-pre-wrap" style={baseTextStyle}>
                            {message.content}
                          </p>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* 예문 카드 */}
                {message.examples && message.examples.length > 0 && (() => {
                  const currentIndex = exampleScrollIndices[message.id] ?? 0;
                  const currentExample = message.examples[currentIndex];
                  return (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] px-4 py-3 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
                      >
                        {/* Context Badge and Dots */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="inline-block bg-[#B8E6D3] rounded-full px-2 py-0.5 border border-[#B8E6D3]" style={{ marginLeft: '-4px', marginTop: '-4px' }}>
                            <span className="font-medium text-gray-900" style={{ fontSize: `${isLargeTextMode ? 16 : 12}px` }}>예문 상황</span>
                          </div>
                          <div className="flex items-center" style={{ gap: '4px' }}>
                            {message.examples && message.examples.length > 0 && [0, 1, 2].map((dotIdx) => (
                              <div
                                key={dotIdx}
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: dotIdx === currentIndex ? '#00DAAA' : '#D1D5DB',
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Dialogue */}
                        <div className="space-y-2 mb-3" style={{ paddingLeft: '8px' }}>
                          {/* A's dialogue */}
                          <div className="flex items-start space-x-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 bg-[#B8E6D3]`} style={{ fontSize: `${isLargeTextMode ? 16 : 12}px` }}>
                              A
                            </div>
                            <div className="flex-1" style={{ paddingLeft: '4px', marginTop: '-2px' }}>
                              <p className="font-medium text-gray-900 leading-relaxed" style={{ fontSize: `${isLargeTextMode ? 18 : 14}px` }}>
                                {currentExample.dialogue?.A?.english || "예문 내용"}
                              </p>
                              <p className="text-gray-600 leading-relaxed mt-1" style={{ fontSize: `${isLargeTextMode ? 18 : 14}px` }}>
                                {currentExample.dialogue?.A?.korean || "예문 한글버전"}
                              </p>
                            </div>
                          </div>

                          {/* B's dialogue */}
                          <div className="flex items-start space-x-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 bg-[#B8E6D3]`} style={{ fontSize: `${isLargeTextMode ? 16 : 12}px` }}>
                              B
                            </div>
                            <div className="flex-1" style={{ paddingLeft: '4px', marginTop: '-2px' }}>
                              <p className="font-medium text-gray-900 leading-relaxed" style={{ fontSize: `${isLargeTextMode ? 18 : 14}px` }}>
                                {currentExample.dialogue?.B?.english || "예문 내용"}
                              </p>
                              <p className="text-gray-600 leading-relaxed mt-1" style={{ fontSize: `${isLargeTextMode ? 18 : 14}px` }}>
                                {currentExample.dialogue?.B?.korean || "예문 한글버전"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex justify-center items-center gap-2 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => {
                              if (message.examples) {
                                const currentIdx = exampleScrollIndices[message.id] ?? 0;
                                const newIndex = Math.max(0, currentIdx - 1);
                                setExampleScrollIndices((prev) => ({
                                  ...prev,
                                  [message.id]: newIndex,
                                }));
                              }
                            }}
                            disabled={message.examples && (exampleScrollIndices[message.id] ?? 0) === 0}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="이전 예문"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={async () => {
                              // 재생 중이면 중지
                              const exampleId = `${message.id}-${currentIndex}`;
                              if (playingExampleId === exampleId && isPlayingTTS) {
                                if (audioRef.current) {
                                  audioRef.current.pause();
                                  audioRef.current.currentTime = 0;
                                  audioRef.current = null;
                                }
                                playingExampleIdRef.current = null;
                                isPlayingTTSRef.current = false;
                                setPlayingExampleId(null);
                                setIsPlayingTTS(false);
                                return;
                              }

                              // 안전한 접근을 위한 null 체크
                              if (!currentExample?.dialogue?.A?.english || !currentExample?.dialogue?.B?.english) {
                                showError("재생 오류", "예문 데이터가 올바르지 않습니다.");
                                return;
                              }
                              
                              const dialogueA = currentExample.dialogue.A.english;
                              const dialogueB = currentExample.dialogue.B.english;
                              const textToRead = `${dialogueA}. ${dialogueB}`;
                              
                              // 기존 오디오 정지
                              stopCurrentAudio();
                              
                              playingExampleIdRef.current = exampleId;
                              isPlayingTTSRef.current = true;
                              setPlayingExampleId(exampleId);
                              setIsPlayingTTS(true);
                              
                              try {
                                const response = await fetch(API_ENDPOINTS.tts, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ text: textToRead }),
                                  credentials: "include",
                                });
                                const { audioContent } = await response.json();
                                const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
                                audioRef.current = audio;
                                
                                audio.onended = () => {
                                  if (audioRef.current === audio) {
                                    playingExampleIdRef.current = null;
                                    isPlayingTTSRef.current = false;
                                    setPlayingExampleId(null);
                                    setIsPlayingTTS(false);
                                    audioRef.current = null;
                                  }
                                };
                                
                                audio.onerror = () => {
                                  if (audioRef.current === audio) {
                                    playingExampleIdRef.current = null;
                                    isPlayingTTSRef.current = false;
                                    setPlayingExampleId(null);
                                    setIsPlayingTTS(false);
                                    audioRef.current = null;
                                    showError("재생 오류", "오디오 재생 중 오류가 발생했습니다.");
                                  }
                                };
                                
                                audio.oncanplaythrough = async () => {
                                  // 재생 중지 상태 확인 - ref를 사용하여 최신 상태 확인
                                  if (audioRef.current === audio && playingExampleIdRef.current === exampleId && isPlayingTTSRef.current) {
                                    try {
                                      await audio.play();
                                    } catch (e) {
                                      console.error("재생 실패:", e);
                                      if (audioRef.current === audio) {
                                        playingExampleIdRef.current = null;
                                        isPlayingTTSRef.current = false;
                                        setPlayingExampleId(null);
                                        setIsPlayingTTS(false);
                                        audioRef.current = null;
                                      }
                                    }
                                  } else if (audioRef.current === audio) {
                                    // 상태가 변경되었으면 재생하지 않음
                                    audio.pause();
                                    audio.currentTime = 0;
                                    audioRef.current = null;
                                  }
                                };
                                audio.load();
                              } catch (error) {
                                console.error("TTS 오류:", error);
                                setPlayingExampleId(null);
                                setIsPlayingTTS(false);
                                if (audioRef.current) {
                                  audioRef.current = null;
                                }
                                showError("TTS 오류", "음성 생성 중 오류가 발생했습니다.");
                              }
                            }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-md ${
                              playingExampleId === `${message.id}-${currentIndex}` && isPlayingTTS
                                ? "bg-[#FF6B35] hover:bg-[#E55A2B]"
                                : "bg-[#00DAAA] hover:bg-[#00C299]"
                            }`}
                            aria-label={playingExampleId === `${message.id}-${currentIndex}` && isPlayingTTS ? "재생 중지" : "음성 재생"}
                          >
                            {playingExampleId === `${message.id}-${currentIndex}` && isPlayingTTS ? (
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              if (message.examples) {
                                const currentIdx = exampleScrollIndices[message.id] ?? 0;
                                const newIndex = Math.min(message.examples.length - 1, currentIdx + 1);
                                setExampleScrollIndices((prev) => ({
                                  ...prev,
                                  [message.id]: newIndex,
                                }));
                              }
                            }}
                            disabled={message.examples && (exampleScrollIndices[message.id] ?? 0) >= message.examples.length - 1}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="다음 예문"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </React.Fragment>
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
                    <span className="text-gray-500" style={{ fontSize: `${isLargeTextMode ? 18 : 14}px` }}>
                      AI가 답변을 준비하고 있습니다...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input - 고정 */}
          <div className="p-4 bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto" style={{ paddingBottom: 'calc(72px + 1rem)' }}>
            <div className="flex items-end space-x-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-12 h-12 bg-[#00DAAA] hover:bg-[#00C495] rounded-full flex items-center justify-center shadow-lg transition-colors flex-shrink-0"
              >
                <Icons.camera
                  className="w-5 h-5"
                  stroke="white"
                  strokeOpacity="1"
                />
              </button>
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="궁금한 것을 질문해보세요..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#00DAAA] focus:border-transparent bg-white"
                  rows={1}
                  style={{ minHeight: "48px", maxHeight: "120px", ...baseTextStyle }}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
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
