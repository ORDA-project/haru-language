import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";
import { useGetQuestionsByUserId, useDeleteQuestion } from "../../entities/questions/queries";
import { useGetExampleHistory, useDeleteExample } from "../../entities/examples/queries";
import { useWritingRecords, useDeleteWritingRecord } from "../../entities/writing/queries";
import { useWritingQuestions } from "../../entities/writing/queries";
import { useGenerateTTS } from "../../entities/tts/queries";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import NavBar from "../Templates/Navbar";
import { createExtendedTextStyles } from "../../utils/styleUtils";
import { getTodayStringBy4AM } from "../../utils/dateUtils";
import { removeExamplesFromStorage, removeChatMessagesFromStorage } from "../../utils/storageUtils";

type ExampleDialogue = {
  speaker: string;
  english: string;
  korean?: string;
};

type ExampleItem = {
  context: string;
  dialogues: ExampleDialogue[];
};

const QuestionDetail = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(date || "");
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [currentPlayingExampleId, setCurrentPlayingExampleId] = useState<number | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState<Record<number, number>>({});
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedExampleIds, setSelectedExampleIds] = useState<Set<number>>(new Set());
  const [isDeleteModeWriting, setIsDeleteModeWriting] = useState(false);
  const [selectedWritingIds, setSelectedWritingIds] = useState<Set<number>>(new Set());
  const [isDeleteModeQuestion, setIsDeleteModeQuestion] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<number>>(new Set());
  const ttsMutation = useGenerateTTS();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { showWarning, showError, showSuccess } = useErrorHandler();
  const deleteWritingRecordMutation = useDeleteWritingRecord();
  const deleteExampleMutation = useDeleteExample();
  const deleteQuestionMutation = useDeleteQuestion();
  
  // 스타일 계산 (메모이제이션)
  const textStyles = useMemo(() => createExtendedTextStyles(isLargeTextMode), [isLargeTextMode]);
  
  // 하위 호환성을 위한 별칭
  const baseTextStyle = textStyles.base;
  const smallTextStyle = textStyles.small;
  const xSmallTextStyle = textStyles.xSmall;
  const headerTextStyle = textStyles.header;
  const correctionTextStyle = textStyles.correction;
  const feedbackTextStyle = textStyles.feedback;

  // 해당 날짜의 질문들 가져오기 (현재 로그인한 사용자)
  const { data: questionsData, isLoading: questionsLoading } =
    useGetQuestionsByUserId();
  const { data: exampleHistory, isLoading: examplesLoading } =
    useGetExampleHistory();
  const { data: writingRecordsData, isLoading: writingRecordsLoading } =
    useWritingRecords();
  const { data: writingQuestionsData } = useWritingQuestions();

  useEffect(() => {
    if (date && date !== selectedDate) {
      setSelectedDate(date);
    }
  }, [date]);

  // 한국 시간 기준으로 날짜 문자열 추출 (YYYY-MM-DD)
  const getDateString = (dateValue: string | Date): string => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    // 한국 시간으로 변환
    const koreaTime = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    const year = koreaTime.getFullYear();
    const month = String(koreaTime.getMonth() + 1).padStart(2, '0');
    const day = String(koreaTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const availableDates = useMemo(() => {
    const dates = new Set<string>();

    const extractDate = (value?: string | null) => {
      if (!value) return;
      const dateStr = getDateString(value);
      if (dateStr) dates.add(dateStr);
    };

    questionsData?.data?.forEach((question) => extractDate(question.created_at));
    exampleHistory?.data?.forEach((example) =>
      extractDate(example.created_at || example.createdAt)
    );
    writingRecordsData?.data?.forEach((record: any) =>
      extractDate(record.created_at)
    );

    return Array.from(dates).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
  }, [questionsData?.data, exampleHistory?.data, writingRecordsData?.data]);

  useEffect(() => {
    if (!selectedDate && availableDates.length > 0) {
      const fallback = availableDates[0];
      setSelectedDate(fallback);
      navigate(`/question-detail/${fallback}`, { replace: true });
    }
  }, [availableDates, selectedDate, navigate]);

  const targetDate = useMemo(() => {
    if (!selectedDate) return "";
    return selectedDate; // 이미 YYYY-MM-DD 형식
  }, [selectedDate]);

  const questions = useMemo(() => {
    if (!questionsData?.data || !targetDate) return [];
    return questionsData.data.filter((q) => {
      if (!q.created_at) return false;
      const questionDate = getDateString(q.created_at);
      return questionDate === targetDate;
    });
  }, [questionsData?.data, targetDate]);

  const exampleRecords = useMemo(() => {
    const parseGeneratedExample = (rawDescription?: string) => {
      if (!rawDescription) {
        return null;
      }

      const firstBrace = rawDescription.indexOf("{");
      const lastBrace = rawDescription.lastIndexOf("}");
      if (firstBrace === -1 || lastBrace === -1) {
        return null;
      }

      const candidate = rawDescription.slice(firstBrace, lastBrace + 1);

      try {
        const parsed = JSON.parse(candidate);
        if (parsed?.generatedExample) {
          return parsed.generatedExample;
        }
        return parsed;
      } catch {
        return null;
      }
    };

    if (!exampleHistory?.data || !targetDate) return [];
    return exampleHistory.data
      .filter((example) => {
        const createdAt =
          example.created_at || example.createdAt || new Date().toISOString();
        const exampleDate = getDateString(createdAt);
        return exampleDate === targetDate;
      })
      .map((example) => {
        const rawDescription = example.description;
        let generated =
          parseGeneratedExample(rawDescription) ||
          (typeof (example as any).generatedExample === "string"
            ? parseGeneratedExample((example as any).generatedExample)
            : (example as any).generatedExample);
        
        // images 필드 포함
        const images = (example as any).images || null;

        let description =
          generated?.description ||
          rawDescription ||
          example.extracted_sentence ||
          "이미지에서 예문을 생성했어요.";

        if (!generated?.description && rawDescription) {
          const match = rawDescription.match(
            /"description"\s*:\s*"([^"]*)"/
          );
          if (match?.[1]) {
            description = match[1].replace(/\\"/g, '"');
          }
        }

        // DB에서 가져온 ExampleItem들을 context별로 그룹화
        const exampleItemsFromDb = example.ExampleItems || [];
        
        // Generated 예문들을 context별로 그룹화
        const exampleItemsFromGenerated: ExampleItem[] = generated?.examples?.map((item: any) => ({
          context: item.context || "",
          dialogues: (() => {
            if (!item?.dialogue) return [];
            const { A, B } = item.dialogue;
            const normalized: ExampleDialogue[] = [];
            if (A?.english) {
              normalized.push({
                speaker: "A",
                english: A.english,
                korean: A.korean,
              });
            }
            if (B?.english) {
              normalized.push({
                speaker: "B",
                english: B.english,
                korean: B.korean,
              });
            }
            return normalized;
          })(),
        })) || [];

        // DB 데이터를 우선 사용, 없으면 generated 데이터 사용
        const exampleItems: ExampleItem[] = exampleItemsFromDb.length > 0
          ? exampleItemsFromDb.map((item) => ({
              context: item.context || "",
              dialogues: (item.Dialogues || []).map((d: { speaker: string; english: string; korean?: string }) => ({
                speaker: d.speaker,
                english: d.english,
                korean: d.korean,
              })),
            }))
          : exampleItemsFromGenerated.filter(
              (item: ExampleItem) => item.dialogues.length > 0
            );

        return {
          id: example.id,
          description,
          exampleItems, // 모든 예문 항목들을 배열로 반환
          extractedSentence: example.extracted_sentence || example.extractedSentence, // 이미지에서 추출한 텍스트
          images: images, // 예문 생성에 사용된 이미지 URL 배열
        };
      });
  }, [exampleHistory?.data, targetDate]);

  // Writing 기록 필터링
  const writingRecords = useMemo(() => {
    if (!writingRecordsData?.data || !targetDate) return [];
    return writingRecordsData.data.filter((record: any) => {
      if (!record.created_at) return false;
      const recordDate = getDateString(record.created_at);
      return recordDate === targetDate;
    });
  }, [writingRecordsData?.data, targetDate]);

  // Writing 질문 맵 생성 (writing_question_id로 질문 찾기)
  const writingQuestionMap = useMemo(() => {
    const map = new Map();
    writingQuestionsData?.data?.forEach((q: any) => {
      map.set(q.id, q);
    });
    return map;
  }, [writingQuestionsData?.data]);

  const isLoading = questionsLoading || examplesLoading || writingRecordsLoading;

  const currentIndex = availableDates.findIndex(
    (d) => d === selectedDate
  );
  const previousDate =
    currentIndex >= 0 && currentIndex < availableDates.length - 1
      ? availableDates[currentIndex + 1]
      : null;
  const nextDate = currentIndex > 0 ? availableDates[currentIndex - 1] : null;

  const handleNavigateToDate = (newDate: string) => {
    if (!newDate || newDate === selectedDate) return;
    setSelectedDate(newDate);
    navigate(`/question-detail/${newDate}`, { replace: true });
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue) {
      handleNavigateToDate(newValue);
    }
  };

  const formatDisplayDate = (isoDate?: string) => {
    if (!isoDate) return "날짜 선택";
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return "날짜 선택";
    return parsed.toLocaleDateString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  // 현재 예문 항목 인덱스 가져오기
  const getCurrentItemIndex = (exampleId: number, totalItems: number) => {
    return currentItemIndex[exampleId] ?? 0;
  };

  // 예문 항목 인덱스 변경
  const handleItemIndexChange = (exampleId: number, direction: 'prev' | 'next' | 'set', totalItems: number, targetIndex?: number) => {
    const currentIndex = getCurrentItemIndex(exampleId, totalItems);
    let newIndex = currentIndex;
    
    if (direction === 'set' && targetIndex !== undefined) {
      newIndex = targetIndex;
    } else if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : totalItems - 1;
    } else {
      newIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : 0;
    }
    
    setCurrentItemIndex(prev => ({
      ...prev,
      [exampleId]: newIndex
    }));
  };

  // 스피커 버튼 클릭 핸들러 - 현재 화면에 보이는 예문 항목의 A와 B만 TTS로 읽기
  const handleSpeakerClick = async (example: any) => {
    // 이미 재생 중이면 중지
    if (isPlayingTTS && currentPlayingExampleId === example.id) {
      // 오디오 재생 중지
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0; // 재생 위치 초기화
        audioRef.current = null;
      }
      
      // 브라우저 TTS도 중지
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      
      setIsPlayingTTS(false);
      setCurrentPlayingExampleId(null);
      return;
    }
    
    // 다른 예문이 재생 중이면 먼저 중지
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    
    // 브라우저 TTS도 중지
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    try {
      setIsPlayingTTS(true);
      setCurrentPlayingExampleId(example.id);

      // 현재 화면에 보이는 예문 항목의 A와 B만 수집
      let textToRead = "";
      if (example.exampleItems && example.exampleItems.length > 0) {
        const currentIndex = getCurrentItemIndex(example.id, example.exampleItems.length);
        const currentItem = example.exampleItems[currentIndex];
        if (currentItem && currentItem.dialogues && currentItem.dialogues.length > 0) {
          const englishTexts: string[] = [];
          currentItem.dialogues.forEach((dialogue: ExampleDialogue) => {
            if (dialogue && dialogue.english) {
              englishTexts.push(dialogue.english);
            }
          });
          textToRead = englishTexts.join(". ");
        }
      }

      if (!textToRead || textToRead.trim() === "") {
        setIsPlayingTTS(false);
        setCurrentPlayingExampleId(null);
        showWarning("재생할 예문이 없습니다", "예문을 불러올 수 없습니다.");
        return;
      }

      console.log("TTS 재생할 텍스트:", textToRead);

      // TTS API 호출 (최대 3번 재시도)
      let response = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries && (!response || !response.audioContent)) {
        try {
          response = await ttsMutation.mutateAsync({
            text: textToRead,
            speed: 1.0,
          });
          console.log("TTS 응답:", response);
          
          if (response && response.audioContent) {
            break; // 성공하면 루프 종료
          }
        } catch (error) {
          console.error(`TTS API 호출 실패 (시도 ${retryCount + 1}/${maxRetries}):`, error);
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
          // 재시도 전 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // TTS API가 실패하면 브라우저 내장 TTS 사용
      if (!response || !response.audioContent) {
        console.log("TTS API 실패, 브라우저 내장 TTS 사용");
        
        // Web Speech API 사용
        if ('speechSynthesis' in window) {
          // 기존 음성 중지
          window.speechSynthesis.cancel();
          
          const utterance = new SpeechSynthesisUtterance(textToRead);
          utterance.lang = 'en-US';
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          utterance.onend = () => {
            setIsPlayingTTS(false);
            setCurrentPlayingExampleId(null);
          };

          utterance.onerror = (error) => {
            console.error("브라우저 TTS 오류:", error);
            setIsPlayingTTS(false);
            setCurrentPlayingExampleId(null);
          };

          window.speechSynthesis.speak(utterance);
          return;
        } else {
          // Web Speech API도 없으면 에러
          setIsPlayingTTS(false);
          setCurrentPlayingExampleId(null);
          showError("TTS 오류", "음성을 재생할 수 없습니다. 브라우저가 TTS를 지원하지 않습니다.");
          return;
        }
      }

      // Base64 오디오 데이터를 직접 Audio 객체로 재생
      const audioUrl = `data:audio/mp3;base64,${response.audioContent}`;
      const audio = new Audio(audioUrl);
      
      // 오디오 객체를 ref에 저장
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlayingTTS(false);
        setCurrentPlayingExampleId(null);
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
      };

      audio.onerror = (error) => {
        console.error("오디오 재생 실패:", error);
        // 오디오 재생 실패 시 브라우저 TTS로 대체
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(textToRead);
          utterance.lang = 'en-US';
          utterance.rate = 1.0;
          utterance.onend = () => {
            setIsPlayingTTS(false);
            setCurrentPlayingExampleId(null);
          };
          utterance.onerror = () => {
            setIsPlayingTTS(false);
            setCurrentPlayingExampleId(null);
          };
          window.speechSynthesis.speak(utterance);
        } else {
          setIsPlayingTTS(false);
          setCurrentPlayingExampleId(null);
        }
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
      };

      // 오디오 로드 대기
      audio.oncanplaythrough = async () => {
        try {
          await audio.play();
          console.log("오디오 재생 시작");
        } catch (playError) {
          console.error("오디오 재생 시작 실패:", playError);
          // 재생 실패 시 브라우저 TTS로 대체
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.lang = 'en-US';
            utterance.rate = 1.0;
            utterance.onend = () => {
              setIsPlayingTTS(false);
              setCurrentPlayingExampleId(null);
            };
            utterance.onerror = () => {
              setIsPlayingTTS(false);
              setCurrentPlayingExampleId(null);
            };
            window.speechSynthesis.speak(utterance);
          } else {
            setIsPlayingTTS(false);
            setCurrentPlayingExampleId(null);
          }
          if (audioRef.current === audio) {
            audioRef.current = null;
          }
        }
      };

      // 오디오 로드 시작
      audio.load();
    } catch (error) {
      console.error("TTS 재생 오류:", error);
      setIsPlayingTTS(false);
      setCurrentPlayingExampleId(null);
      showError("TTS 오류", "음성 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
      if (audioRef.current) {
        audioRef.current = null;
      }
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#F7F8FB]">
        <div className="text-[#666]" style={baseTextStyle}>
          학습 기록을 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-72px)] flex flex-col max-w-[440px] mx-auto bg-[#F7F8FB] shadow-[0_0_10px_0_rgba(0,0,0,0.1)] relative">
      {/* Header */}
      <div className={`${isLargeTextMode ? "p-5" : "p-4"} bg-white border-b border-gray-200 space-y-3 w-full max-w-full overflow-hidden box-border`}>
        <div className="flex items-center justify-between w-full min-w-0 gap-2">
          <button
            onClick={handleBack}
            className="w-8 h-8 flex items-center justify-center flex-shrink-0"
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
          <div className="text-center flex-1 min-w-0 overflow-hidden">
            <h1 className="font-semibold text-gray-800 break-words" style={{...headerTextStyle, wordBreak: 'break-word', overflowWrap: 'break-word'}}>
              {formatDisplayDate(selectedDate || date)}
            </h1>
            {availableDates.length > 0 && (
              <p className="text-gray-500 mt-1 break-words" style={{...xSmallTextStyle, wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                총 {availableDates.length}일의 기록
              </p>
            )}
          </div>
          <div className="w-8 flex-shrink-0" />
        </div>
        <div className="flex items-center gap-2 w-full min-w-0">
          <button
            onClick={() => previousDate && handleNavigateToDate(previousDate)}
            disabled={!previousDate}
            className={`px-2 py-2 rounded-lg font-medium transition-colors flex-shrink-0 whitespace-nowrap ${
              previousDate
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            style={smallTextStyle}
          >
            이전
          </button>
          <input
            type="date"
            value={selectedDate || ""}
            onChange={handleDateInputChange}
            className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00DAAA] box-border"
            style={{...smallTextStyle, width: '100%', maxWidth: '100%'}}
          />
          <button
            onClick={() => nextDate && handleNavigateToDate(nextDate)}
            disabled={!nextDate}
            className={`px-2 py-2 rounded-lg font-medium transition-colors flex-shrink-0 whitespace-nowrap ${
              nextDate
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            style={smallTextStyle}
          >
            다음
          </button>
        </div>
      </div>

      {/* Chat Content */}
      <div className={`flex-1 overflow-y-auto ${isLargeTextMode ? "p-5" : "p-4"} ${isLargeTextMode ? "space-y-5" : "space-y-4"} bg-[#F7F8FB] ${
        (isDeleteModeWriting && selectedWritingIds.size > 0) || 
        (isDeleteModeQuestion && selectedQuestionIds.size > 0)
          ? "pb-32" 
          : "pb-20"
      }`}>
        {/* 한줄영어 섹션 */}
        {writingRecords.length > 0 && (
          <>
            <div className="space-y-2 w-full max-w-full overflow-hidden">
              <div className="flex items-center justify-between w-full min-w-0 gap-2">
                <div className="font-semibold text-gray-600 flex-shrink-0" style={headerTextStyle}>하루한줄</div>
                <button
                  onClick={() => {
                    setIsDeleteModeWriting(!isDeleteModeWriting);
                    if (isDeleteModeWriting) {
                      setSelectedWritingIds(new Set());
                    }
                  }}
                  className={`px-3 py-2 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shadow-md flex-shrink-0 whitespace-nowrap ${
                    isDeleteModeWriting
                      ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300'
                  }`}
                  style={smallTextStyle}
                >
                  {isDeleteModeWriting ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      취소
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      삭제
                    </>
                  )}
                </button>
              </div>
              
              {isDeleteModeWriting && (
                <>
                   <div className="flex items-center justify-between mb-3 w-full max-w-full overflow-hidden">
                     <button
                       onClick={() => {
                         if (selectedWritingIds.size === writingRecords.length && writingRecords.length > 0) {
                           setSelectedWritingIds(new Set());
                         } else {
                           setSelectedWritingIds(new Set(writingRecords.map((r: any) => r.id)));
                         }
                       }}
                       className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex-shrink-0"
                     >
                       <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                         selectedWritingIds.size === writingRecords.length && writingRecords.length > 0
                           ? 'bg-red-500 border-red-500' 
                           : 'bg-white border-gray-300'
                       }`}>
                         {selectedWritingIds.size === writingRecords.length && writingRecords.length > 0 && (
                           <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                           </svg>
                         )}
                       </div>
                       <span className="text-gray-700 whitespace-nowrap" style={smallTextStyle}>전체 선택</span>
                     </button>
                   </div>
                   
                   {/* 하단 고정 삭제 액션 바 */}
                  {selectedWritingIds.size > 0 && (
                    <div className="absolute bottom-20 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 w-full max-w-full overflow-hidden box-border">
                      <div className="flex items-center justify-between px-3 py-2.5 gap-2 w-full min-w-0">
                        <span className="text-gray-700 font-medium flex-shrink-0 whitespace-nowrap" style={baseTextStyle}>
                          {selectedWritingIds.size}개 선택
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => setSelectedWritingIds(new Set())}
                            className="px-3 py-1.5 text-gray-600 hover:text-gray-800 transition-colors whitespace-nowrap"
                            style={smallTextStyle}
                          >
                            취소
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(`선택한 ${selectedWritingIds.size}개의 하루한줄 기록을 삭제하시겠습니까?`)) {
                                try {
                                  const deletePromises = Array.from(selectedWritingIds).map(id =>
                                    deleteWritingRecordMutation.mutateAsync(id)
                                  );
                                  await Promise.all(deletePromises);
                                  showSuccess("삭제 완료", `${selectedWritingIds.size}개의 하루한줄 기록이 삭제되었습니다.`);
                                  setSelectedWritingIds(new Set());
                                  setIsDeleteModeWriting(false);
                                } catch (error) {
                                  showError("삭제 실패", "하루한줄 기록 삭제에 실패했습니다.");
                                }
                              }
                            }}
                            disabled={deleteWritingRecordMutation.isPending}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 font-medium flex items-center gap-1 whitespace-nowrap"
                            style={smallTextStyle}
                          >
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="whitespace-nowrap">삭제</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {writingRecords.map((record: any) => {
              const question = writingQuestionMap.get(record.writing_question_id);
              const feedback = Array.isArray(record.feedback) 
                ? record.feedback 
                : (record.feedback ? [record.feedback] : []);
              const isSelected = selectedWritingIds.has(record.id);
              
              return (
                <div 
                  key={`writing-${record.id}`} 
                  className={`space-y-4 relative transition-all duration-200 ${
                    isDeleteModeWriting && isSelected ? 'ring-2 ring-red-500 ring-offset-2 rounded-lg' : ''
                  }`}
                >
                  {/* 1. 하루한줄 블록 */}
                  <div className="flex justify-end items-start gap-3">
                    {/* 체크박스 (삭제 모드일 때만 표시, 왼쪽에 배치) */}
                    {isDeleteModeWriting && (
                      <div className="flex-shrink-0 pt-1">
                        <button
                          onClick={() => {
                            const newSet = new Set(selectedWritingIds);
                            if (isSelected) {
                              newSet.delete(record.id);
                            } else {
                              newSet.add(record.id);
                            }
                            setSelectedWritingIds(newSet);
                          }}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-red-500 border-red-500' 
                              : 'bg-white border-gray-300 hover:border-red-400'
                          }`}
                          aria-label={isSelected ? "선택 해제" : "선택"}
                        >
                          {isSelected && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                     <div 
                       className="max-w-[80%] min-w-0 px-4 py-3 rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100 transition-all"
                       style={{ 
                         wordBreak: 'break-word', 
                         overflowWrap: 'break-word',
                         ...(isDeleteModeWriting && isSelected ? { backgroundColor: '#FEE2E2', borderColor: '#FECACA' } : {})
                       }}
                     >
                         <div className="space-y-2 w-full min-w-0">
                           {/* 오늘의 주제 - 불릿 있음 */}
                           {question && (
                             <div className="flex items-start min-w-0">
                               <span className="text-gray-800 mr-2 flex-shrink-0 text-base">•</span>
                               <p className="text-gray-800 leading-relaxed flex-1 min-w-0 break-words text-base" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                                 {question.koreanQuestion || question.englishQuestion}
                               </p>
                             </div>
                           )}
                           
                           {/* 내가 입력한 문장 - 불릿 없음 */}
                           <div className="min-w-0">
                             <p className="text-gray-800 leading-relaxed break-words text-base" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                               {record.original_text}
                             </p>
                           </div>
                         </div>
                       </div>
                    </div>

                  {/* 2. 문장 첨삭 블록 */}
                  {record.processed_text && (
                    <>
                      <div className="flex justify-start">
                        <div 
                          className="bg-white shadow-sm border border-gray-100 rounded-lg w-full max-w-[343px]"
                          style={{ 
                            paddingLeft: '12px',
                            paddingTop: '12px',
                            paddingBottom: '16px',
                            paddingRight: '16px'
                          }}
                        >
                          {/* 문장 첨삭 배지 */}
                          <div
                            className="inline-block rounded-full px-2 py-0.5 mb-1"
                            style={{
                              background: '#FF5E1666',
                              marginLeft: '-4px',
                              marginTop: '-4px'
                            }}
                          >
                            <span className="font-medium text-gray-900 text-xs">문장 첨삭</span>
                          </div>
                          
                          <p className="text-gray-800 font-semibold leading-relaxed text-sm" style={{paddingLeft: '16px'}}>
                            {record.processed_text}
                          </p>
                        </div>
                      </div>
                      
                      {/* 피드백 블록 */}
                      <div className="flex justify-start">
                        <div 
                          className="max-w-[80%] px-4 py-3 rounded-lg bg-gray-50 text-gray-800 border border-gray-200 shadow-sm"
                        >
                          <div className="mb-2">
                            <span className="font-medium text-gray-800 text-sm">학습 피드백:</span>
                          </div>
                          {feedback.length > 0 ? (
                            <div className="space-y-3">
                              {feedback.map((fb: string, idx: number) => (
                                <p 
                                  key={idx} 
                                  className="text-gray-700 leading-relaxed text-sm" 
                                  style={{
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'keep-all',
                                    overflowWrap: 'break-word'
                                  }}
                                >
                                  {fb}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400 italic text-sm">
                              피드백이 없습니다. 완벽해요!!
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 구분선 */}
                      <div className="border-t border-gray-300 my-4"></div>
                    </>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* 채팅기록 섹션 */}
        {questions.length > 0 && (
          <>
            <div className="space-y-2 w-full max-w-full overflow-hidden">
              <div className="flex items-center justify-between w-full min-w-0 gap-2">
                <div className="font-semibold text-gray-600 flex-shrink-0" style={headerTextStyle}>채팅기록</div>
                <button
                  onClick={() => {
                    setIsDeleteModeQuestion(!isDeleteModeQuestion);
                    if (isDeleteModeQuestion) {
                      setSelectedQuestionIds(new Set());
                    }
                  }}
                  className={`px-3 py-2 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shadow-md flex-shrink-0 whitespace-nowrap ${
                    isDeleteModeQuestion
                      ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300'
                  }`}
                  style={smallTextStyle}
                >
                  {isDeleteModeQuestion ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      취소
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      삭제
                    </>
                  )}
                </button>
              </div>
              
              {isDeleteModeQuestion && (
                <>
                   <div className="flex items-center justify-between mb-3 w-full max-w-full overflow-hidden">
                     <button
                       onClick={() => {
                         if (selectedQuestionIds.size === questions.length && questions.length > 0) {
                           setSelectedQuestionIds(new Set());
                         } else {
                           setSelectedQuestionIds(new Set(questions.map((q: any) => q.id)));
                         }
                       }}
                       className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex-shrink-0"
                     >
                       <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                         selectedQuestionIds.size === questions.length && questions.length > 0
                           ? 'bg-red-500 border-red-500' 
                           : 'bg-white border-gray-300'
                       }`}>
                         {selectedQuestionIds.size === questions.length && questions.length > 0 && (
                           <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                           </svg>
                         )}
                       </div>
                       <span className="text-gray-700 whitespace-nowrap" style={smallTextStyle}>전체 선택</span>
                     </button>
                   </div>
                   
                   {/* 하단 고정 삭제 액션 바 */}
                   {selectedQuestionIds.size > 0 && (
                    <div className="absolute bottom-20 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 w-full max-w-full overflow-hidden box-border">
                      <div className="flex items-center justify-between px-3 py-2.5 gap-2 w-full min-w-0">
                        <span className="text-gray-700 font-medium flex-shrink-0 whitespace-nowrap" style={baseTextStyle}>
                          {selectedQuestionIds.size}개 선택
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => setSelectedQuestionIds(new Set())}
                            className="px-3 py-1.5 text-gray-600 hover:text-gray-800 transition-colors whitespace-nowrap"
                            style={smallTextStyle}
                          >
                            취소
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(`선택한 ${selectedQuestionIds.size}개의 채팅 기록을 삭제하시겠습니까?`)) {
                                try {
                                  const selectedQuestions = questions.filter((q: any) => selectedQuestionIds.has(q.id));
                                  const deletePromises = Array.from(selectedQuestionIds).map(id =>
                                    deleteQuestionMutation.mutateAsync(id)
                                  );
                                  await Promise.all(deletePromises);
                                  // localStorage에서도 채팅 메시지 제거
                                  const questionContents = selectedQuestions.map((q: any) => q.content || "");
                                  removeChatMessagesFromStorage(Array.from(selectedQuestionIds), questionContents, "stage_chat_messages");
                                  removeChatMessagesFromStorage(Array.from(selectedQuestionIds), questionContents, "chat_messages");
                                  showSuccess("삭제 완료", `${selectedQuestionIds.size}개의 채팅 기록이 삭제되었습니다.`);
                                  setSelectedQuestionIds(new Set());
                                  setIsDeleteModeQuestion(false);
                                } catch (error) {
                                  showError("삭제 실패", "채팅 기록 삭제에 실패했습니다.");
                                }
                              }
                            }}
                            disabled={deleteQuestionMutation.isPending}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 font-medium flex items-center gap-1 whitespace-nowrap"
                            style={smallTextStyle}
                          >
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="whitespace-nowrap">삭제</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {questions.map((question, index) => {
                const isSelected = selectedQuestionIds.has(question.id);
                
                return (
                  <div 
                    key={question.id} 
                    className={`space-y-3 relative transition-all duration-200 ${
                      isDeleteModeQuestion && isSelected ? 'ring-2 ring-red-500 ring-offset-2 rounded-lg' : ''
                    }`}
                  >
                    {/* User Question */}
                    <div className="flex justify-end items-start gap-3">
                      {/* 체크박스 (삭제 모드일 때만 표시, 왼쪽에 배치) */}
                      {isDeleteModeQuestion && (
                        <div className="flex-shrink-0 pt-1">
                          <button
                            onClick={() => {
                              const newSet = new Set(selectedQuestionIds);
                              if (isSelected) {
                                newSet.delete(question.id);
                              } else {
                                newSet.add(question.id);
                              }
                              setSelectedQuestionIds(newSet);
                            }}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected 
                                ? 'bg-red-500 border-red-500' 
                                : 'bg-white border-gray-300 hover:border-red-400'
                            }`}
                            aria-label={isSelected ? "선택 해제" : "선택"}
                          >
                            {isSelected && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                       <div className={`max-w-[80%] min-w-0 ${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"} rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100 transition-all ${
                         isDeleteModeQuestion && isSelected ? 'bg-red-50 border-red-200' : ''
                       }`}
                       style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                       >
                         <p className="leading-relaxed whitespace-pre-wrap break-words" style={{...baseTextStyle, wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                           {question.content}
                         </p>
                       </div>
                    </div>

                    {/* AI Response */}
                    {question.Answers && question.Answers.length > 0 && (
                      <div className="flex justify-start">
                        <div className={`max-w-[80%] ${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"} rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100`}>
                        <div className="leading-relaxed" style={baseTextStyle}>
                    {question.Answers[0].content.includes(
                      "회화, 독해, 문법분석"
                    ) ? (
                      // 버튼 형태의 응답
                      <div className="space-y-3">
                        <p className="text-gray-600 mb-3" style={baseTextStyle}>
                          {question.Answers[0].content}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button className="px-3 py-2 bg-[#00DAAA] text-white rounded-full" style={xSmallTextStyle}>
                            회화
                          </button>
                          <button className="px-3 py-2 bg-white text-gray-700 rounded-full border border-gray-300" style={xSmallTextStyle}>
                            독해
                          </button>
                          <button className="px-3 py-2 bg-white text-gray-700 rounded-full border border-gray-300" style={xSmallTextStyle}>
                            문법분석
                          </button>
                          <button className="px-3 py-2 bg-white text-gray-700 rounded-full border border-gray-300" style={xSmallTextStyle}>
                            비즈니스
                          </button>
                          <button className="px-3 py-2 bg-white text-gray-700 rounded-full border border-gray-300" style={xSmallTextStyle}>
                            어휘
                          </button>
                        </div>
                      </div>
                    ) : question.Answers[0].content.includes(
                        "채팅 또는 카메라"
                      ) ? (
                      // 채팅/카메라 선택 버튼
                      <div className="space-y-3">
                        <p className="text-gray-600 mb-3" style={baseTextStyle}>
                          {question.Answers[0].content}
                        </p>
                        <div className="flex gap-2">
                          <button className="px-4 py-2 bg-white text-gray-700 rounded-full border border-gray-300" style={smallTextStyle}>
                            채팅
                          </button>
                          <button className="px-4 py-2 bg-[#00DAAA] text-white rounded-full" style={smallTextStyle}>
                            카메라
                          </button>
                        </div>
                      </div>
                    ) : question.Answers[0].content.includes(
                        "How Do You Feel Today"
                      ) ? (
                      // 이미지와 상세 설명이 포함된 응답
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h3 className="font-semibold text-gray-800 mb-3" style={headerTextStyle}>
                            How Do You Feel Today?
                          </h3>
                          <div className="bg-gray-100 rounded-lg p-4 mb-3">
                            <div className="text-gray-600 space-y-2" style={baseTextStyle}>
                              <p>A: How do you feel today?</p>
                              <p>B: Not so good.</p>
                              <p>A: What's the matter?</p>
                              <p>B: I have a headache.</p>
                              <p>A: I'm sorry to hear that.</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-gray-700 leading-relaxed" style={baseTextStyle}>
                          <p className="mb-3">
                            <strong>'How do you feel today?'</strong>는 한국어로{" "}
                            <strong>'오늘 기분이 어때?'</strong> 또는{" "}
                            <strong>'오늘은 어떻게 느껴?'</strong>로 번역됩니다.
                            주로 상대방의 감정이나 컨디션에 대해 묻는 표현으로,
                            친근하고 일상적인 대화에서 자주 사용됩니다.
                          </p>
                          <div className="bg-[#E8F5E8] rounded-lg p-3 border border-[#4A7C59]">
                            <h4 className="font-semibold text-[#2D5A2D] mb-2" style={headerTextStyle}>
                              컨디션을 물을 때
                            </h4>
                            <div className="text-[#2D5A2D] space-y-1" style={baseTextStyle}>
                              <p>
                                A: You looked tired yesterday. How do you feel
                                today?
                              </p>
                              <p>A: 어제 피곤해 보이던데, 오늘은 어때?</p>
                              <p>B: Much better, I got some good rest.</p>
                              <p>B: 훨씬 나아졌어. 푹 쉬었거든.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // 일반 텍스트 응답
                      <p className="leading-relaxed whitespace-pre-wrap" style={{...baseTextStyle, paddingLeft: '8px'}}>
                        {question.Answers[0].content}
                      </p>
                    )}
                        </div>
                      </div>
                    </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 구분선 */}
            <div className="border-t border-gray-300 my-4"></div>
          </>
        )}

        {/* 예문기록 섹션 */}
        {exampleRecords.length > 0 && (
          <>
            <div className="space-y-2 w-full max-w-full overflow-hidden">
              <div className="flex items-center justify-between w-full min-w-0 gap-2">
                <div className="font-semibold text-gray-600 flex-shrink-0" style={headerTextStyle}>예문기록</div>
                <button
                  onClick={() => {
                    setIsDeleteMode(!isDeleteMode);
                    if (isDeleteMode) {
                      setSelectedExampleIds(new Set());
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0 whitespace-nowrap"
                  style={{
                    ...smallTextStyle,
                    backgroundColor: isDeleteMode ? '#EF4444' : 'white',
                    color: isDeleteMode ? 'white' : '#6B7280',
                    borderColor: isDeleteMode ? '#EF4444' : '#D1D5DB'
                  }}
                >
                  {isDeleteMode ? '취소' : '삭제'}
                </button>
              </div>
              
              {isDeleteMode && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedExampleIds.size === exampleRecords.length && exampleRecords.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedExampleIds(new Set(exampleRecords.map((ex: any) => ex.id)));
                        } else {
                          setSelectedExampleIds(new Set());
                        }
                      }}
                      className="w-5 h-5 rounded border-gray-300 text-[#00DAAA] focus:ring-[#00DAAA]"
                    />
                    <span style={smallTextStyle}>전체 선택</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {selectedExampleIds.size > 0 && (
                      <button
                        onClick={async () => {
                          if (window.confirm(`선택한 ${selectedExampleIds.size}개의 예문 기록을 삭제하시겠습니까?`)) {
                            try {
                              const deletePromises = Array.from(selectedExampleIds).map(id =>
                                deleteExampleMutation.mutateAsync(id)
                              );
                              await Promise.all(deletePromises);
                              // localStorage에서도 예문 제거
                              removeExamplesFromStorage(Array.from(selectedExampleIds));
                              showSuccess("삭제 완료", `${selectedExampleIds.size}개의 예문 기록이 삭제되었습니다.`);
                              setSelectedExampleIds(new Set());
                              setIsDeleteMode(false);
                            } catch (error) {
                              showError("삭제 실패", "예문 기록 삭제에 실패했습니다.");
                            }
                          }
                        }}
                        disabled={deleteExampleMutation.isPending}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                        style={smallTextStyle}
                      >
                        선택 삭제 ({selectedExampleIds.size})
                      </button>
                    )}
                    {selectedExampleIds.size === exampleRecords.length && exampleRecords.length > 0 && (
                      <button
                        onClick={async () => {
                          if (window.confirm(`모든 예문 기록(${exampleRecords.length}개)을 삭제하시겠습니까?`)) {
                            try {
                              const deletePromises = exampleRecords.map((ex: any) =>
                                deleteExampleMutation.mutateAsync(ex.id)
                              );
                              await Promise.all(deletePromises);
                              // localStorage에서도 모든 예문 제거
                              removeExamplesFromStorage(exampleRecords.map((ex: any) => ex.id));
                              showSuccess("삭제 완료", `모든 예문 기록(${exampleRecords.length}개)이 삭제되었습니다.`);
                              setSelectedExampleIds(new Set());
                              setIsDeleteMode(false);
                            } catch (error) {
                              showError("삭제 실패", "예문 기록 삭제에 실패했습니다.");
                            }
                          }
                        }}
                        disabled={deleteExampleMutation.isPending}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                        style={smallTextStyle}
                      >
                        전체 삭제
                      </button>
                    )}
                  </div>
                </div>
              )}

              {exampleRecords.map((example, exampleIndex) => {
                if (!example.exampleItems || example.exampleItems.length === 0) return null;
                
                const currentIndex = getCurrentItemIndex(example.id, example.exampleItems.length);
                const currentItem = example.exampleItems[currentIndex];
                const isSelected = selectedExampleIds.has(example.id);
                
                // 이미지 가져오기: DB에서 가져온 이미지 우선, 없으면 localStorage에서 시도
                const getExampleImage = () => {
                  // DB에서 가져온 이미지가 있으면 사용
                  if (example.images && example.images.length > 0) {
                    return example.images[0];
                  }
                  
                  // localStorage에서 이미지 가져오기 시도 (하위 호환성)
                  try {
                    const dateKey = getTodayStringBy4AM();
                    const storageKey = `example_generation_state_${dateKey}`;
                    const savedState = localStorage.getItem(storageKey);
                    if (savedState) {
                      const parsed = JSON.parse(savedState);
                      if (parsed.croppedImage && parsed.examples?.some((ex: any) => ex.id === example.id)) {
                        return parsed.croppedImage;
                      }
                    }
                  } catch (error) {
                    // 무시
                  }
                  return null;
                };
                
                const exampleImage = getExampleImage();
                const exampleImages = example.images || (exampleImage ? [exampleImage] : []);
                
                return (
                  <div 
                    key={`example-${example.id}`} 
                    className={`space-y-3 transition-all duration-200 ${
                      isDeleteMode && isSelected ? 'ring-2 ring-red-500 ring-offset-2 rounded-lg' : ''
                    }`}
                  >
                    
                    {/* 레이아웃: 왼쪽(설명+예문+예문설명), 오른쪽(사진) */}
                    <div className="flex gap-2 sm:gap-4 items-start">
                      {/* 체크박스 (삭제 모드일 때만 표시, 왼쪽에 배치) */}
                      {isDeleteMode && (
                        <div className="flex-shrink-0 pt-1">
                          <button
                            onClick={() => {
                              const newSet = new Set(selectedExampleIds);
                              if (isSelected) {
                                newSet.delete(example.id);
                              } else {
                                newSet.add(example.id);
                              }
                              setSelectedExampleIds(newSet);
                            }}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected 
                                ? 'bg-red-500 border-red-500' 
                                : 'bg-white border-gray-300 hover:border-red-400'
                            }`}
                            aria-label={isSelected ? "선택 해제" : "선택"}
                          >
                            {isSelected && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                      {/* 왼쪽: 설명, 예문, 예문 설명 */}
                      <div className={`flex-1 space-y-3 transition-all ${
                        isDeleteMode && isSelected ? 'opacity-75' : ''
                      }`}>
                        {/* 사진 설명 */}
                        {example.description && example.description !== "이미지에서 예문을 생성했어요." && (
                          <div className="flex justify-start">
                            <div className={`max-w-[80%] ${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"} rounded-lg bg-white text-gray-900 border border-gray-200`}>
                              <p 
                                className="leading-relaxed whitespace-pre-wrap" 
                                style={{ ...baseTextStyle, color: '#111827', lineHeight: '1.6' }}
                                dangerouslySetInnerHTML={{
                                  __html: example.description
                                    .replace(/\*\*(.*?)\*\*/g, '<u>$1</u>')
                                    .replace(/__(.*?)__/g, '<u>$1</u>')
                                    .replace(/\*(.*?)\*/g, '<u>$1</u>')
                                }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* 예문 카드 */}
                        <div className="flex justify-start">
                          <div 
                            className="bg-white shadow-sm border border-gray-100 rounded-lg relative w-full max-w-[343px]"
                            style={{ 
                              paddingLeft: '12px',
                              paddingTop: '12px',
                              paddingBottom: '16px',
                              paddingRight: '12px'
                            }}
                          >
                            {/* 예문 상황 배지와 페이지네이션 도트 */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="inline-block bg-[#B8E6D3] rounded-full px-2 py-0.5 border border-[#B8E6D3]" style={{ marginLeft: '-4px', marginTop: '-4px' }}>
                                <span className="font-medium text-gray-900" style={correctionTextStyle}>예문 상황</span>
                              </div>
                              
                              {/* 페이지네이션 도트 */}
                              {example.exampleItems.length > 1 && (
                                <div className="flex items-center" style={{ gap: '4px' }}>
                                  {example.exampleItems.map((_, idx: number) => {
                                    const isActive = idx === currentIndex;
                                    return (
                                      <button
                                        key={idx}
                                        onClick={() => handleItemIndexChange(example.id, 'set', example.exampleItems.length, idx)}
                                        aria-label={`예문 ${idx + 1}로 이동`}
                                        className="transition-all duration-200 ease-in-out hover:scale-110 focus:outline-none rounded-full"
                                        style={{
                                          width: '6px',
                                          height: '6px',
                                          borderRadius: '50%',
                                          backgroundColor: isActive ? '#00DAAA' : '#D1D5DB',
                                          border: 'none',
                                          cursor: 'pointer',
                                          padding: '0',
                                          minWidth: '6px',
                                          minHeight: '6px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        <span
                                          style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            backgroundColor: isActive ? '#00DAAA' : '#D1D5DB',
                                            display: 'block'
                                          }}
                                        />
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            
                            {/* 대화 내용 */}
                            {currentItem.dialogues && currentItem.dialogues.length > 0 && (
                              <div className="space-y-2 mb-3" style={{ paddingLeft: '8px' }}>
                                {currentItem.dialogues.map(
                                  (dialogue: ExampleDialogue, dialogueIdx: number) => (
                                    <div
                                      key={`${example.id}-item-${currentIndex}-dialogue-${dialogueIdx}`}
                                      className="flex items-start space-x-2"
                                    >
                                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${
                                        dialogue.speaker === "A" ? "bg-[#B8E6D3]" : "bg-[#A8D5E2]"
                                      }`} style={xSmallTextStyle}>
                                        {dialogue.speaker}
                                      </div>
                                      <div className="flex-1" style={{ paddingLeft: '4px', marginTop: '-2px' }}>
                                        <p className="font-medium text-gray-900 leading-relaxed" style={smallTextStyle}>
                                          {dialogue.english}
                                        </p>
                                        {dialogue.korean && (
                                          <p className="text-gray-600 leading-relaxed mt-1" style={smallTextStyle}>
                                            {dialogue.korean}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                            
                            {/* 스피커 아이콘과 화살표 */}
                            <div className="flex justify-center items-center gap-2 pt-4 border-t border-gray-200">
                              <button
                                onClick={() => handleItemIndexChange(example.id, 'prev', example.exampleItems.length)}
                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleSpeakerClick(example)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-md ${
                                  isPlayingTTS && currentPlayingExampleId === example.id
                                    ? "bg-[#FF6B35] hover:bg-[#E55A2B]"
                                    : "bg-[#00DAAA] hover:bg-[#00C299]"
                                }`}
                              >
                                {isPlayingTTS && currentPlayingExampleId === example.id ? (
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
                                onClick={() => handleItemIndexChange(example.id, 'next', example.exampleItems.length)}
                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* 예문 설명 (상황 설명) */}
                        {currentItem.context && (
                          <div className="flex justify-start">
                            <div 
                              className="max-w-[80%] px-4 py-3 rounded-lg bg-gray-50 text-gray-700 border border-gray-200"
                              style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                            >
                              <p className="leading-relaxed whitespace-pre-wrap" style={{ ...baseTextStyle, color: '#374151', lineHeight: '1.6' }}>
                                {currentItem.context}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* 오른쪽: 사진 */}
                      {exampleImages.length > 0 && (
                        <div className="flex-shrink-0">
                          <div className="flex flex-col gap-2">
                            {exampleImages.map((imgUrl: string, imgIndex: number) => (
                              <div key={imgIndex} className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                <img
                                  src={imgUrl}
                                  alt={`예문 생성 이미지 ${imgIndex + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 세트 구분선 */}
                    {exampleIndex < exampleRecords.length - 1 && (
                      <div className="border-t border-gray-300 my-4"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {questions.length === 0 && exampleRecords.length === 0 && writingRecords.length === 0 && (
          <div className="flex justify-center items-center py-8">
            <div className="text-center text-gray-500">
              <p style={baseTextStyle}>이 날짜에는 학습 기록이 없습니다.</p>
              <p className="mt-1" style={smallTextStyle}>새로운 질문을 해보세요!</p>
            </div>
          </div>
        )}
      </div>

      <NavBar currentPage={"QuestionDetail"} />
    </div>
  );
};

export default QuestionDetail;
