import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetQuestionsByUserId } from "../../entities/questions/queries";
import { useGetExampleHistory } from "../../entities/examples/queries";
import NavBar from "../Templates/Navbar";

type ExampleDialogue = {
  speaker: string;
  english: string;
  korean?: string;
};

const QuestionDetail = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(date || "");

  // 해당 날짜의 질문들 가져오기 (현재 로그인한 사용자)
  const { data: questionsData, isLoading: questionsLoading } =
    useGetQuestionsByUserId();
  const { data: exampleHistory, isLoading: examplesLoading } =
    useGetExampleHistory();

  useEffect(() => {
    if (date && date !== selectedDate) {
      setSelectedDate(date);
    }
  }, [date]);

  const availableDates = useMemo(() => {
    const dates = new Set<string>();

    const extractDate = (value?: string | null) => {
      if (!value) return;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return;
      dates.add(parsed.toISOString().split("T")[0]);
    };

    questionsData?.data?.forEach((question) => extractDate(question.created_at));
    exampleHistory?.data?.forEach((example) =>
      extractDate(example.created_at || example.createdAt)
    );

    return Array.from(dates).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
  }, [questionsData?.data, exampleHistory?.data]);

  useEffect(() => {
    if (!selectedDate && availableDates.length > 0) {
      const fallback = availableDates[0];
      setSelectedDate(fallback);
      navigate(`/question-detail/${fallback}`, { replace: true });
    }
  }, [availableDates, selectedDate, navigate]);

  const targetDate = useMemo(() => {
    if (!selectedDate) return "";
    return new Date(selectedDate).toDateString();
  }, [selectedDate]);

  const questions = useMemo(() => {
    if (!questionsData?.data || !targetDate) return [];
    return questionsData.data.filter(
      (q) => new Date(q.created_at).toDateString() === targetDate
    );
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
        return new Date(createdAt).toDateString() === targetDate;
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

        const dialoguesFromDb: ExampleDialogue[] =
          example.ExampleItems?.flatMap((item) => item.Dialogues || []) || [];

        const dialoguesFromGenerated: ExampleDialogue[] =
          generated?.examples?.flatMap((item: any) => {
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
          }) || [];

        const context =
          example.ExampleItems?.[0]?.context ||
          generated?.examples?.[0]?.context ||
          generated?.extractedSentence;

        const normalizedDialogues =
          dialoguesFromDb.length > 0
            ? dialoguesFromDb
            : dialoguesFromGenerated.filter(
                (dialogue) => dialogue.english?.trim()
              );

        return {
          id: example.id,
          description,
          hasDialogues: normalizedDialogues.length > 0,
          dialogues: normalizedDialogues,
          context,
        };
      });
  }, [exampleHistory?.data, targetDate]);

  const isLoading = questionsLoading || examplesLoading;

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

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#F7F8FB]">
        <div className="text-[16px] text-[#666]">
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
            <h1 className="text-lg font-semibold text-gray-800">
              {formatDisplayDate(selectedDate || date)}
            </h1>
            {availableDates.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
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
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              previousDate
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            이전
          </button>
          <input
            type="date"
            value={selectedDate || ""}
            onChange={handleDateInputChange}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00DAAA]"
          />
          <button
            onClick={() => nextDate && handleNavigateToDate(nextDate)}
            disabled={!nextDate}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              nextDate
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            다음
          </button>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="space-y-4">
            {/* User Question */}
            <div className="flex justify-end">
              <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {question.content}
                </p>
              </div>
            </div>

            {/* AI Response */}
            {question.Answers && question.Answers.length > 0 && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100">
                  <div className="text-sm leading-relaxed">
                    {question.Answers[0].content.includes(
                      "회화, 독해, 문법분석"
                    ) ? (
                      // 버튼 형태의 응답
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 mb-3">
                          {question.Answers[0].content}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button className="px-3 py-2 bg-[#00DAAA] text-white text-xs rounded-full">
                            회화
                          </button>
                          <button className="px-3 py-2 bg-white text-gray-700 text-xs rounded-full border border-gray-300">
                            독해
                          </button>
                          <button className="px-3 py-2 bg-white text-gray-700 text-xs rounded-full border border-gray-300">
                            문법분석
                          </button>
                          <button className="px-3 py-2 bg-white text-gray-700 text-xs rounded-full border border-gray-300">
                            비즈니스
                          </button>
                          <button className="px-3 py-2 bg-white text-gray-700 text-xs rounded-full border border-gray-300">
                            어휘
                          </button>
                        </div>
                      </div>
                    ) : question.Answers[0].content.includes(
                        "채팅 또는 카메라"
                      ) ? (
                      // 채팅/카메라 선택 버튼
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 mb-3">
                          {question.Answers[0].content}
                        </p>
                        <div className="flex gap-2">
                          <button className="px-4 py-2 bg-white text-gray-700 text-sm rounded-full border border-gray-300">
                            채팅
                          </button>
                          <button className="px-4 py-2 bg-[#00DAAA] text-white text-sm rounded-full">
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
                          <h3 className="font-semibold text-gray-800 mb-3">
                            How Do You Feel Today?
                          </h3>
                          <div className="bg-gray-100 rounded-lg p-4 mb-3">
                            <div className="text-sm text-gray-600 space-y-2">
                              <p>A: How do you feel today?</p>
                              <p>B: Not so good.</p>
                              <p>A: What's the matter?</p>
                              <p>B: I have a headache.</p>
                              <p>A: I'm sorry to hear that.</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 leading-relaxed">
                          <p className="mb-3">
                            <strong>'How do you feel today?'</strong>는 한국어로{" "}
                            <strong>'오늘 기분이 어때?'</strong> 또는{" "}
                            <strong>'오늘은 어떻게 느껴?'</strong>로 번역됩니다.
                            주로 상대방의 감정이나 컨디션에 대해 묻는 표현으로,
                            친근하고 일상적인 대화에서 자주 사용됩니다.
                          </p>
                          <div className="bg-[#E8F5E8] rounded-lg p-3 border border-[#4A7C59]">
                            <h4 className="font-semibold text-[#2D5A2D] mb-2">
                              컨디션을 물을 때
                            </h4>
                            <div className="text-sm text-[#2D5A2D] space-y-1">
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
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {question.Answers[0].content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {exampleRecords.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-600">예문 기록</div>
            {exampleRecords.map((example) => (
              <div
                key={`example-${example.id}`}
                className="space-y-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
              >
                {example.context && (
                  <div className="inline-block px-3 py-1 rounded-full bg-[#00DAAA] text-white text-xs font-medium">
                    {example.context}
                  </div>
                )}
                {example.description &&
                  example.description !== "이미지에서 예문을 생성했어요." && (
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {example.description}
                    </p>
                  )}
                {example.hasDialogues && (
                  <div className="space-y-2">
                    {example.dialogues.map(
                      (dialogue: ExampleDialogue, idx: number) => (
                        <div
                          key={`${example.id}-dialogue-${idx}`}
                          className="flex items-start space-x-2"
                        >
                          <span className="text-xs font-semibold text-gray-500 pt-0.5">
                            {dialogue.speaker}
                          </span>
                          <div>
                            <p className="text-sm text-gray-900">
                              {dialogue.english}
                            </p>
                            {dialogue.korean && (
                              <p className="text-xs text-gray-500">
                                {dialogue.korean}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {questions.length === 0 && exampleRecords.length === 0 && (
          <div className="flex justify-center items-center py-8">
            <div className="text-center text-gray-500">
              <p className="text-sm">이 날짜에는 학습 기록이 없습니다.</p>
              <p className="text-xs mt-1">새로운 질문을 해보세요!</p>
            </div>
          </div>
        )}
      </div>

      <NavBar currentPage={"QuestionDetail"} />
    </div>
  );
};

export default QuestionDetail;
