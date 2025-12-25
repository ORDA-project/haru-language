import React from "react";
import { DeleteActionBar } from "./DeleteActionBar";
import { DeleteModeToggle } from "./DeleteModeToggle";
import type { WritingRecord } from "../types";

interface WritingRecordsSectionProps {
  writingRecords: WritingRecord[];
  writingQuestionMap: Map<number, any>;
  isDeleteMode: boolean;
  selectedIds: Set<number>;
  onToggleDeleteMode: () => void;
  onToggleSelect: (id: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  baseTextStyle: React.CSSProperties;
  smallTextStyle: React.CSSProperties;
  headerTextStyle: React.CSSProperties;
}

export const WritingRecordsSection: React.FC<WritingRecordsSectionProps> = ({
  writingRecords,
  writingQuestionMap,
  isDeleteMode,
  selectedIds,
  onToggleDeleteMode,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onDelete,
  isDeleting,
  baseTextStyle,
  smallTextStyle,
  headerTextStyle,
}) => {
  if (writingRecords.length === 0) return null;

  const allSelected = selectedIds.size === writingRecords.length && writingRecords.length > 0;

  return (
    <>
      <div className="space-y-2 w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between w-full min-w-0 gap-2">
          <div className="font-semibold text-gray-600 flex-shrink-0" style={headerTextStyle}>
            하루한줄
          </div>
          <DeleteModeToggle
            isDeleteMode={isDeleteMode}
            onToggle={onToggleDeleteMode}
            textStyle={smallTextStyle}
          />
        </div>

        {isDeleteMode && (
          <>
            <div className="flex items-center justify-between mb-3 w-full max-w-full overflow-hidden">
              <button
                onClick={allSelected ? onDeselectAll : onSelectAll}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex-shrink-0"
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    allSelected ? "bg-red-500 border-red-500" : "bg-white border-gray-300"
                  }`}
                >
                  {allSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-gray-700 whitespace-nowrap" style={smallTextStyle}>
                  전체 선택
                </span>
              </button>
            </div>

            <DeleteActionBar
              selectedCount={selectedIds.size}
              onCancel={onDeselectAll}
              onDelete={onDelete}
              isDeleting={isDeleting}
              deleteMessage={`선택한 ${selectedIds.size}개의 하루한줄 기록을 삭제하시겠습니까?`}
              baseTextStyle={baseTextStyle}
              smallTextStyle={smallTextStyle}
            />
          </>
        )}
      </div>

      {writingRecords.map((record) => {
        const question = writingQuestionMap.get(record.writing_question_id);
        const feedback = Array.isArray(record.feedback)
          ? record.feedback
          : record.feedback
          ? [record.feedback]
          : [];
        const isSelected = selectedIds.has(record.id);

        return (
          <div
            key={`writing-${record.id}`}
            className={`space-y-4 relative transition-all duration-200 ${
              isDeleteMode && isSelected ? "ring-2 ring-red-500 ring-offset-2 rounded-lg" : ""
            }`}
          >
            {/* 하루한줄 블록 */}
            <div className="flex justify-end items-start gap-3">
              {isDeleteMode && (
                <div className="flex-shrink-0 pt-1">
                  <button
                    onClick={() => onToggleSelect(record.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-red-500 border-red-500"
                        : "bg-white border-gray-300 hover:border-red-400"
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
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  ...(isDeleteMode && isSelected
                    ? { backgroundColor: "#FEE2E2", borderColor: "#FECACA" }
                    : {}),
                }}
              >
                <div className="space-y-2 w-full min-w-0">
                  {question && (
                    <div className="flex items-start min-w-0">
                      <span className="text-gray-800 mr-2 flex-shrink-0" style={baseTextStyle}>
                        •
                      </span>
                      <p
                        className="text-gray-800 leading-relaxed flex-1 min-w-0 break-words"
                        style={{ ...baseTextStyle, wordBreak: "break-word", overflowWrap: "break-word" }}
                      >
                        {question.koreanQuestion || question.englishQuestion}
                      </p>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p
                      className="text-gray-800 leading-relaxed break-words"
                      style={{ ...baseTextStyle, wordBreak: "break-word", overflowWrap: "break-word" }}
                    >
                      {record.original_text}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 문장 첨삭 블록 */}
            {record.processed_text && (
              <>
                <div className="flex justify-start">
                  <div
                    className="max-w-[80%] bg-white shadow-sm border border-gray-100 rounded-lg"
                    style={{
                      paddingLeft: "12px",
                      paddingTop: "12px",
                      paddingBottom: "16px",
                      paddingRight: "16px",
                    }}
                  >
                    <div
                      className="inline-block rounded-full px-2 py-0.5 mb-1"
                      style={{
                        background: "#FF5E1666",
                        marginLeft: "-4px",
                        marginTop: "-4px",
                      }}
                    >
                      <span className="font-medium text-gray-900 text-xs">문장 첨삭</span>
                    </div>
                    <p className="text-gray-800 font-semibold leading-relaxed text-sm" style={{ paddingLeft: "16px" }}>
                      {record.processed_text}
                    </p>
                  </div>
                </div>

                {/* 피드백 블록 */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] px-4 py-3 rounded-lg bg-gray-50 text-gray-800 border border-gray-200 shadow-sm">
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
                              whiteSpace: "pre-wrap",
                              wordBreak: "keep-all",
                              overflowWrap: "break-word",
                            }}
                          >
                            {fb}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 italic text-sm">피드백이 없습니다. 완벽해요!!</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-300 my-4"></div>
              </>
            )}
          </div>
        );
      })}

      <div className="border-t border-gray-300 my-4"></div>
    </>
  );
};

