import React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useGetQuestionsByUserId } from "../../entities/questions/queries";
import { useErrorHandler } from "../../hooks/useErrorHandler";

interface StatusProps {
  userId?: number;
}

interface ProgressRecord {
  id: string;
  date: string;
  content: string;
  createdAt: string;
}

const StatusCheck = ({ userId }: StatusProps) => {
  const navigate = useNavigate();
  const { showError } = useErrorHandler();

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}/${day}`;
  };

  // 질문 데이터 가져오기
  const { data: questionsData, isLoading: loading } = useGetQuestionsByUserId(
    userId ?? 1
  );

  // 질문 데이터를 날짜별로 그룹화하여 ProgressRecord 형태로 변환
  const progressRecords: ProgressRecord[] = React.useMemo(() => {
    if (!questionsData?.data) return [];

    // 날짜별로 그룹화
    const groupedByDate = questionsData.data.reduce((acc, question) => {
      const dateKey = formatDate(question.created_at);
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(question);
      return acc;
    }, {} as Record<string, typeof questionsData.data>);

    // 각 날짜별로 하나의 ProgressRecord 생성
    return Object.entries(groupedByDate).map(([date, questions]) => {
      // 해당 날짜의 첫 번째 질문을 대표로 사용
      const firstQuestion = questions[0];
      // 모든 질문의 내용을 합쳐서 표시 (최대 2줄)
      const allContents = questions.map((q) => q.content).join(" ");

      return {
        id: `date-${date}`,
        date: date,
        content: allContents,
        createdAt: firstQuestion.created_at,
      };
    });
  }, [questionsData?.data]);

  const handleRecordClick = (record: ProgressRecord) => {
    // createdAt에서 날짜 추출하여 YYYY-MM-DD 형식으로 변환
    const date = new Date(record.createdAt);
    const dateString = date.toISOString().split("T")[0];

    // 상세 페이지로 이동 (userId를 쿼리 파라미터로 전달)
    navigate(`/question-detail/${dateString}?userId=${userId ?? ""}`);
  };

  return (
    <div className="flex flex-col justify-center items-center w-full">
      {/* <button className="rounded-[20px] border-0 bg-[#fcc21b] shadow-[0px_3px_7px_2px_rgba(0,0,0,0.05)] w-[95%] p-[21px_17px] text-[19px] font-bold leading-[150%] m-[25px]" onClick={() => {navigate("/quiz");}}>진도 점검 하러 가기</button> */}
      <div className="rounded-[10px] bg-[#d2deed] w-[90%] flex flex-col items-start p-[15px] shadow-[0px_3px_7px_rgba(0,0,0,0.1)] m-[10px]">
        <div className="text-[19px] font-bold mb-[10px] text-center w-full">
          지난 시간에는 이런 걸 배웠어요📝
        </div>

        {loading ? (
          <div className="w-full flex justify-center items-center py-8">
            <div className="text-[16px] text-[#666]">
              학습 기록을 불러오는 중...
            </div>
          </div>
        ) : progressRecords.length === 0 ? (
          <div className="w-full flex justify-center items-center py-8">
            <div className="text-[16px] text-[#666] text-center">
              아직 학습 기록이 없습니다.
              <br />
              예문 생성을 통해 첫 번째 학습을 시작해보세요!
            </div>
          </div>
        ) : (
          progressRecords.map((record, index) => (
            <div
              key={record.id || index}
              onClick={() => handleRecordClick(record)}
              className="min-h-[70px] flex items-start p-[12px_15px] bg-white rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] mb-[12px] w-[91%] h-[100px] overflow-hidden cursor-pointer hover:shadow-[0_2px_6px_rgba(0,0,0,0.15)] transition-shadow"
            >
              <div className="text-[18px] font-bold text-[#666] w-[60px] mr-[10px] flex-shrink-0">
                {record.date}
              </div>
              <div className="text-[18px] text-[#333] flex-1 overflow-hidden">
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
