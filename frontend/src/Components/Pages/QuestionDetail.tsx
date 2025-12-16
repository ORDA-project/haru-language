import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";
import { useGetQuestionsByUserId } from "../../entities/questions/queries";
import { useGetExampleHistory } from "../../entities/examples/queries";
import { useWritingRecords } from "../../entities/writing/queries";
import { useWritingQuestions } from "../../entities/writing/queries";
import { useGenerateTTS } from "../../entities/tts/queries";
import NavBar from "../Templates/Navbar";

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
  const ttsMutation = useGenerateTTS();
  
  // 큰글씨 모드에 따른 텍스트 크기
  const baseFontSize = isLargeTextMode ? 20 : 16;
  const smallFontSize = isLargeTextMode ? 18 : 14;
  const xSmallFontSize = isLargeTextMode ? 16 : 12;
  const headerFontSize = isLargeTextMode ? 22 : 18;
  
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
    fontSize: `${headerFontSize}px`,
    wordBreak: 'keep-all',
    overflowWrap: 'break-word' as const
  };

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
    if (isPlayingTTS && currentPlayingExampleId === example.id) {
      // 이미 재생 중이면 중지
      setIsPlayingTTS(false);
      setCurrentPlayingExampleId(null);
      return;
    }

    try {
      setIsPlayingTTS(true);
      setCurrentPlayingExampleId(example.id);

      // 현재 화면에 보이는 예문 항목의 A와 B만 수집
      let textToRead = "";
      if (example.exampleItems && example.exampleItems.length > 0) {
        const currentIndex = getCurrentItemIndex(example.id, example.exampleItems.length);
        const currentItem = example.exampleItems[currentIndex];
        if (currentItem.dialogues && currentItem.dialogues.length > 0) {
          const englishTexts: string[] = [];
          currentItem.dialogues.forEach((dialogue: ExampleDialogue) => {
            if (dialogue.english) {
              englishTexts.push(dialogue.english);
            }
          });
          textToRead = englishTexts.join(". ");
        }
      }

      if (!textToRead) {
        setIsPlayingTTS(false);
        setCurrentPlayingExampleId(null);
        return;
      }

      // TTS API 호출
      const response = await ttsMutation.mutateAsync({
        text: textToRead,
        speed: 1.0,
      });

      // Base64 오디오 데이터를 직접 Audio 객체로 재생
      const audio = new Audio(`data:audio/mp3;base64,${response.audioContent}`);

      audio.onended = () => {
        setIsPlayingTTS(false);
        setCurrentPlayingExampleId(null);
      };

      audio.onerror = () => {
        console.error("오디오 재생 실패");
        setIsPlayingTTS(false);
        setCurrentPlayingExampleId(null);
      };

      await audio.play();
    } catch (error) {
      console.error("TTS 재생 오류:", error);
      setIsPlayingTTS(false);
      setCurrentPlayingExampleId(null);
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
    <div className="w-full h-[calc(100vh-72px)] flex flex-col max-w-[440px] mx-auto bg-[#F7F8FB] shadow-[0_0_10px_0_rgba(0,0,0,0.1)]">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
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
              {formatDisplayDate(selectedDate || date)}
            </h1>
            {availableDates.length > 0 && (
              <p className="text-gray-500 mt-1" style={xSmallTextStyle}>
                총 {availableDates.length}일의 기록
              </p>
            )}
          </div>
          <div className="w-8" />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => previousDate && handleNavigateToDate(previousDate)}
            disabled={!previousDate}
            className={`px-3 py-2 rounded-lg font-medium transition-colors ${
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
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00DAAA]"
            style={smallTextStyle}
          />
          <button
            onClick={() => nextDate && handleNavigateToDate(nextDate)}
            disabled={!nextDate}
            className={`px-3 py-2 rounded-lg font-medium transition-colors ${
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {/* 한줄영어 섹션 */}
        {writingRecords.length > 0 && (
          <>
            {writingRecords.map((record: any) => {
              const question = writingQuestionMap.get(record.writing_question_id);
              const feedback = Array.isArray(record.feedback) 
                ? record.feedback 
                : (record.feedback ? [record.feedback] : []);
              
              return (
                <div key={`writing-${record.id}`} className="space-y-4">
                  {/* 1. 하루한줄 블록 */}
                  <div className="space-y-2" style={{ gap: '10px' }}>
                    <div className="font-semibold text-gray-600" style={headerTextStyle}>하루한줄</div>
                    <div className="flex justify-end">
                      <div 
                        className="bg-white shadow-sm border border-gray-100 rounded-lg"
                        style={{ 
                          width: '343px',
                          padding: '16px'
                        }}
                      >
                      <div className="space-y-2">
                        {/* 오늘의 주제 */}
                        {question && (
                          <div className="flex items-start">
                            <span className="text-gray-800 mr-2" style={baseTextStyle}>•</span>
                            <p className="text-gray-800 leading-relaxed flex-1" style={baseTextStyle}>
                              {question.koreanQuestion || question.englishQuestion}
                            </p>
                          </div>
                        )}
                        
                        {/* 내가 입력한 문장 */}
                        <div className="flex items-start">
                          <span className="text-gray-800 mr-2" style={baseTextStyle}>•</span>
                          <p className="text-gray-800 leading-relaxed flex-1" style={baseTextStyle}>
                            {record.original_text}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>

                  {/* 2. 문장 첨삭 블록 */}
                  {record.processed_text && (
                    <>
                      <div className="space-y-2" style={{ gap: '10px' }}>
                        {/* 큰 흰색 칸 - 첨삭 버전 내용 */}
                        <div 
                          className="bg-white shadow-sm border border-gray-100 rounded-lg"
                          style={{ 
                            width: '343px',
                            paddingLeft: '40px',
                            paddingTop: '16px',
                            paddingBottom: '16px',
                            paddingRight: '16px'
                          }}
                        >
                          {/* 문장 첨삭 배지 - 흰색 칸 안으로 이동 */}
                          <div 
                            className="inline-block rounded-full px-4 py-1.5 mb-3"
                            style={{ 
                              background: '#FF5E1666'
                            }}
                          >
                            <span className="text-sm font-medium text-gray-900">문장 첨삭</span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2 font-medium" style={xSmallTextStyle}>
                          
                          </p>
                          <p className="text-gray-800 font-semibold leading-relaxed" style={baseTextStyle}>
                            {record.processed_text}
                          </p>
                        </div>
                        
                        {/* 피드백 블록 */}
                        {feedback.length > 0 && (
                          <div 
                            className="bg-white shadow-sm border border-gray-100 rounded-lg"
                            style={{ 
                              width: '343px',
                              paddingRight: '40px',
                              paddingTop: '16px',
                              paddingBottom: '16px',
                              paddingLeft: '16px'
                            }}
                          >
                            <p className="text-sm text-gray-600 mb-2 font-medium" style={xSmallTextStyle}>
                             
                            </p>
                            <ul className="space-y-1">
                              {feedback.map((fb: string, idx: number) => (
                                <li key={idx} className="text-gray-700" style={smallTextStyle}>
                                  • {fb}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* 구분선 */}
                      <div className="border-t border-gray-300"></div>
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
            <div className="space-y-2">
              <div className="font-semibold text-gray-600" style={headerTextStyle}>채팅기록</div>
              {questions.map((question, index) => (
                <div key={question.id} className="space-y-3">
                  {/* User Question */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100">
                      <p className="leading-relaxed whitespace-pre-wrap" style={baseTextStyle}>
                        {question.content}
                      </p>
                    </div>
                  </div>

                  {/* AI Response */}
                  {question.Answers && question.Answers.length > 0 && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100">
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
                      <p className="leading-relaxed whitespace-pre-wrap" style={baseTextStyle}>
                        {question.Answers[0].content}
                      </p>
                    )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 구분선 */}
            <div className="border-t border-gray-300"></div>
          </>
        )}

        {/* 예문기록 섹션 */}
        {exampleRecords.length > 0 && (
          <>
            <div className="space-y-2">
              <div className="font-semibold text-gray-600" style={headerTextStyle}>예문기록</div>
              {exampleRecords.map((example) => (
                <div key={`example-${example.id}`} className="space-y-3">
                  {/* 질문 내용 (사용자가 입력한 텍스트) */}
                  {example.description &&
                    example.description !== "이미지에서 예문을 생성했어요." && (
                      <div className="flex justify-end">
                        <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100">
                          <p className="leading-relaxed whitespace-pre-wrap" style={baseTextStyle}>
                            {example.description}
                          </p>
                        </div>
                      </div>
                    )}
                  
                  {/* 답변 요약 내용 (AI 응답) */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100">
                      <p className="leading-relaxed" style={baseTextStyle}>
                        예문을 생성했습니다.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 예문 상황 섹션 */}
            {exampleRecords.map((example) => {
              if (!example.exampleItems || example.exampleItems.length === 0) return null;
              
              const currentIndex = getCurrentItemIndex(example.id, example.exampleItems.length);
              const currentItem = example.exampleItems[currentIndex];
              
              return (
                <div key={`example-situation-${example.id}`} className="space-y-2" style={{ gap: '10px' }}>
                  {/* 큰 흰색 칸 - 예문 상황 안내 */}
                  <div 
                    className="bg-white shadow-sm border border-gray-100 rounded-lg relative"
                    style={{ 
                      width: '343px',
                      paddingLeft: '40px',
                      paddingTop: '16px',
                      paddingBottom: '16px',
                      paddingRight: '16px'
                    }}
                  >
                    {/* 예문 상황 배지 - 흰색 칸 안으로 이동 */}
                    <div className="inline-block bg-[#B8E6D3] rounded-full px-4 py-1.5 border border-[#B8E6D3] mb-3">
                      <span className="text-sm font-medium text-gray-900">예문 상황</span>
                    </div>
                    
                    {/* 페이지네이션 도트 */}
                    {example.exampleItems.length > 1 && (
                      <div className="flex justify-center items-center gap-0.5 mb-3">
                        {example.exampleItems.map((_, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => handleItemIndexChange(example.id, 'set', example.exampleItems.length, idx)}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              idx === currentIndex ? "bg-[#00DAAA]" : "bg-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* 대화 내용 */}
                    {currentItem.dialogues && currentItem.dialogues.length > 0 && (
                      <div className="space-y-2 mb-4">
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
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 leading-relaxed" style={baseTextStyle}>
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
                        <svg
                          className="w-5 h-5"
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
                      <button
                        onClick={() => handleSpeakerClick(example)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-md ${
                          isPlayingTTS && currentPlayingExampleId === example.id
                            ? "bg-[#FF6B35] hover:bg-[#E55A2B]"
                            : "bg-[#00DAAA] hover:bg-[#00C299]"
                        }`}
                      >
                        {isPlayingTTS && currentPlayingExampleId === example.id ? (
                          <svg
                            className="w-6 h-6 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                          </svg>
                        ) : (
                          <svg
                            className="w-6 h-6 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleItemIndexChange(example.id, 'next', example.exampleItems.length)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
