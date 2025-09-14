import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import { useErrorHandler } from "../../hooks/useErrorHandler";

interface StatusProps {
  userId?: string;
}

interface ProgressRecord {
  id: string;
  date: string;
  content: string;
  description?: string;
  examples?: Array<{
    context: string;
    dialogue: {
      A: { english: string; korean: string };
      B: { english: string; korean: string };
    };
  }>;
  createdAt: string;
}

const StatusCheck = ({ userId }: StatusProps) => {
  const navigate = useNavigate();
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useErrorHandler();

  useEffect(() => {
    if (userId) {
      fetchProgressRecords();
    }
  }, [userId]);

  const fetchProgressRecords = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS.example}/${userId}`, {
        withCredentials: true,
      });

      if (response.data && Array.isArray(response.data)) {
        // API 응답을 ProgressRecord 형태로 변환
        const formattedRecords = response.data.map((record: any) => ({
          id: record.id || record._id,
          date: formatDate(record.createdAt || record.date),
          content: formatContent(record),
          description: record.description,
          examples: record.examples,
          createdAt: record.createdAt || record.date,
        }));

        setProgressRecords(formattedRecords);
      } else {
        setProgressRecords([]);
      }
    } catch (error) {
      console.error("Error fetching progress records:", error);
      showError(
        "데이터 로드 오류",
        "학습 기록을 불러오는 중 오류가 발생했습니다."
      );
      setProgressRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}/${day}`;
  };

  const formatContent = (record: any): string => {
    let content = "";

    if (record.description) {
      content += record.description + "\n";
    }

    if (record.examples && record.examples.length > 0) {
      const example = record.examples[0]; // 첫 번째 예문 사용
      if (example.dialogue) {
        content += `"${example.dialogue.A?.english || ""}"\n`;
        content += `"${example.dialogue.A?.korean || ""}"\n`;
        if (example.dialogue.B?.english) {
          content += `"${example.dialogue.B.english}"\n`;
          content += `"${example.dialogue.B.korean || ""}"\n`;
        }
      }

      if (example.context) {
        content += `🔥주요 표현: ${example.context}`;
      }
    }

    return content.trim();
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
              className="min-h-[70px] flex items-start p-[12px_15px] bg-white rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] mb-[12px] w-[91%] h-[100px] overflow-hidden"
            >
              <div className="text-[18px] font-bold text-[#666] w-[60px] mr-[10px] flex-shrink-0">
                {record.date}
              </div>
              <div className="text-[18px] text-[#333] flex-1 overflow-hidden">
                <div
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
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
