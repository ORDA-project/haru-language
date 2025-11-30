import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { Example, Dialogue } from "../../entities/examples/types";
import { exampleApi } from "../../entities/examples/api";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { userAtom } from "../../store/authStore";
import StageResult from "../Elements/StageResult";

interface ExampleHistoryProps {
  onBack: () => void;
}

interface GroupedExample {
  date: string;
  examples: Example[];
}

const ExampleHistory = ({ onBack }: ExampleHistoryProps) => {
  const [groupedExamples, setGroupedExamples] = useState<GroupedExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExample, setSelectedExample] = useState<Example | null>(null);
  const { showError } = useErrorHandler();
  const [user] = useAtom(userAtom);

  useEffect(() => {
    if (user?.userId) {
      loadExampleHistory();
    }
  }, [user?.userId]);

  const loadExampleHistory = async () => {
    if (!user?.userId) {
      showError("오류", "로그인이 필요합니다.");
      return;
    }

    try {
      setLoading(true);

      const response = await exampleApi.getExamplesByUserId(user.userId);

      if (response.data && Array.isArray(response.data)) {
        // Group examples by date
        const grouped = groupExamplesByDate(response.data);
        setGroupedExamples(grouped);
      }
    } catch (error) {
      console.error("Failed to load example history:", error);
      showError("로딩 오류", "예문 기록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const groupExamplesByDate = (examples: Example[]): GroupedExample[] => {
    const groups: { [key: string]: Example[] } = {};

    examples.forEach((example) => {
      // Use first ExampleItem's created_at for grouping
      const createdAt = example.ExampleItems?.[0]?.created_at;
      if (createdAt) {
        const date = new Date(createdAt).toLocaleDateString("ko-KR", {
          month: "2-digit",
          day: "2-digit",
        });

        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(example);
      }
    });

    // Convert to array and sort by date (newest first)
    return Object.entries(groups)
      .map(([date, examples]) => ({
        date,
        examples: examples.sort((a, b) => {
          const dateA = new Date(
            a.ExampleItems?.[0]?.created_at || ""
          ).getTime();
          const dateB = new Date(
            b.ExampleItems?.[0]?.created_at || ""
          ).getTime();
          return dateB - dateA;
        }),
      }))
      .sort((a, b) => {
        // Sort groups by date (newest first)
        const dateA = new Date(
          a.examples[0]?.ExampleItems?.[0]?.created_at || ""
        ).getTime();
        const dateB = new Date(
          b.examples[0]?.ExampleItems?.[0]?.created_at || ""
        ).getTime();
        return dateB - dateA;
      });
  };

  const handleExampleClick = (example: Example) => {
    setSelectedExample(example);
  };

  const handleBackFromDetail = () => {
    setSelectedExample(null);
  };

  const convertToStageResultFormat = (example: Example) => {
    const convertedExamples: any[] = [];

    if (example.ExampleItems && Array.isArray(example.ExampleItems)) {
      example.ExampleItems.forEach((item, index) => {
        if (
          item.Dialogues &&
          Array.isArray(item.Dialogues) &&
          item.Dialogues.length >= 2
        ) {
          const dialogueA =
            item.Dialogues.find((d: Dialogue) => d.speaker === "A") ||
            item.Dialogues[0];
          const dialogueB =
            item.Dialogues.find((d: Dialogue) => d.speaker === "B") ||
            item.Dialogues[1];

          convertedExamples.push({
            id: `${item.id || index}`,
            context: item.context || "대화 상황",
            dialogue: {
              A: {
                english: dialogueA.english || "",
                korean: dialogueA.korean || "",
              },
              B: {
                english: dialogueB.english || "",
                korean: dialogueB.korean || "",
              },
            },
          });
        }
      });
    }

    return convertedExamples;
  };

  // If an example is selected, show the detail view
  if (selectedExample) {
    const convertedExamples = convertToStageResultFormat(selectedExample);

    return (
      <StageResult
        description={selectedExample.description || ""}
        examples={convertedExamples}
        errorMessage=""
        setStage={() => handleBackFromDetail()}
      />
    );
  }

  return (
    <div className="w-full h-[calc(100vh-72px)] flex flex-col max-w-[440px] mx-auto bg-[#F7F8FB] shadow-[0_0_10px_0_rgba(0,0,0,0.1)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <button
          onClick={onBack}
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
          <h1 className="text-lg font-semibold text-gray-800">
            지난 예문 기록
          </h1>
        </div>
        <div className="w-8"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-[#00DAAA] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">예문 기록을 불러오는 중...</p>
            </div>
          </div>
        ) : groupedExamples.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <p className="text-lg text-gray-600 mb-4">
                저장된 예문이 없습니다.
              </p>
              <p className="text-sm text-gray-500">
                새로운 예문을 생성해보세요!
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {groupedExamples.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Date Header */}
                <div className="flex items-center mb-4">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <div className="px-4">
                    <span className="text-sm text-gray-500 font-medium">
                      {group.date}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                {/* Examples for this date */}
                <div className="space-y-3">
                  {group.examples.map((example, exampleIndex) => (
                    <button
                      key={example.id}
                      onClick={() => handleExampleClick(example)}
                      className="w-full p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Main sentence */}
                          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                            {example.extracted_sentence}
                          </h3>

                          {/* Description */}
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {example.description}
                          </p>

                          {/* Preview of first dialogue */}
                          {example.ExampleItems?.[0]?.Dialogues?.[0] && (
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {example.ExampleItems[0].Dialogues[0].english}
                            </p>
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="ml-3 flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-gray-400"
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
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExampleHistory;
