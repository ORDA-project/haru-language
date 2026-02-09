import React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";
import { useGetQuestionsByUserId } from "../../entities/questions/queries";
import { useGetExampleHistory } from "../../entities/examples/queries";
import { useErrorHandler } from "../../hooks/useErrorHandler";

interface StatusProps {
  userId?: number; // 하위 호환성을 위해 유지하지만 사용하지 않음
  recordRef?: React.RefObject<HTMLDivElement | null>;
}

interface ProgressRecord {
  id: string;
  date: string;
  content: string;
  createdAt: string;
}

const StatusCheck = ({ userId: _userId, recordRef }: StatusProps) => {
  // 보안: userId 파라미터는 사용하지 않음 (JWT로 자동 인증)
  const navigate = useNavigate();
  const { showError } = useErrorHandler();
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  
  // 큰글씨 모드에 따른 텍스트 크기 (중년층용)
  const baseFontSize = isLargeTextMode ? 18 : 16;
  const largeFontSize = isLargeTextMode ? 22 : 19;
  const smallFontSize = isLargeTextMode ? 16 : 14;
  const headerFontSize = isLargeTextMode ? 22 : 19;
  
  const baseTextStyle: React.CSSProperties = { fontSize: `${baseFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const largeTextStyle: React.CSSProperties = { fontSize: `${largeFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const smallTextStyle: React.CSSProperties = { fontSize: `${smallFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const headerTextStyle: React.CSSProperties = { fontSize: `${headerFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };

  const formatDate = (dateString: string): string | null => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) {
        console.warn("Invalid date string:", dateString);
        return null;
      }
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${month}/${day}`;
    } catch (error) {
      console.warn("Error formatting date:", dateString, error);
      return null;
    }
  };

  // 보안: JWT 기반 인증 - userId 파라미터 무시
  const { data: questionsData, isLoading: questionsLoading } =
    useGetQuestionsByUserId();
  const { data: examplesData, isLoading: examplesLoading } =
    useGetExampleHistory();

  const progressRecords: ProgressRecord[] = React.useMemo(() => {
    const recordsMap = new Map<string, ProgressRecord>();

    const appendRecord = (
      dateKey: string | null,
      content: string,
      createdAt: string
    ) => {
      if (!dateKey || !content) {
        console.warn("Missing dateKey or content:", { dateKey, content });
        return;
      }
      
      // createdAt을 ISO 문자열로 변환 (실제 생성 날짜 사용)
      let isoCreatedAt: string;
      try {
        const parsedDate = new Date(createdAt);
        if (Number.isNaN(parsedDate.getTime())) {
          console.warn("Invalid createdAt date, using current date:", createdAt);
          isoCreatedAt = new Date().toISOString();
        } else {
          // 실제 생성 날짜 사용
          isoCreatedAt = parsedDate.toISOString();
        }
      } catch (error) {
        console.warn("Failed to parse createdAt, using current date:", createdAt, error);
        isoCreatedAt = new Date().toISOString();
      }

      const existing = recordsMap.get(dateKey);

      if (existing) {
        existing.content = `${existing.content}\n${content}`.trim();
        // 같은 날짜의 레코드가 여러 개면 가장 오래된 createdAt 사용 (실제 생성 날짜)
        if (
          new Date(isoCreatedAt).getTime() <
          new Date(existing.createdAt).getTime()
        ) {
          existing.createdAt = isoCreatedAt;
        }
      } else {
        recordsMap.set(dateKey, {
          id: `date-${dateKey}`,
          date: dateKey,
          content: content.trim(),
          createdAt: isoCreatedAt, // 실제 생성 날짜 저장
        });
      }
    };

    if (questionsData?.data?.length) {
      questionsData.data.forEach((question) => {
        // created_at이 없으면 건너뛰기 (데이터 문제)
        if (!question.created_at) {
          console.warn("Question missing created_at, skipping:", question.id);
          return;
        }
        
        // 실제 생성 날짜로 포맷팅
        const dateKey = formatDate(question.created_at);
        if (!dateKey) {
          console.warn("Failed to format date for question:", question.created_at, question.id);
          return;
        }
        
        appendRecord(dateKey, question.content || "", question.created_at);
      });
    }

    if (examplesData?.data?.length) {
      examplesData.data.forEach((example) => {
        // created_at 또는 createdAt 사용
        const createdAt = example.created_at || example.createdAt;
        if (!createdAt) {
          console.warn("Example missing createdAt, skipping:", example.id);
          return;
        }
        
        // 실제 생성 날짜로 포맷팅
        const dateKey = formatDate(createdAt);
        if (!dateKey) {
          console.warn("Failed to format date for example:", createdAt, example.id);
          return;
        }
        
        const dialogues =
          example.ExampleItems?.flatMap(
            (item) => item.Dialogues || []
          ) || [];
        const dialogueSummary = dialogues
          .map((dialogue) => `${dialogue.speaker}: ${dialogue.english}`)
          .join(" ");
        const summary =
          example.description ||
          dialogueSummary ||
          example.extracted_sentence ||
          "이미지에서 예문을 생성했어요.";

        appendRecord(dateKey, summary, createdAt);
      });
    }

    return Array.from(recordsMap.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [questionsData?.data, examplesData?.data]);

  const loading = questionsLoading || examplesLoading;

  const handleRecordClick = (record: ProgressRecord) => {
    // record.date는 MM/DD 형식이므로, createdAt을 사용하여 YYYY-MM-DD 형식으로 변환
    // createdAt은 ISO 문자열이므로 직접 사용 가능
    let dateString: string;
    try {
      const date = new Date(record.createdAt);
      if (Number.isNaN(date.getTime())) {
        console.warn("Invalid createdAt, using current date:", record.createdAt);
        dateString = new Date().toISOString().split("T")[0];
      } else {
        // 한국 시간으로 변환하여 날짜 추출
        const koreaTime = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
        const year = koreaTime.getFullYear();
        const month = String(koreaTime.getMonth() + 1).padStart(2, '0');
        const day = String(koreaTime.getDate()).padStart(2, '0');
        dateString = `${year}-${month}-${day}`;
      }
    } catch (error) {
      console.warn("Failed to parse createdAt, using current date:", record.createdAt, error);
      dateString = new Date().toISOString().split("T")[0];
    }

    // 보안: URL에 userId 제거 (JWT로 자동 인증)
    navigate(`/question-detail/${dateString}`);
  };

  return (
    <div className="flex flex-col justify-center items-center w-full">
      {/* <button className="rounded-[20px] border-0 bg-[#fcc21b] shadow-[0px_3px_7px_2px_rgba(0,0,0,0.05)] w-[95%] p-[21px_17px] text-[19px] font-bold leading-[150%] m-[25px]" onClick={() => {navigate("/quiz");}}>진도 점검 하러 가기</button> */}
      <div ref={recordRef} className="rounded-[10px] bg-[#d2deed] w-[90%] flex flex-col items-start p-[15px] shadow-[0px_3px_7px_rgba(0,0,0,0.1)] m-[10px]">
        <div className="font-bold mb-[10px] text-center w-full" style={headerTextStyle}>
          지난 시간에는 이런 걸 배웠어요<span style={{ display: 'inline-block', verticalAlign: 'middle', lineHeight: '1' }}>📝</span>
        </div>

        {loading ? (
          <div className="w-full flex justify-center items-center py-8">
            <div className="text-[#666]" style={baseTextStyle}>
              학습 기록을 불러오는 중...
            </div>
          </div>
        ) : progressRecords.length === 0 ? (
          <div className="w-full flex justify-center items-center py-8">
            <div className="text-[#666] text-center" style={baseTextStyle}>
              아직 학습 기록이 없습니다.
              <br />
              예문 생성을 통해 첫 번째 학습을 시작해보세요!
            </div>
          </div>
        ) : (
          progressRecords.slice(0, 3).map((record, index) => (
            <div
              key={record.id || index}
              onClick={() => handleRecordClick(record)}
              className="min-h-[70px] flex items-start p-[12px_15px] bg-white rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] mb-[12px] w-[91%] h-[80px] overflow-hidden cursor-pointer hover:shadow-[0_2px_6px_rgba(0,0,0,0.15)] transition-shadow"
            >
              <div className="font-bold text-[#666] w-[60px] mr-[10px] flex-shrink-0" style={baseTextStyle}>
                {record.date}
              </div>
              <div className="text-[#333] flex-1 overflow-hidden" style={baseTextStyle}>
                <div
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "pre-line",
                  }}
                >
                  {record.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StatusCheck;
