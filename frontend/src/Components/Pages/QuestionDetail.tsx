import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";
import { useGetQuestionsByUserId, useDeleteQuestion } from "../../entities/questions/queries";
import { useGetExampleHistory, useDeleteExample } from "../../entities/examples/queries";
import { useWritingRecords, useDeleteWritingRecord } from "../../entities/writing/queries";
import { useWritingQuestions } from "../../entities/writing/queries";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import NavBar from "../Templates/Navbar";
import { createExtendedTextStyles } from "../../utils/styleUtils";
import { getTodayStringBy4AM } from "../../utils/dateUtils";
import { removeExamplesFromStorage, removeChatMessagesFromStorage } from "../../utils/storageUtils";
import { API_ENDPOINTS } from "../../config/api";
import { QuestionDetailHeader } from "./QuestionDetail/components/QuestionDetailHeader";
import { useDateNavigation } from "./QuestionDetail/hooks/useDateNavigation";
import { WritingRecordsSection } from "./QuestionDetail/components/WritingRecordsSection";
import { ChatMessagesSection } from "./QuestionDetail/components/ChatMessagesSection";
import { ExampleRecordsSection } from "./QuestionDetail/components/ExampleRecordsSection";
import { getDateString, parseGeneratedExample } from "./QuestionDetail/utils";

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
  const navigate = useNavigate();
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  const [currentItemIndex, setCurrentItemIndex] = useState<Record<number, number>>({});
  const [exampleScrollIndices, setExampleScrollIndices] = useState<Record<string, number>>({});
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedExampleIds, setSelectedExampleIds] = useState<Set<number>>(new Set());
  const [isDeleteModeWriting, setIsDeleteModeWriting] = useState(false);
  const [selectedWritingIds, setSelectedWritingIds] = useState<Set<number>>(new Set());
  const [isDeleteModeChat, setIsDeleteModeChat] = useState(false);
  const [selectedChatMessageIds, setSelectedChatMessageIds] = useState<Set<string>>(new Set());
  const { showWarning, showError, showSuccess } = useErrorHandler();
  const deleteWritingRecordMutation = useDeleteWritingRecord();
  const deleteExampleMutation = useDeleteExample();
  
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

  // 날짜 네비게이션 훅 사용
  const {
    selectedDate,
    targetDate,
    availableDates,
    previousDate,
    nextDate,
    handleNavigateToDate,
  } = useDateNavigation({
    questionsData,
    exampleHistory,
    writingRecordsData,
  });


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

  // AI 대화 기록 불러오기 (localStorage)
  const chatMessages = useMemo(() => {
    if (!targetDate) return [];
    try {
      // targetDate는 YYYY-MM-DD 형식, getTodayStringBy4AM도 YYYY-MM-DD 형식 반환
      const storageKey = `stage_chat_messages_${targetDate}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const messages = JSON.parse(saved);
        if (Array.isArray(messages) && messages.length > 0) {
          // 타임스탬프를 Date 객체로 변환하고, 초기 AI 메시지 제외
          return messages
            .map((msg: any) => ({
              ...msg,
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
            }))
            .filter((msg: any) => {
              // 초기 인사 메시지 제외
              return !msg.content?.includes("안녕하세요! 영어 학습을 도와드릴");
            });
        }
      }
    } catch (error) {
      console.error("AI 대화 기록 불러오기 실패:", error);
    }
    return [];
  }, [targetDate]);

  const isLoading = examplesLoading || writingRecordsLoading;

  const currentIndex = availableDates.findIndex(
    (d) => d === selectedDate
  );
  // availableDates는 내림차순 정렬 (최신이 먼저)
  // 이전 날 = 더 오래된 날짜 (인덱스 증가)
  // 다음 날 = 더 최신 날짜 (인덱스 감소)
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
      <div className={isLargeTextMode ? "p-5" : "p-4"}>
        <QuestionDetailHeader
          selectedDate={selectedDate}
          date={selectedDate}
          availableDates={availableDates}
          previousDate={previousDate}
          nextDate={nextDate}
          onNavigateToDate={handleNavigateToDate}
          onBack={handleBack}
          headerTextStyle={headerTextStyle}
          xSmallTextStyle={xSmallTextStyle}
          smallTextStyle={smallTextStyle}
        />
      </div>

      {/* Chat Content */}
      <div className={`flex-1 overflow-y-auto ${isLargeTextMode ? "p-5" : "p-4"} ${isLargeTextMode ? "space-y-5" : "space-y-4"} bg-[#F7F8FB] ${
        (isDeleteModeWriting && selectedWritingIds.size > 0) || 
        (isDeleteMode && selectedExampleIds.size > 0) ||
        (isDeleteModeChat && selectedChatMessageIds.size > 0)
          ? "pb-32" 
          : "pb-20"
      }`}>
        {/* 한줄영어 섹션 */}
        <WritingRecordsSection
          writingRecords={writingRecords}
          writingQuestionMap={writingQuestionMap}
          isDeleteMode={isDeleteModeWriting}
          selectedIds={selectedWritingIds}
          onToggleDeleteMode={() => {
            setIsDeleteModeWriting(!isDeleteModeWriting);
            if (isDeleteModeWriting) {
              setSelectedWritingIds(new Set());
            }
          }}
          onToggleSelect={(id) => {
            const newSet = new Set(selectedWritingIds);
            if (newSet.has(id)) {
              newSet.delete(id);
            } else {
              newSet.add(id);
            }
            setSelectedWritingIds(newSet);
          }}
          onSelectAll={() => {
            setSelectedWritingIds(new Set(writingRecords.map((r: any) => r.id)));
          }}
          onDeselectAll={() => {
            setSelectedWritingIds(new Set());
          }}
          onDelete={async () => {
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
          isDeleting={deleteWritingRecordMutation.isPending}
          baseTextStyle={baseTextStyle}
          smallTextStyle={smallTextStyle}
          headerTextStyle={headerTextStyle}
        />

        {/* 채팅기록 섹션 */}
        <ChatMessagesSection
          chatMessages={chatMessages}
          targetDate={targetDate}
          isDeleteMode={isDeleteModeChat}
          selectedIds={selectedChatMessageIds}
          exampleScrollIndices={exampleScrollIndices}
          onToggleDeleteMode={() => {
            setIsDeleteModeChat(!isDeleteModeChat);
            if (isDeleteModeChat) {
              setSelectedChatMessageIds(new Set());
            }
          }}
          onToggleSelect={(id) => {
            const newSet = new Set(selectedChatMessageIds);
            if (newSet.has(id)) {
              newSet.delete(id);
            } else {
              newSet.add(id);
            }
            setSelectedChatMessageIds(newSet);
          }}
          onSelectAll={() => {
            setSelectedChatMessageIds(
              new Set(chatMessages.map((msg: any, idx: number) => msg.id || `msg-${idx}`))
            );
          }}
          onDeselectAll={() => {
            setSelectedChatMessageIds(new Set());
          }}
          onDelete={async () => {
            if (window.confirm(`선택한 ${selectedChatMessageIds.size}개의 채팅 기록을 삭제하시겠습니까?`)) {
              try {
                const storageKey = `stage_chat_messages_${targetDate}`;
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                  const messages = JSON.parse(saved);
                  if (Array.isArray(messages)) {
                    const filteredMessages = messages.filter((msg: any) => {
                      const msgId = msg.id || `msg-${messages.indexOf(msg)}`;
                      return !selectedChatMessageIds.has(msgId);
                    });

                    if (filteredMessages.length === 0) {
                      localStorage.removeItem(storageKey);
                    } else {
                      localStorage.setItem(storageKey, JSON.stringify(filteredMessages));
                    }
                  }
                }

                showSuccess("삭제 완료", `${selectedChatMessageIds.size}개의 채팅 기록이 삭제되었습니다.`);
                setSelectedChatMessageIds(new Set());
                setIsDeleteModeChat(false);
                window.location.reload();
              } catch (error) {
                showError("삭제 실패", "채팅 기록 삭제에 실패했습니다.");
              }
            }
          }}
          onExampleScrollChange={(messageId, index) => {
            setExampleScrollIndices((prev) => ({
              ...prev,
              [messageId]: index,
            }));
          }}
          isLargeTextMode={isLargeTextMode}
          baseTextStyle={baseTextStyle}
          smallTextStyle={smallTextStyle}
          xSmallTextStyle={xSmallTextStyle}
          headerTextStyle={headerTextStyle}
        />

        {/* 예문기록 섹션 */}
        <ExampleRecordsSection
          exampleRecords={exampleRecords}
          isDeleteMode={isDeleteMode}
          selectedIds={selectedExampleIds}
          currentItemIndex={currentItemIndex}
          onToggleDeleteMode={() => {
            setIsDeleteMode(!isDeleteMode);
            if (isDeleteMode) {
              setSelectedExampleIds(new Set());
            }
          }}
          onToggleSelect={(id) => {
            const newSet = new Set(selectedExampleIds);
            if (newSet.has(id)) {
              newSet.delete(id);
            } else {
              newSet.add(id);
            }
            setSelectedExampleIds(newSet);
          }}
          onSelectAll={() => {
            setSelectedExampleIds(new Set(exampleRecords.map((ex: any) => ex.id)));
          }}
          onDeselectAll={() => {
            setSelectedExampleIds(new Set());
          }}
          onDelete={async () => {
            if (window.confirm(`선택한 ${selectedExampleIds.size}개의 예문 기록을 삭제하시겠습니까?`)) {
              try {
                const deletePromises = Array.from(selectedExampleIds).map((id) =>
                  deleteExampleMutation.mutateAsync(id)
                );
                await Promise.all(deletePromises);
                removeExamplesFromStorage(Array.from(selectedExampleIds));
                showSuccess("삭제 완료", `${selectedExampleIds.size}개의 예문 기록이 삭제되었습니다.`);
                setSelectedExampleIds(new Set());
                setIsDeleteMode(false);
              } catch (error) {
                showError("삭제 실패", "예문 기록 삭제에 실패했습니다.");
              }
            }
          }}
          onItemIndexChange={handleItemIndexChange}
          isLargeTextMode={isLargeTextMode}
          baseTextStyle={baseTextStyle}
          smallTextStyle={smallTextStyle}
          xSmallTextStyle={xSmallTextStyle}
          headerTextStyle={headerTextStyle}
          correctionTextStyle={correctionTextStyle}
        />

        {exampleRecords.length === 0 && writingRecords.length === 0 && chatMessages.length === 0 && (
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
