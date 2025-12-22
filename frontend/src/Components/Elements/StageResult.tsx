import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useAtom } from "jotai";
import { Example } from "../../types";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";
import { isLargeTextModeAtom } from "../../store/dataStore";
import { ChevronLeft, ChevronRight } from "lucide-react";
import axios, { AxiosError } from "axios";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import ImageUploadModal from "./ImageUploadModal";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import { dataURItoBlob, MAX_IMAGE_SIZE } from "../../utils/imageUtils";
import { createTextStyles } from "../../utils/styleUtils";
import { groupExamples, formatContextText, EXAMPLES_PER_GROUP } from "../../utils/exampleUtils";
import { Icons } from "./Icons";

interface StageResultProps {
  description: string;
  examples: Example[];
  extractedText?: string;
  uploadedImage?: string | null;
  errorMessage: string;
  setStage: React.Dispatch<React.SetStateAction<number>>;
  onExamplesUpdate?: (newExamples: Example[]) => void;
}

interface ExampleApiResponse {
  extractedText?: string;
  generatedExample?: {
    generatedExample?: {
      description?: string;
      examples?: Array<{
        context?: string;
        dialogue?: {
          A?: { english?: string; korean?: string };
          B?: { english?: string; korean?: string };
        };
      }>;
    };
    description?: string;
    examples?: Array<{
      context?: string;
      dialogue?: {
        A?: { english?: string; korean?: string };
        B?: { english?: string; korean?: string };
      };
    }>;
  };
}

interface GroupCurrentIndices {
  [groupIndex: number]: number;
}

// 상수
const API_TIMEOUT = 60000; // 60초 타임아웃 (OCR + GPT 처리 시간 고려)
const EXAMPLE_CARD_WIDTH = 343;
const ADD_BUTTON_WIDTH = Math.floor(EXAMPLE_CARD_WIDTH / 3); // 114px

const normalizeExampleResponse = (response: ExampleApiResponse) => {
  let actualExample = response?.generatedExample;
  if (actualExample?.generatedExample) {
    actualExample = actualExample.generatedExample;
  }
  return actualExample;
};

const transformApiExamplesToLocal = (apiExamples: Array<any>): Example[] => {
  return apiExamples.map((ex) => ({
    id: `${Date.now()}-${Math.random()}`,
    context: ex.context || "",
    dialogue: {
      A: {
        english: ex.dialogue?.A?.english || "",
        korean: ex.dialogue?.A?.korean || "",
      },
      B: {
        english: ex.dialogue?.B?.english || "",
        korean: ex.dialogue?.B?.korean || "",
      },
    },
  }));
};

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

