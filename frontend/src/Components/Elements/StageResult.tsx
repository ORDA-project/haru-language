import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useAtom } from "jotai";
import { Example } from "../../types";
import { isLargeTextModeAtom } from "../../store/dataStore";
import { ChevronLeft } from "lucide-react";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import ImageUploadModal from "./ImageUploadModal";
import { createTextStyles } from "../../utils/styleUtils";
import { groupExamples } from "../../utils/exampleUtils";
import { Icons } from "./Icons";
import { safeSetItem, safeGetItem } from "../../utils/storageUtils";
import { getTodayStringBy4AM } from "../../utils/dateUtils";
import { ExampleGroup } from "./StageResult/components/ExampleGroup";
import { ImageCropStage } from "./StageResult/components/ImageCropStage";
import { useStageResultTTS } from "./StageResult/hooks/useStageResultTTS";
import { useAddMoreExamples } from "./StageResult/hooks/useAddMoreExamples";
import { ExampleGenerationTooltip } from "./ExampleGenerationTooltip";

interface StageResultProps {
  description: string;
  examples: Example[];
  extractedText?: string;
  uploadedImage?: string | null;
  errorMessage: string;
  setStage: React.Dispatch<React.SetStateAction<number>>;
  newImageSets?: Array<{
    image: string;
    description: string;
    exampleGroupIndex: number;
    timestamp: number;
  }>;
  setNewImageSets?: React.Dispatch<React.SetStateAction<Array<{
    image: string;
    description: string;
    exampleGroupIndex: number;
    timestamp: number;
  }>>>;
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


const StageResult = ({
  description,
  examples,
  extractedText,
  uploadedImage,
  errorMessage,
  setStage,
  newImageSets: propNewImageSets,
  setNewImageSets: propSetNewImageSets,
  onExamplesUpdate,
}: StageResultProps) => {
  // State
  const [exampleGroups, setExampleGroups] = useState<Example[][]>(() => groupExamples(examples));
  const [groupCurrentIndices, setGroupCurrentIndices] = useState<GroupCurrentIndices>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCropStage, setShowCropStage] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);
  
  // newImageSets는 props로 받거나 내부 상태로 관리
  const [internalNewImageSets, setInternalNewImageSets] = useState<Array<{ 
    image: string; 
    description: string; 
    exampleGroupIndex: number;
    timestamp: number;
  }>>([]);
  
  const newImageSets = propNewImageSets ?? internalNewImageSets;
  const setNewImageSets = propSetNewImageSets ?? setInternalNewImageSets;
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 440);
  const { showError, showSuccess } = useErrorHandler();
  const isInitializedRef = useRef(false);
  const [groupScrollIndices, setGroupScrollIndices] = useState<Record<number, number>>({});
  const groupScrollRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [tooltipPage, setTooltipPage] = useState(1); // StageResult는 예문 생성의 2페이지(스피커, 예문추가)만 표시
  const speakerRef = useRef<HTMLButtonElement>(null);
  const addExampleRef = useRef<HTMLButtonElement>(null);
  
  // TTS 훅 사용
  const { isPlayingTTS, playingExampleId, handlePlayExample } = useStageResultTTS();
  
  // 예문 추가 훅 사용
  const {
    isLoadingMore,
    setIsLoadingMore,
    generateExamplesFromImage,
    getErrorMessage: getErrorMsg,
  } = useAddMoreExamples();

  // 화면 크기 감지 (throttling + requestAnimationFrame으로 성능 최적화)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let rafId: number | null = null;
    
    const updateWidth = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      timeoutId = setTimeout(() => {
        // 상태 업데이트를 requestAnimationFrame으로 감싸서 메인 스레드 블로킹 방지
        rafId = requestAnimationFrame(() => {
          setWindowWidth(window.innerWidth);
          rafId = null;
        });
        timeoutId = null;
      }, 150); // 150ms throttling
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth, { passive: true });
    
    return () => {
      window.removeEventListener('resize', updateWidth);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // newImageSets 저장/복원
  const getNewImageSetsStorageKey = useCallback(() => {
    const dateKey = getTodayStringBy4AM();
    return `example_new_image_sets_${dateKey}`;
  }, []);

  // 저장된 newImageSets 불러오기 (props가 없을 때만)
  useEffect(() => {
    if (propNewImageSets !== undefined) {
      // props로 관리되면 복원하지 않음
      return;
    }
    
    try {
      const storageKey = getNewImageSetsStorageKey();
      const saved = safeGetItem<Array<{ 
        image: string; 
        description: string; 
        exampleGroupIndex: number;
        timestamp: number;
      }>>(storageKey);
      
      if (saved && Array.isArray(saved) && saved.length > 0) {
        // 저장된 이미지 세트가 오늘 날짜인지 확인
        const firstSet = saved[0];
        if (firstSet && firstSet.timestamp) {
          const savedDate = new Date(firstSet.timestamp);
          const today = new Date();
          const today4AM = new Date(today);
          today4AM.setHours(4, 0, 0, 0);
          if (today < today4AM) {
            today4AM.setDate(today4AM.getDate() - 1);
          }
          
          if (savedDate >= today4AM) {
            setInternalNewImageSets(saved);
          }
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("newImageSets 복원 실패:", error);
      }
    }
  }, [getNewImageSetsStorageKey, propNewImageSets]);

  // newImageSets 변경 시 저장 (props가 없을 때만)
  useEffect(() => {
    if (propSetNewImageSets !== undefined) {
      // props로 관리되면 저장하지 않음 (부모에서 처리)
      return;
    }
    
    if (internalNewImageSets.length > 0) {
      try {
        const storageKey = getNewImageSetsStorageKey();
        safeSetItem(storageKey, internalNewImageSets);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("newImageSets 저장 실패:", error);
        }
      }
    }
  }, [internalNewImageSets, getNewImageSetsStorageKey, propSetNewImageSets]);

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
  
  // newImageSets의 그룹 인덱스 집합을 메모이제이션 (성능 최적화)
  const newImageSetGroupIndices = useMemo(() => {
    return new Set(newImageSets.map(set => set.exampleGroupIndex));
  }, [newImageSets]);

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

  // 예문 추가 핸들러
  const handleAddMoreExamples = useCallback(async (imageToUse?: string) => {
    // 사용할 이미지 결정: 파라미터로 전달된 이미지가 있으면 그것을 사용, 없으면 원본 uploadedImage 사용
    const targetImage = imageToUse || uploadedImage;
    
    if (isLoadingMore || (!targetImage && !extractedText)) {
      if (!targetImage && !extractedText) {
        showError("예문 추가 실패", "예문을 생성할 수 있는 데이터가 없습니다.");
      }
      return;
    }

    setIsLoadingMore(true);
    try {
      if (targetImage) {
        const { examples: newExamples, description: newDescription } = await generateExamplesFromImage(targetImage);
        
        // 상태 업데이트를 requestAnimationFrame으로 분할하여 성능 최적화
        requestAnimationFrame(() => {
          setExampleGroups((prev) => {
            const newGroups = [...prev, newExamples];
            const newGroupIndex = prev.length;
            
            // groupCurrentIndices 업데이트를 별도 프레임에서 처리
            requestAnimationFrame(() => {
              setGroupCurrentIndices((indices) => ({
                ...indices,
                [newGroupIndex]: 0,
              }));
            });
            
            // 추가 사진으로 생성된 경우 newImageSets에도 추가
            if (imageToUse && imageToUse !== uploadedImage) {
              requestAnimationFrame(() => {
                // 새로운 이미지 세트 추가 (같은 이미지로 여러 번 생성해도 각각 별도 세트로 추가)
                setNewImageSets((prevSets) => [...prevSets, {
                  image: imageToUse,
                  description: newDescription, // 새로 생성된 설명 사용
                  exampleGroupIndex: newGroupIndex,
                  timestamp: Date.now(),
                }]);
              });
            }
            
            if (import.meta.env.DEV) {
              console.log("예문 추가 완료:", {
                newGroupIndex,
                totalGroups: newGroups.length,
                newExamplesCount: newExamples.length,
                usedImage: imageToUse ? (imageToUse !== uploadedImage ? "추가 사진" : "원본 사진") : "없음",
              });
            }
            
            // 부모 컴포넌트에 업데이트 알림 (새로운 예문 추가 시) - 별도 프레임에서 처리
            if (onExamplesUpdate) {
              requestAnimationFrame(() => {
                const allExamples = newGroups.flat();
                onExamplesUpdate(allExamples);
              });
            }
            return newGroups;
          });
        });
        
        // 스크롤을 새로 추가된 예문으로 이동 (다음 프레임에서 실행)
        requestAnimationFrame(() => {
          const chatContainer = document.querySelector('.overflow-y-auto');
          if (chatContainer) {
            // scrollTo를 직접 실행 (smooth는 브라우저가 최적화)
            chatContainer.scrollTo({
              top: chatContainer.scrollHeight,
              behavior: 'smooth'
            });
          }
        });
        
        showSuccess("예문 추가 완료", "새로운 예문 3개가 추가되었습니다!");
      } else {
        setIsModalOpen(true);
      }
    } catch (error) {
      const errorMessage = getErrorMsg(error);
      showError("예문 추가 실패", errorMessage);
      
      if (import.meta.env.DEV) {
        console.error("예문 추가 오류:", error);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, uploadedImage, extractedText, generateExamplesFromImage, showError, showSuccess, newImageSets, getErrorMsg]);

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
  const handleCropComplete = useCallback(async (croppedDataURL: string) => {
    // 크롭 단계 닫기
    setShowCropStage(false);
    setSelectedImageForCrop(null);
    
    // 예문 생성
    setIsLoadingMore(true);
    try {
      const { examples: newExamples, description: newDescription } = await generateExamplesFromImage(croppedDataURL);
      
      // 상태 업데이트를 requestAnimationFrame으로 분할하여 성능 최적화
      requestAnimationFrame(() => {
        setExampleGroups((prev) => {
          const newGroups = [...prev, newExamples];
          const newGroupIndex = prev.length;
          
          // groupCurrentIndices 업데이트를 별도 프레임에서 처리
          requestAnimationFrame(() => {
            setGroupCurrentIndices((indices) => ({
              ...indices,
              [newGroupIndex]: 0,
            }));
          });
          
          // newImageSets 업데이트를 별도 프레임에서 처리
          requestAnimationFrame(() => {
            setNewImageSets((prevSets) => [...prevSets, {
              image: croppedDataURL,
              description: newDescription,
              exampleGroupIndex: newGroupIndex,
              timestamp: Date.now(),
            }]);
          });
          
          // 부모 컴포넌트에 업데이트 알림 (새로운 예문 추가 시) - 별도 프레임에서 처리
          if (onExamplesUpdate) {
            requestAnimationFrame(() => {
              const allExamples = newGroups.flat();
              onExamplesUpdate(allExamples);
            });
          }
          return newGroups;
        });
      });
      showSuccess("예문 추가 완료", "새로운 예문 3개가 추가되었습니다!");
    } catch (error) {
      const errorMessage = getErrorMsg(error);
      showError("예문 생성 실패", errorMessage);
      
      if (import.meta.env.DEV) {
        console.error("이미지 예문 생성 오류:", error);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [generateExamplesFromImage, showError, showSuccess, getErrorMsg, setNewImageSets, onExamplesUpdate]);

  // 크롭 취소 핸들러
  const handleCropCancel = useCallback(() => {
    setShowCropStage(false);
    setSelectedImageForCrop(null);
  }, []);


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
    <div className="w-full flex-1 flex flex-col bg-[#F7F8FB] relative">
      {/* Header - 고정 */}
      <div className={`flex items-center justify-between ${isLargeTextMode ? "py-3 px-5" : "py-3 px-4"} bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 max-w-[440px] mx-auto`} style={{ height: isLargeTextMode ? "56px" : "48px" }}>
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
      <div className={`flex-1 overflow-y-auto ${isLargeTextMode ? "p-5" : "p-4"} ${isLargeTextMode ? "space-y-5" : "space-y-4"} pb-20`} style={{ paddingTop: isLargeTextMode ? 'calc(80px + 1.25rem)' : 'calc(64px + 1rem)' }}>
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
            <div 
              className={`${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"} rounded-lg bg-white text-gray-900 border border-gray-200`}
              style={{ width: "343px" }}
            >
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
          // Set을 사용하여 O(1) 조회로 성능 최적화
          if (newImageSetGroupIndices.has(groupIndex)) return null;
          
          const currentIdx = groupCurrentIndices[groupIndex] || 0;
          const example = group?.[currentIdx];
          if (!example || !group || group.length === 0) {
            if (import.meta.env.DEV) {
              console.warn(`예문 그룹 ${groupIndex}의 인덱스 ${currentIdx}에 예문이 없습니다.`, {
                groupLength: group?.length || 0,
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
          
          return (
            <React.Fragment key={`group-${groupIndex}`}>
              <ExampleGroup
                group={group}
                groupIndex={groupIndex}
                currentIndex={currentIdx}
                groupScrollIndex={groupScrollIndices[groupIndex] ?? currentIdx}
                isPlaying={isPlayingTTS}
                playingExampleId={playingExampleId || ""}
                isLargeTextMode={isLargeTextMode}
                textStyles={textStyles}
                onPrevious={() => handlePreviousInGroup(groupIndex)}
                onNext={() => handleNextInGroup(groupIndex)}
                onPlay={handlePlayExample}
                onDotClick={(index) => handleDotClick(groupIndex, index)}
                showAddButton={groupIndex === exampleGroups.length - 1 && !newImageSetGroupIndices.has(groupIndex)}
                onAddMore={() => handleAddMoreExamples()}
                isLoadingMore={isLoadingMore}
                speakerRef={groupIndex === 0 ? speakerRef : undefined}
                addExampleRef={groupIndex === exampleGroups.length - 1 && !newImageSetGroupIndices.has(groupIndex) ? addExampleRef : undefined}
              />
            </React.Fragment>
          );
        })}

        {/* 새로운 이미지 세트들 - 각 세트는 이미지, 설명, 예문 그룹 순서로 표시 */}
        {newImageSets.map((imageSet, setIndex) => {
          const groupIndex = imageSet.exampleGroupIndex;
          const group = exampleGroups?.[groupIndex];
          const currentIdx = groupCurrentIndices[groupIndex] || 0;
          const example = group?.[currentIdx];
          
          // 그룹이나 예문이 없으면 렌더링하지 않음
          if (!group || !example || group.length === 0) {
            return null;
          }
          
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
                  <div 
                    className={`${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"} rounded-lg bg-white text-gray-900 border border-gray-200`}
                    style={{ width: "343px" }}
                  >
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
                <ExampleGroup
                  group={group}
                  groupIndex={groupIndex}
                  currentIndex={currentIdx}
                  groupScrollIndex={groupScrollIndices[groupIndex] ?? currentIdx}
                  isPlaying={isPlayingTTS}
                  playingExampleId={playingExampleId || ""}
                  isLargeTextMode={isLargeTextMode}
                  textStyles={textStyles}
                  onPrevious={() => handlePreviousInGroup(groupIndex)}
                  onNext={() => handleNextInGroup(groupIndex)}
                  onPlay={handlePlayExample}
                  onDotClick={(index) => handleDotClick(groupIndex, index)}
                  showAddButton={true}
                  onAddMore={() => handleAddMoreExamples(imageSet.image)}
                  isLoadingMore={isLoadingMore}
                  addExampleRef={setIndex === newImageSets.length - 1 ? addExampleRef : undefined}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* 로딩 상태 표시 - 추가 예문 생성 중일 때 */}
        {isLoadingMore && !showCropStage && (
          <div className="flex justify-center items-center py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-3 h-3 bg-[#00DAAA] rounded-full animate-bounce"></div>
                  <div
                    className="w-3 h-3 bg-[#00DAAA] rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-3 h-3 bg-[#00DAAA] rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
              <p className="text-gray-600 font-medium" style={textStyles.base}>
                예문을 준비하고 있습니다...
              </p>
            </div>
          </div>
        )}

      </div>

      {/* 카메라 버튼 - 고정 위치 */}
      <div className="fixed bottom-24 right-0 left-0 z-40 max-w-[440px] mx-auto flex justify-end pr-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-12 h-12 bg-[#00DAAA] hover:bg-[#00C495] rounded-full flex items-center justify-center shadow-lg transition-colors"
          aria-label="카메라 열기"
        >
          <Icons.camera
            className="w-6 h-6"
            stroke="white"
            strokeOpacity="1"
          />
        </button>
      </div>

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImageSelect={handleImageSelect}
        title="새로운 사진으로 예문 생성"
      />

      {/* Crop Stage */}
      {showCropStage && selectedImageForCrop && (
        <ImageCropStage
          selectedImage={selectedImageForCrop}
          isLoading={isLoadingMore}
          isLargeTextMode={isLargeTextMode}
          textStyles={textStyles}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {/* 예문 생성 툴팁 (2페이지) */}
      <ExampleGenerationTooltip
        currentPage={tooltipPage}
        speakerRef={speakerRef}
        addExampleRef={addExampleRef}
        onNext={() => {}}
        onClose={() => {}}
      />
    </div>
  );
};

export default StageResult;
