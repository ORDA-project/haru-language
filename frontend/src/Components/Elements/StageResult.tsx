import React, { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { Example } from "../../types";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";
import { isLargeTextModeAtom } from "../../store/dataStore";
import { ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import ImageUploadModal from "./ImageUploadModal";

interface StageResultProps {
  description: string;
  examples: Example[];
  extractedText?: string;
  uploadedImage?: string | null;
  errorMessage: string;
  setStage: React.Dispatch<React.SetStateAction<number>>;
}

const StageResult = ({
  description,
  examples,
  extractedText,
  uploadedImage,
  errorMessage,
  setStage,
}: StageResultProps) => {
  // 예문을 3개씩 그룹화하여 관리
  const [exampleGroups, setExampleGroups] = useState<Example[][]>(() => {
    // 초기 예문을 3개씩 그룹화
    const groups: Example[][] = [];
    for (let i = 0; i < examples.length; i += 3) {
      groups.push(examples.slice(i, i + 3));
    }
    return groups;
  });
  // 각 그룹의 현재 인덱스 (그룹 인덱스 -> 예문 인덱스)
  const [groupCurrentIndices, setGroupCurrentIndices] = useState<{ [key: number]: number }>({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [playingExampleId, setPlayingExampleId] = useState<string | null>(null);
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  const { showError, showSuccess } = useErrorHandler();
  
  // 큰글씨 모드에 따른 텍스트 크기 (px 단위로 명시적 설정)
  const baseFontSize = isLargeTextMode ? 20 : 16;
  const smallFontSize = isLargeTextMode ? 18 : 14;
  const xSmallFontSize = isLargeTextMode ? 16 : 12;
  const headerFontSize = isLargeTextMode ? 24 : 20;
  
  // 스타일 객체 생성
  const baseTextStyle: React.CSSProperties = { 
    fontSize: `${baseFontSize}px`, 
    wordBreak: 'keep-all', 
    overflowWrap: 'break-word' as const 
  };
  const smallTextStyle: React.CSSProperties = { 
    fontSize: `${smallFontSize}px`, 
    wordBreak: 'keep-all', 
    overflowWrap: 'break-word' as const 
  };
  const xSmallTextStyle: React.CSSProperties = { 
    fontSize: `${xSmallFontSize}px`, 
    wordBreak: 'keep-all', 
    overflowWrap: 'break-word' as const 
  };
  const headerTextStyle: React.CSSProperties = { 
    fontSize: `${headerFontSize}px` 
  };

  const stopCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCurrentAudio();
    };
  }, []);

  // 그룹 내에서 다음 예문으로 이동
  const handleNextInGroup = (groupIndex: number) => {
    const group = exampleGroups[groupIndex];
    if (!group) return;
    const currentIdx = groupCurrentIndices[groupIndex] || 0;
    if (currentIdx < group.length - 1) {
      setGroupCurrentIndices((prev) => ({
        ...prev,
        [groupIndex]: currentIdx + 1,
      }));
    }
  };

  // 그룹 내에서 이전 예문으로 이동
  const handlePreviousInGroup = (groupIndex: number) => {
    const currentIdx = groupCurrentIndices[groupIndex] || 0;
    if (currentIdx > 0) {
      setGroupCurrentIndices((prev) => ({
        ...prev,
        [groupIndex]: currentIdx - 1,
      }));
    }
  };

  // 그룹 내에서 특정 인덱스로 이동
  const handleDotClick = (groupIndex: number, index: number) => {
    setGroupCurrentIndices((prev) => ({
      ...prev,
      [groupIndex]: index,
    }));
  };

  // A와 B를 순차적으로 재생하는 함수
  const playDialogueSequence = async (dialogueA: string, dialogueB: string, exampleId: string) => {
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
            audio.onended = () => {
              resolve();
              if (audioRef.current === audio) {
                audioRef.current = null;
              }
            };
            audio.onerror = () => {
              reject(new Error("오디오 재생 실패"));
              if (audioRef.current === audio) {
                audioRef.current = null;
              }
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
      // A 재생
      await playSingleDialogue(dialogueA);
      // B 재생
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
  };

  const handleAddMoreExamples = async () => {
    if (isLoadingMore) return;

    // 이미지가 있으면 이미지로 다시 생성, 없으면 extractedText 사용
    if (!uploadedImage && !extractedText) {
      showError("예문 추가 실패", "예문을 생성할 수 있는 데이터가 없습니다.");
      return;
    }

    setIsLoadingMore(true);
    try {
      // 이미지가 있으면 이미지로 다시 생성
      if (uploadedImage) {
        const blob = dataURItoBlob(uploadedImage);
        const formData = new FormData();
        formData.append("image", blob, "cropped-image.png");

        const token = localStorage.getItem("accessToken");
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await axios.post("/example", formData, {
          baseURL: API_BASE_URL,
          headers,
          withCredentials: true,
          timeout: 30000,
        });

        if (response.data?.generatedExample?.examples) {
          const newExamples = response.data.generatedExample.examples.map(
            (ex: any) => ({
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
            })
          );
          // 새로운 그룹으로 추가
          setExampleGroups((prev) => [...prev, newExamples]);
          // 새 그룹의 첫 번째 예문으로 설정
          const newGroupIndex = exampleGroups.length;
          setGroupCurrentIndices((prev) => ({
            ...prev,
            [newGroupIndex]: 0,
          }));
          showSuccess("예문 추가 완료", "새로운 예문 3개가 추가되었습니다!");
        } else {
          throw new Error("예문 생성에 실패했습니다.");
        }
      } else {
        // extractedText만 있는 경우는 이미지 업로드 모달 열기
        setIsModalOpen(true);
        setIsLoadingMore(false);
      }
    } catch (error: any) {
      console.error("예문 추가 오류:", error);
      showError("예문 추가 실패", "예문을 추가하는 중 오류가 발생했습니다.");
      setIsLoadingMore(false);
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

  const handleImageSelect = async (file: File) => {
    setIsModalOpen(false);
    setIsLoadingMore(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const token = localStorage.getItem("accessToken");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await axios.post("/example", formData, {
        baseURL: API_BASE_URL,
        headers,
        withCredentials: true,
        timeout: 30000,
      });

      if (response.data?.generatedExample?.examples) {
        const newExamples = response.data.generatedExample.examples.map(
          (ex: any) => ({
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
          })
        );
        // 새로운 그룹으로 추가
        setExampleGroups((prev) => [...prev, newExamples]);
        // 새 그룹의 첫 번째 예문으로 설정
        const newGroupIndex = exampleGroups.length;
        setGroupCurrentIndices((prev) => ({
          ...prev,
          [newGroupIndex]: 0,
        }));
        showSuccess("예문 추가 완료", "새로운 예문 3개가 추가되었습니다!");
      }
    } catch (error) {
      console.error("이미지 예문 생성 오류:", error);
      showError("예문 생성 실패", "이미지에서 예문을 생성하는 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (exampleGroups.length === 0) {
    return (
      <div className="w-full h-[calc(100vh-100px)] flex flex-col items-center justify-center">
        <div className="text-center p-8">
          <p className="text-gray-600" style={baseTextStyle}>
            예문을 불러오는 중 문제가 발생했습니다.
          </p>
          <button
            onClick={() => setStage(1)}
            className={`mt-4 ${isLargeTextMode ? "px-8 py-4" : "px-6 py-3"} bg-teal-400 text-white rounded-lg`}
            style={baseTextStyle}
          >
            다시 시도하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#F7F8FB]">
      {/* Header */}
      <div className={`flex items-center justify-between ${isLargeTextMode ? "p-5" : "p-4"} bg-white border-b border-gray-200`}>
        <button
          onClick={() => setStage(1)}
          className={`${isLargeTextMode ? "w-10 h-10" : "w-8 h-8"} flex items-center justify-center`}
        >
          <ChevronLeft className={`${isLargeTextMode ? "w-6 h-6" : "w-5 h-5"} text-gray-600`} />
        </button>
        <div className="text-center">
          <h1 className="font-semibold text-gray-800" style={headerTextStyle}>예문 생성</h1>
        </div>
        <div className={isLargeTextMode ? "w-10" : "w-8"}></div>
      </div>

      {/* Chat Messages */}
      <div className={`flex-1 overflow-y-auto ${isLargeTextMode ? "p-5" : "p-4"} ${isLargeTextMode ? "space-y-5" : "space-y-4"}`}>
        {/* User message: Image */}
        {uploadedImage && (
          <div className="flex justify-end">
            <div className={`max-w-[80%] ${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"} rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100`}>
              <div className={isLargeTextMode ? "mb-4" : "mb-3"}>
                <img
                  src={uploadedImage}
                  alt="Uploaded"
                  className="w-full rounded-lg object-contain max-h-64"
                />
              </div>
            </div>
          </div>
        )}

        {/* 사진에 대한 설명 - AI 메시지 형태로 표시 */}
        {description && (
          <div className="flex justify-start">
            <div className={`max-w-[80%] ${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"} rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100`}>
              <p className="leading-relaxed" style={baseTextStyle}>
                {description}
              </p>
            </div>
          </div>
        )}

        {/* Example Groups - 각 그룹을 세로로 표시 */}
        {exampleGroups.map((group, groupIndex) => {
          const currentIdx = groupCurrentIndices[groupIndex] || 0;
          const example = group[currentIdx];
          if (!example) return null;
          
          const isCardPlaying = playingExampleId === example.id;
          
          return (
            <React.Fragment key={`group-${groupIndex}`}>
              {/* 상황 설명 - AI 메시지 형태로 각 예문 위에 표시 */}
              <div className="flex justify-start">
                <div className={`max-w-[80%] ${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"} rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100`}>
                  <p className="leading-relaxed" style={baseTextStyle}>
                    {example.context || "이런 상황에서 사용할 수 있는 대화예요!"}
                  </p>
                </div>
              </div>

              {/* Example Card */}
              <div className="flex justify-start">
                <div className="max-w-[90%] w-full bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden" style={{ width: '343px', paddingLeft: '12px', paddingTop: '12px', paddingBottom: '16px', paddingRight: '16px' }}>
                  {/* Context Badge and Dots */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="inline-block bg-[#B8E6D3] rounded-full px-2 py-0.5 border border-[#B8E6D3]" style={{ marginLeft: '-4px', marginTop: '-4px' }}>
                      <span className="font-medium text-gray-900" style={xSmallTextStyle}>예문 상황</span>
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
                        />
                      ))}
                    </div>
                  </div>

                  {/* Dialogue */}
                  <div className="space-y-2 mb-3" style={{ paddingLeft: '8px' }}>
                    {/* A's dialogue */}
                    <div className="flex items-start space-x-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 bg-[#B8E6D3]`} style={xSmallTextStyle}>
                        A
                      </div>
                      <div className="flex-1" style={{ paddingLeft: '4px', marginTop: '-2px' }}>
                        <p className="font-medium text-gray-900 leading-relaxed" style={smallTextStyle}>
                          {example.dialogue?.A?.english || "예문 내용"}
                        </p>
                        <p className="text-gray-600 leading-relaxed mt-1" style={smallTextStyle}>
                          {example.dialogue?.A?.korean || "예문 한글버전"}
                        </p>
                      </div>
                    </div>

                    {/* B's dialogue */}
                    <div className="flex items-start space-x-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 bg-[#B8E6D3]`} style={xSmallTextStyle}>
                        B
                      </div>
                      <div className="flex-1" style={{ paddingLeft: '4px', marginTop: '-2px' }}>
                        <p className="font-medium text-gray-900 leading-relaxed" style={smallTextStyle}>
                          {example.dialogue?.B?.english || "예문 내용"}
                        </p>
                        <p className="text-gray-600 leading-relaxed mt-1" style={smallTextStyle}>
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
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        if (isCardPlaying) {
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
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-md ${
                        isCardPlaying
                          ? "bg-[#FF6B35] hover:bg-[#E55A2B]"
                          : "bg-[#00DAAA] hover:bg-[#00C299]"
                      }`}
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
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* Add Example Button - 왼쪽 하단에 위치 */}
        <div className={`flex justify-start ${isLargeTextMode ? "mt-4" : "mt-2"}`}>
          <button
            onClick={handleAddMoreExamples}
            disabled={isLoadingMore}
            className={`${isLargeTextMode ? "px-6 py-2.5" : "px-5 py-2"} bg-[#00DAAA] hover:bg-[#00C495] active:bg-[#00B085] text-gray-900 font-semibold rounded-full transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
            style={baseTextStyle}
          >
            {isLoadingMore ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                생성 중...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                예문추가
              </>
            )}
          </button>
        </div>
      </div>

      {/* Floating Camera Button - 오른쪽 하단에 위치 (하단 네비게이션 바로 위) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-[#00DAAA] hover:bg-[#00C495] rounded-full flex items-center justify-center shadow-lg transition-colors z-30"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImageSelect={handleImageSelect}
        title="새로운 사진으로 예문 생성"
      />
    </div>
  );
};

export default StageResult;