const StageResult = ({
  description,
  examples,
  extractedText,
  uploadedImage,
  errorMessage,
  setStage,
  onExamplesUpdate,
}: StageResultProps) => {
  // State
  const [exampleGroups, setExampleGroups] = useState<Example[][]>(() => groupExamples(examples));
  const [groupCurrentIndices, setGroupCurrentIndices] = useState<GroupCurrentIndices>({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCropStage, setShowCropStage] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);
  const [newImageSets, setNewImageSets] = useState<Array<{ 
    image: string; 
    description: string; 
    exampleGroupIndex: number;
    timestamp: number;
  }>>([]);
  const cropperRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [playingExampleId, setPlayingExampleId] = useState<string | null>(null);
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 440);
  const { showError, showSuccess } = useErrorHandler();
  const isInitializedRef = useRef(false);

  // 화면 크기 감지
  useEffect(() => {
    const updateWidth = () => {
      setWindowWidth(window.innerWidth);
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    
    return () => {
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // 초기 예문이 변경되면 그룹 재생성 (초기 마운트 시에만)
  useEffect(() => {
    if (!isInitializedRef.current && examples.length > 0) {
      setExampleGroups(groupExamples(examples));
      isInitializedRef.current = true;
    }
  }, [examples]);

  // exampleGroups가 변경되면 부모 컴포넌트에 알림 (초기 로드 시에만, 수동 업데이트는 각 핸들러에서 처리)
  // 주의: 이 useEffect는 초기 로드 시에만 실행되도록 제한하여 무한 루프 방지
  // 새로운 예문 추가는 handleAddMoreExamples와 handleCropComplete에서 직접 onExamplesUpdate 호출

  // 스타일 계산 (메모이제이션)
  const textStyles = useMemo(() => createTextStyles(isLargeTextMode), [isLargeTextMode]);

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

  // 그룹 네비게이션 핸들러
  const handleNextInGroup = useCallback((groupIndex: number) => {
    setGroupCurrentIndices((prev) => {
      const group = exampleGroups[groupIndex];
      if (!group) return prev;
      const currentIdx = prev[groupIndex] || 0;
      if (currentIdx < group.length - 1) {
        return { ...prev, [groupIndex]: currentIdx + 1 };
      }
      return prev;
    });
  }, [exampleGroups]);

  const handlePreviousInGroup = useCallback((groupIndex: number) => {
    setGroupCurrentIndices((prev) => {
      const currentIdx = prev[groupIndex] || 0;
      if (currentIdx > 0) {
        return { ...prev, [groupIndex]: currentIdx - 1 };
      }
      return prev;
    });
  }, []);

  const handleDotClick = useCallback((groupIndex: number, index: number) => {
    setGroupCurrentIndices((prev) => ({ ...prev, [groupIndex]: index }));
  }, []);

  // TTS 재생
  const playDialogueSequence = useCallback(async (dialogueA: string, dialogueB: string, exampleId: string) => {
    const playSingleDialogue = async (text: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        fetch(API_ENDPOINTS.tts, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          credentials: "include",
        })
          .then((res) => {
            if (!res.ok) throw new Error("TTS 요청에 실패했습니다.");
            return res.json();
          })
          .then(({ audioContent }) => {
            const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
            audioRef.current = audio;
            
            const cleanup = () => {
              if (audioRef.current === audio) {
                audioRef.current = null;
              }
            };

            audio.onended = () => {
              resolve();
              cleanup();
            };
            
            audio.onerror = () => {
              reject(new Error("오디오 재생 실패"));
              cleanup();
            };
            
            audio.oncanplaythrough = async () => {
              try {
                await audio.play();
              } catch (playError) {
                reject(playError);
              }
            };
            
            audio.load();
          })
          .catch(reject);
      });
    };

    try {
      await playSingleDialogue(dialogueA);
      await playSingleDialogue(dialogueB);
      setIsPlayingTTS(false);
      setPlayingExampleId(null);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("TTS 오류:", error);
      }
      stopCurrentAudio();
      setIsPlayingTTS(false);
      setPlayingExampleId(null);
    }
  }, [stopCurrentAudio]);

  // 예문 생성 API 호출 (공통 로직) - 예문과 설명을 함께 반환
  const generateExamplesFromImage = useCallback(async (image: string | File): Promise<{ examples: Example[]; description: string }> => {
    try {
      const formData = createFormDataFromImage(image);
      const headers = getAuthHeaders();
      
      // FormData를 보낼 때는 Content-Type을 설정하지 않음 (브라우저가 자동으로 boundary 설정)
      // axios가 자동으로 설정하는 것을 방지하기 위해 명시적으로 제거하지 않아도 됨
      
      if (import.meta.env.DEV) {
        console.log("예문 생성 요청 시작...", {
          imageType: typeof image,
          formDataKeys: Array.from(formData.keys()),
        });
      }

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
        console.log("예문 생성 응답:", response.data);
      }

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

      return {
        examples: transformApiExamplesToLocal(actualExample.examples),
        description: actualExample.description || ""
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("예문 생성 오류 상세:", error);
        if (axios.isAxiosError(error)) {
          console.error("응답 데이터:", error.response?.data);
          console.error("응답 상태:", error.response?.status);
          console.error("요청 헤더:", error.config?.headers);
        }
      }
      throw error;
    }
  }, []);

  // 예문 추가 핸들러
  const handleAddMoreExamples = useCallback(async () => {
    if (isLoadingMore || (!uploadedImage && !extractedText)) {
      if (!uploadedImage && !extractedText) {
        showError("예문 추가 실패", "예문을 생성할 수 있는 데이터가 없습니다.");
      }
      return;
    }

    setIsLoadingMore(true);
    try {
      if (uploadedImage) {
        const { examples: newExamples } = await generateExamplesFromImage(uploadedImage);
        
        setExampleGroups((prev) => {
          const newGroups = [...prev, newExamples];
          const newGroupIndex = prev.length;
          setGroupCurrentIndices((indices) => ({
            ...indices,
            [newGroupIndex]: 0,
          }));
          
          if (import.meta.env.DEV) {
            console.log("예문 추가 완료:", {
              newGroupIndex,
              totalGroups: newGroups.length,
              newExamplesCount: newExamples.length,
            });
          }
          
          // 부모 컴포넌트에 업데이트 알림 (새로운 예문 추가 시)
          if (onExamplesUpdate) {
            const allExamples = newGroups.flat();
            onExamplesUpdate(allExamples);
          }
          return newGroups;
        });
        
        // 스크롤을 새로 추가된 예문으로 이동
        setTimeout(() => {
          const chatContainer = document.querySelector('.overflow-y-auto');
          if (chatContainer) {
            chatContainer.scrollTo({
              top: chatContainer.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 100);
        
        showSuccess("예문 추가 완료", "새로운 예문 3개가 추가되었습니다!");
      } else {
        setIsModalOpen(true);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showError("예문 추가 실패", errorMessage);
      
      if (import.meta.env.DEV) {
        console.error("예문 추가 오류:", error);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, uploadedImage, extractedText, generateExamplesFromImage, showError, showSuccess]);

  // 이미지 선택 핸들러 - 크롭 단계로 이동
  const handleImageSelect = useCallback((file: File) => {
    setIsModalOpen(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setSelectedImageForCrop(imageDataUrl);
      setShowCropStage(true);
    };
    reader.readAsDataURL(file);
  }, []);

  // 크롭 완료 핸들러
  const handleCropComplete = useCallback(async () => {
    if (!cropperRef.current?.cropper || !selectedImageForCrop) {
      showError("크롭 오류", "이미지를 자를 수 없습니다.");
      return;
    }

    try {
      const cropper = cropperRef.current.cropper;
      const croppedCanvas = cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "medium", // high -> medium으로 변경하여 처리 속도 개선
        maxWidth: 1200, // 1920 -> 1200으로 줄여서 처리 시간 단축
        maxHeight: 1200, // 1920 -> 1200으로 줄여서 처리 시간 단축
      });

      if (!croppedCanvas) {
        showError("크롭 오류", "이미지를 자를 수 없습니다.");
        return;
      }

      // 흰색 배경이 있는 새 canvas 생성
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = croppedCanvas.width;
      finalCanvas.height = croppedCanvas.height;
      const ctx = finalCanvas.getContext("2d");
      if (!ctx) {
        showError("크롭 오류", "이미지를 처리할 수 없습니다.");
        return;
      }
      
      // 흰색 배경 채우기
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      
      // 크롭된 이미지 그리기
      ctx.drawImage(croppedCanvas, 0, 0);

      // JPEG 품질을 낮춰서 파일 크기와 처리 시간 단축 (0.8 -> 0.7)
      const croppedDataURL = finalCanvas.toDataURL("image/jpeg", 0.7);
      
      // 크롭 단계 닫기
      setShowCropStage(false);
      setSelectedImageForCrop(null);
      
      // 예문 생성
      setIsLoadingMore(true);
      const { examples: newExamples, description: newDescription } = await generateExamplesFromImage(croppedDataURL);
      
      setExampleGroups((prev) => {
        const newGroups = [...prev, newExamples];
        const newGroupIndex = prev.length;
        setGroupCurrentIndices((indices) => ({
          ...indices,
          [newGroupIndex]: 0,
        }));
        
        // 새로운 이미지 세트 추가 (이미지, 설명, 예문 그룹 인덱스)
        setNewImageSets((prevSets) => [...prevSets, {
          image: croppedDataURL,
          description: newDescription,
          exampleGroupIndex: newGroupIndex,
          timestamp: Date.now(),
        }]);
        
        // 부모 컴포넌트에 업데이트 알림 (새로운 예문 추가 시)
        if (onExamplesUpdate) {
          const allExamples = newGroups.flat();
          onExamplesUpdate(allExamples);
        }
        return newGroups;
      });
      showSuccess("예문 추가 완료", "새로운 예문 3개가 추가되었습니다!");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showError("예문 생성 실패", errorMessage);
      
      if (import.meta.env.DEV) {
        console.error("이미지 예문 생성 오류:", error);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedImageForCrop, generateExamplesFromImage, showError, showSuccess]);

  // 크롭 취소 핸들러
  const handleCropCancel = useCallback(() => {
    setShowCropStage(false);
    setSelectedImageForCrop(null);
  }, []);

  // 에러 메시지 추출
  const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      if (axiosError.response) {
        const status = axiosError.response.status;
        const message = axiosError.response.data?.message || "서버에서 오류가 발생했습니다.";
        
        if (status === 400) {
          return `잘못된 요청: ${message}`;
        }
        if (status === 401) {
          return "로그인이 필요합니다. 다시 로그인해주세요.";
        }
        if (status === 500) {
          return `서버 오류: ${message}`;
        }
        return message;
      }
      if (axiosError.request) {
        return "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
      }
      if (axiosError.code === 'ECONNABORTED') {
        return "요청 시간이 초과되었습니다. 다시 시도해주세요.";
      }
      return axiosError.message || "요청 중 오류가 발생했습니다.";
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "알 수 없는 오류가 발생했습니다.";
  };

  // 예문 카드 재생 핸들러
  const handlePlayExample = useCallback((example: Example) => {
    if (playingExampleId === example.id) {
      stopCurrentAudio();
      setPlayingExampleId(null);
      setIsPlayingTTS(false);
      return;
    }

    const dialogueA = example.dialogue.A.english;
    const dialogueB = example.dialogue.B.english;
    
    stopCurrentAudio();
    setPlayingExampleId(example.id);
    setIsPlayingTTS(true);
    playDialogueSequence(dialogueA, dialogueB, example.id);
  }, [playingExampleId, stopCurrentAudio, playDialogueSequence]);

  // Early return
  if (exampleGroups.length === 0) {
    return (
      <div className="w-full h-[calc(100vh-100px)] flex flex-col items-center justify-center">
        <div className="text-center p-8">
          <p className="text-gray-600" style={textStyles.base}>
            예문을 불러오는 중 문제가 발생했습니다.
          </p>
          <button
            onClick={() => setStage(1)}
            className={`mt-4 ${isLargeTextMode ? "px-8 py-4" : "px-6 py-3"} bg-teal-400 text-white rounded-lg`}
            style={textStyles.base}
          >
            다시 시도하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#F7F8FB] relative">
      {/* Header */}
      <div className={`flex items-center justify-between ${isLargeTextMode ? "p-5" : "p-4"} bg-white border-b border-gray-200`}>
        <button
          onClick={() => setStage(1)}
          className={`${isLargeTextMode ? "w-10 h-10" : "w-8 h-8"} flex items-center justify-center`}
          aria-label="뒤로 가기"
        >
          <ChevronLeft className={`${isLargeTextMode ? "w-6 h-6" : "w-5 h-5"} text-gray-600`} />
        </button>
        <div className="text-center">
          <h1 className="font-semibold text-gray-800" style={textStyles.header}>예문 생성</h1>
        </div>
        <div className={isLargeTextMode ? "w-10" : "w-8"}></div>
      </div>

      {/* Chat Messages */}
      <div className={`flex-1 overflow-y-auto ${isLargeTextMode ? "p-5" : "p-4"} ${isLargeTextMode ? "space-y-5" : "space-y-4"} pb-20`}>
        {/* User message: Original Image */}
        {uploadedImage && (
          <div className="flex justify-end">
            <div className={`max-w-[80%] ${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"} rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100`}>
              <div className={isLargeTextMode ? "mb-4" : "mb-3"}>
                <img
                  src={uploadedImage}
                  alt="업로드된 이미지"
                  className="w-full rounded-lg object-contain max-h-64"
                />
              </div>
            </div>
          </div>
        )}

        {/* 사진에 대한 설명 */}
        {description && (
          <div className="flex justify-start">
            <div className={`max-w-[80%] ${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"} rounded-lg bg-white text-gray-900 border border-gray-200`}>
              <p 
                className="leading-relaxed whitespace-pre-wrap" 
                style={{ ...textStyles.base, color: '#111827', lineHeight: '1.6' }}
                dangerouslySetInnerHTML={{
                  __html: description
                    .replace(/\*\*(.*?)\*\*/g, '<u>$1</u>') // **텍스트** → 밑줄
                    .replace(/__(.*?)__/g, '<u>$1</u>') // __텍스트__ → 밑줄
                    .replace(/\*(.*?)\*/g, '<u>$1</u>') // *텍스트* → 밑줄
                }}
              />
            </div>
          </div>
        )}

        {/* 원본 Example Groups (새 이미지 세트에 속하지 않은 그룹들만) */}
        {exampleGroups.map((group, groupIndex) => {
          // 새로운 이미지 세트에 속한 그룹은 건너뛰기 (이미 newImageSets에서 렌더링됨)
          const isNewImageSetGroup = newImageSets.some(set => set.exampleGroupIndex === groupIndex);
          if (isNewImageSetGroup) return null;
          
          const currentIdx = groupCurrentIndices[groupIndex] || 0;
          const example = group[currentIdx];
          if (!example) {
            if (import.meta.env.DEV) {
              console.warn(`예문 그룹 ${groupIndex}의 인덱스 ${currentIdx}에 예문이 없습니다.`, {
                groupLength: group.length,
                currentIdx,
                groupCurrentIndices,
              });
            }
            return null;
          }
          
          if (import.meta.env.DEV) {
            console.log(`원본 예문 그룹 ${groupIndex} 렌더링:`, {
              groupIndex,
              currentIdx,
              exampleId: example.id,
              groupLength: group.length,
            });
          }
          
          const isCardPlaying = playingExampleId === example.id;
          
          return (
            <React.Fragment key={`group-${groupIndex}`}>
              {/* Example Card */}
              <div className="flex justify-start">
                <div 
                  className="max-w-[90%] w-full bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden" 
                  style={{ 
                    width: `${EXAMPLE_CARD_WIDTH}px`, 
                    paddingLeft: '12px', 
                    paddingTop: '12px', 
                    paddingBottom: '16px', 
                    paddingRight: '16px' 
                  }}
                >
                  {/* Context Badge and Dots */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="inline-block bg-[#B8E6D3] rounded-full px-2 py-0.5 border border-[#B8E6D3]" style={{ marginLeft: '-4px', marginTop: '-4px' }}>
                      <span className="font-medium text-gray-900" style={textStyles.xSmall}>예문 상황</span>
                    </div>
                    <div className="flex items-center" style={{ gap: '4px' }}>
                      {[0, 1, 2].map((dotIdx) => (
                        <div
                          key={dotIdx}
                          onClick={() => dotIdx < group.length && handleDotClick(groupIndex, dotIdx)}
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: dotIdx === currentIdx && dotIdx < group.length ? '#00DAAA' : '#D1D5DB',
                            cursor: dotIdx < group.length ? 'pointer' : 'default'
                          }}
                          aria-label={`예문 ${dotIdx + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Dialogue */}
                  <div className="space-y-2 mb-3" style={{ paddingLeft: '8px' }}>
                    {/* A's dialogue */}
                    <div className="flex items-start space-x-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 bg-[#B8E6D3]`} style={textStyles.xSmall}>
                        A
                      </div>
                      <div className="flex-1" style={{ paddingLeft: '4px', marginTop: '-2px' }}>
                        <p className="font-medium text-gray-900 leading-relaxed" style={textStyles.small}>
                          {example.dialogue?.A?.english || "예문 내용"}
                        </p>
                        <p className="text-gray-600 leading-relaxed mt-1" style={textStyles.small}>
                          {example.dialogue?.A?.korean || "예문 한글버전"}
                        </p>
                      </div>
                    </div>

                    {/* B's dialogue */}
                    <div className="flex items-start space-x-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 bg-[#B8E6D3]`} style={textStyles.xSmall}>
                        B
                      </div>
                      <div className="flex-1" style={{ paddingLeft: '4px', marginTop: '-2px' }}>
                        <p className="font-medium text-gray-900 leading-relaxed" style={textStyles.small}>
                          {example.dialogue?.B?.english || "예문 내용"}
                        </p>
                        <p className="text-gray-600 leading-relaxed mt-1" style={textStyles.small}>
                          {example.dialogue?.B?.korean || "예문 한글버전"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex justify-center items-center gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handlePreviousInGroup(groupIndex)}
                      disabled={currentIdx === 0}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="이전 예문"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handlePlayExample(example)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-md ${
                        isCardPlaying
                          ? "bg-[#FF6B35] hover:bg-[#E55A2B]"
                          : "bg-[#00DAAA] hover:bg-[#00C299]"
                      }`}
                      aria-label={isCardPlaying ? "재생 중지" : "음성 재생"}
                    >
                      {isCardPlaying ? (
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
                      onClick={() => handleNextInGroup(groupIndex)}
                      disabled={currentIdx >= group.length - 1}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="다음 예문"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 상황 설명 - 예문 카드 아래에 표시 */}
              {example.context && (
                <div className="flex justify-start">
                  <div 
                    className={`max-w-[80%] ${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"} rounded-lg bg-gray-50 text-gray-700 border border-gray-200`}
                    style={{
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap" style={{ ...textStyles.base, color: '#374151', lineHeight: '1.6' }}>
                      {formatContextText(example.context)}
                    </p>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* 새로운 이미지 세트들 - 각 세트는 이미지, 설명, 예문 그룹 순서로 표시 */}
        {newImageSets.map((imageSet, setIndex) => {
          const groupIndex = imageSet.exampleGroupIndex;
          const group = exampleGroups[groupIndex];
          const currentIdx = groupCurrentIndices[groupIndex] || 0;
          const example = group?.[currentIdx];
          
          return (
            <React.Fragment key={imageSet.timestamp}>
              {/* 구분선 */}
              {setIndex === 0 && exampleGroups.length > newImageSets.length && (
                <div className="border-t border-gray-300 my-4"></div>
              )}
              {setIndex > 0 && (
                <div className="border-t border-gray-300 my-4"></div>
              )}
              
              {/* 1. 새 이미지 */}
              <div className="flex justify-end">
                <div className={`max-w-[80%] ${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"} rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100`}>
                  <div className={isLargeTextMode ? "mb-4" : "mb-3"}>
                    <img
                      src={imageSet.image}
                      alt="크롭된 이미지"
                      className="w-full rounded-lg object-contain max-h-64"
                    />
                  </div>
                </div>
              </div>
              
              {/* 2. 새 이미지 설명 */}
              {imageSet.description && (
                <div className="flex justify-start">
                  <div className={`max-w-[80%] ${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"} rounded-lg bg-white text-gray-900 border border-gray-200`}>
                    <p 
                      className="leading-relaxed whitespace-pre-wrap" 
                      style={{ ...textStyles.base, color: '#111827', lineHeight: '1.6' }}
                      dangerouslySetInnerHTML={{
                        __html: imageSet.description
                          .replace(/\*\*(.*?)\*\*/g, '<u>$1</u>')
                          .replace(/__(.*?)__/g, '<u>$1</u>')
                          .replace(/\*(.*?)\*/g, '<u>$1</u>')
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* 3. 새 예문 그룹 */}
              {group && example && (
                <React.Fragment>
                  {/* Example Card */}
                  <div className="flex justify-start">
                    <div 
                      className="max-w-[90%] w-full bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden" 
                      style={{ 
                        width: `${EXAMPLE_CARD_WIDTH}px`, 
                        paddingLeft: '12px', 
                        paddingTop: '12px', 
                        paddingBottom: '16px', 
                        paddingRight: '16px' 
                      }}
                    >
                      {/* Context Badge and Dots */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="inline-block bg-[#B8E6D3] rounded-full px-2 py-0.5 border border-[#B8E6D3]" style={{ marginLeft: '-4px', marginTop: '-4px' }}>
                          <span className="font-medium text-gray-900" style={textStyles.xSmall}>예문 상황</span>
                        </div>
                        <div className="flex items-center" style={{ gap: '4px' }}>
                          {[0, 1, 2].map((dotIdx) => (
                            <div
                              key={dotIdx}
                              onClick={() => dotIdx < group.length && handleDotClick(groupIndex, dotIdx)}
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: dotIdx === currentIdx && dotIdx < group.length ? '#00DAAA' : '#D1D5DB',
                                cursor: dotIdx < group.length ? 'pointer' : 'default'
                              }}
                              aria-label={`예문 ${dotIdx + 1}`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Dialogue */}
                      <div className="space-y-2 mb-3" style={{ paddingLeft: '8px' }}>
                        {/* A's dialogue */}
                        <div className="flex items-start space-x-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 bg-[#B8E6D3]`} style={textStyles.xSmall}>
                            A
                          </div>
                          <div className="flex-1" style={{ paddingLeft: '4px', marginTop: '-2px' }}>
                            <p className="font-medium text-gray-900 leading-relaxed" style={textStyles.small}>
                              {example.dialogue?.A?.english || "예문 내용"}
                            </p>
                            <p className="text-gray-600 leading-relaxed mt-1" style={textStyles.small}>
                              {example.dialogue?.A?.korean || "예문 한글버전"}
                            </p>
                          </div>
                        </div>

                        {/* B's dialogue */}
                        <div className="flex items-start space-x-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 bg-[#00DAAA]`} style={textStyles.xSmall}>
                            B
                          </div>
                          <div className="flex-1" style={{ paddingLeft: '4px', marginTop: '-2px' }}>
                            <p className="font-medium text-gray-900 leading-relaxed" style={textStyles.small}>
                              {example.dialogue?.B?.english || "예문 내용"}
                            </p>
                            <p className="text-gray-600 leading-relaxed mt-1" style={textStyles.small}>
                              {example.dialogue?.B?.korean || "예문 한글버전"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Navigation and Play Button */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handlePreviousInGroup(groupIndex)}
                          disabled={currentIdx === 0}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            currentIdx === 0
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                          }`}
                          aria-label="이전 예문"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handlePlayExample(example)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-md ${
                            playingExampleId === example.id
                              ? "bg-[#FF6B35] hover:bg-[#E55A2B]"
                              : "bg-[#00DAAA] hover:bg-[#00C299]"
                          }`}
                          aria-label={playingExampleId === example.id ? "재생 중지" : "음성 재생"}
                        >
                          {playingExampleId === example.id ? (
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
                          onClick={() => handleNextInGroup(groupIndex)}
                          disabled={currentIdx >= group.length - 1}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            currentIdx >= group.length - 1
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                          }`}
                          aria-label="다음 예문"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* 상황 설명 - 예문 카드 아래에 표시 */}
                  {example.context && (
                    <div className="flex justify-start">
                      <div 
                        className={`max-w-[80%] ${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"} rounded-lg bg-gray-50 text-gray-800 border border-gray-200 shadow-sm`}
                        style={{ marginTop: '8px' }}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap" style={{ ...textStyles.base, lineHeight: '1.6' }}>
                          {formatContextText(example.context)}
                        </p>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              )}
            </React.Fragment>
          );
        })}

      </div>

      {/* Add Example Button - 고정 위치 (항상 보이도록) */}
      <div className="fixed bottom-20 left-4 z-20">
        <button
          onClick={handleAddMoreExamples}
          disabled={isLoadingMore}
          className="bg-[#00DAAA] hover:bg-[#00C495] active:bg-[#00B085] text-gray-900 font-semibold rounded-full transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          style={{
            minWidth: `${ADD_BUTTON_WIDTH}px`,
            height: isLargeTextMode ? '42px' : '32px',
            fontSize: isLargeTextMode ? '18px' : '14px',
            padding: isLargeTextMode ? '0 14px' : '0 12px',
            whiteSpace: 'nowrap'
          }}
          aria-label="예문 추가"
        >
          {isLoadingMore ? (
            <>
              <svg className="animate-spin flex-shrink-0" width={isLargeTextMode ? "16" : "14"} height={isLargeTextMode ? "16" : "14"} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>생성 중...</span>
            </>
          ) : (
            <>
              <svg width={isLargeTextMode ? "16" : "14"} height={isLargeTextMode ? "16" : "14"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>예문추가</span>
            </>
          )}
        </button>
      </div>

      {/* Floating Camera Button - 네비게이션 바 위에 배치 (72px + 16px = 88px) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed w-10 h-10 bg-[#00DAAA] hover:bg-[#00C495] rounded-full flex items-center justify-center shadow-lg transition-colors z-30"
        style={{ 
          bottom: '88px',
          right: windowWidth <= 440 ? '16px' : `calc((100% - 440px) / 2 + 16px)`
        }}
        aria-label="카메라 열기"
      >
        <Icons.camera
          className="w-5 h-5"
          stroke="white"
          strokeOpacity="1"
        />
      </button>

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImageSelect={handleImageSelect}
        title="새로운 사진으로 예문 생성"
      />

      {/* Crop Stage */}
      {showCropStage && selectedImageForCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="w-full h-full flex flex-col bg-[#F7F8FB] max-w-[440px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
              <button
                onClick={handleCropCancel}
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
                <h1 className="font-semibold text-gray-800" style={textStyles.header}>이미지 자르기</h1>
              </div>
              <div className="w-8"></div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col p-4">
              <div className="mb-4">
                <p className="font-medium text-gray-800 text-center" style={textStyles.base}>
                  어떤 문장을 기반으로 예문을 생성하고 싶으신가요?
                </p>
              </div>

              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                <style>{`
                  .cropper-container {
                    overflow: hidden !important;
                  }
                  .cropper-view-box {
                    outline: 2px solid #00DAAA !important;
                    outline-offset: -2px;
                  }
                  .cropper-face {
                    background-color: transparent !important;
                  }
                  .cropper-modal {
                    background-color: rgba(0, 0, 0, 0.5) !important;
                  }
                `}</style>
                <Cropper
                  src={selectedImageForCrop}
                  style={{ height: "100%", width: "100%", maxHeight: "100%", objectFit: "contain" }}
                  initialAspectRatio={16 / 9}
                  guides={true}
                  ref={cropperRef}
                  viewMode={3}
                  dragMode="move"
                  autoCropArea={0.8}
                  restore={false}
                  modal={true}
                  highlight={true}
                  cropBoxMovable={true}
                  cropBoxResizable={true}
                  toggleDragModeOnDblclick={false}
                  background={true}
                  responsive={true}
                  checkOrientation={false}
                  zoomable={false}
                  scalable={false}
                  rotatable={false}
                />
              </div>

              {/* Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleCropComplete}
                  disabled={isLoadingMore}
                  className="w-full py-4 bg-[#00DAAA] hover:bg-[#00C495] active:bg-[#00B085] text-white font-semibold rounded-full transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={textStyles.base}
                >
                  {isLoadingMore ? "생성 중..." : "선택 영역 예문 생성"}
                </button>
                <button
                  onClick={handleCropCancel}
                  className="w-full py-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-medium rounded-full border border-gray-300 transition-colors"
                  style={textStyles.base}
                >
                  다른 사진 선택하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StageResult;
