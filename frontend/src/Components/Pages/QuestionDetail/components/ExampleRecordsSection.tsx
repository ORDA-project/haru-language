import React from "react";
import { DeleteActionBar } from "./DeleteActionBar";
import { DeleteModeToggle } from "./DeleteModeToggle";
import { useTTS } from "../hooks/useTTS";
import { getTodayStringBy4AM } from "../../../../utils/dateUtils";
import type { ExampleRecord, ExampleDialogue } from "../types";

interface ExampleRecordsSectionProps {
  exampleRecords: ExampleRecord[];
  isDeleteMode: boolean;
  selectedIds: Set<number>;
  currentItemIndex: Record<number, number>;
  onToggleDeleteMode: () => void;
  onToggleSelect: (id: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: () => void;
  onItemIndexChange: (exampleId: number, direction: 'prev' | 'next' | 'set', totalItems: number, targetIndex?: number) => void;
  isLargeTextMode: boolean;
  baseTextStyle: React.CSSProperties;
  smallTextStyle: React.CSSProperties;
  xSmallTextStyle: React.CSSProperties;
  headerTextStyle: React.CSSProperties;
  correctionTextStyle: React.CSSProperties;
}

export const ExampleRecordsSection: React.FC<ExampleRecordsSectionProps> = ({
  exampleRecords,
  isDeleteMode,
  selectedIds,
  currentItemIndex,
  onToggleDeleteMode,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onItemIndexChange,
  isLargeTextMode,
  baseTextStyle,
  smallTextStyle,
  xSmallTextStyle,
  headerTextStyle,
  correctionTextStyle,
}) => {
  const { isPlayingTTS, currentPlayingExampleId, playTTS } = useTTS();

  if (exampleRecords.length === 0) return null;

  const allSelected = selectedIds.size === exampleRecords.length && exampleRecords.length > 0;

  const getCurrentItemIndex = (exampleId: number, totalItems: number) => {
    return currentItemIndex[exampleId] ?? 0;
  };

  const handleSpeakerClick = async (example: ExampleRecord) => {
    const currentIndex = getCurrentItemIndex(example.id, example.exampleItems.length);
    await playTTS(example, currentIndex);
  };

  const getExampleImage = (example: ExampleRecord) => {
    if (example.images && example.images.length > 0) {
      return example.images[0];
    }
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

  return (
    <>
      <div className="space-y-2 w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between w-full min-w-0 gap-2">
          <div className="font-semibold text-gray-600 flex-shrink-0" style={headerTextStyle}>
            예문기록
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
              isDeleting={false}
              deleteMessage={`선택한 ${selectedIds.size}개의 예문 기록을 삭제하시겠습니까?`}
              baseTextStyle={baseTextStyle}
              smallTextStyle={smallTextStyle}
            />
          </>
        )}
      </div>

      {exampleRecords.map((example, exampleIndex) => {
        if (!example.exampleItems || example.exampleItems.length === 0) return null;

        const currentIndex = getCurrentItemIndex(example.id, example.exampleItems.length);
        const currentItem = example.exampleItems[currentIndex];
        const isSelected = selectedIds.has(example.id);
        const exampleImage = getExampleImage(example);
        const exampleImages = example.images || (exampleImage ? [exampleImage] : []);

        return (
          <div
            key={`example-${example.id}`}
            className={`space-y-3 transition-all duration-200 ${
              isDeleteMode && isSelected ? "ring-2 ring-red-500 ring-offset-2 rounded-lg" : ""
            }`}
          >
            <div className="flex gap-2 sm:gap-4 items-start">
              {isDeleteMode && (
                <div className="flex-shrink-0 pt-1">
                  <button
                    onClick={() => onToggleSelect(example.id)}
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
                className={`flex-1 space-y-3 transition-all ${
                  isDeleteMode && isSelected ? "opacity-75" : ""
                }`}
              >
                {example.description && example.description !== "이미지에서 예문을 생성했어요." && (
                  <div className="flex justify-start">
                    <div
                      className={`${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"} rounded-lg bg-white text-gray-900 border border-gray-200`}
                      style={{ width: "343px" }}
                    >
                      <p
                        className="leading-relaxed whitespace-pre-wrap"
                        style={{ ...baseTextStyle, color: "#111827", lineHeight: "1.6" }}
                        dangerouslySetInnerHTML={{
                          __html: example.description
                            .replace(/\*\*(.*?)\*\*/g, "<u>$1</u>")
                            .replace(/__(.*?)__/g, "<u>$1</u>")
                            .replace(/\*(.*?)\*/g, "<u>$1</u>"),
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-start">
                  <div
                    className={`bg-white shadow-sm border border-gray-100 rounded-lg relative ${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"}`}
                    style={{
                      width: "343px",
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="inline-block bg-[#B8E6D3] rounded-full px-2 py-0.5 border border-[#B8E6D3]"
                        style={{ marginLeft: "-4px", marginTop: "-4px" }}
                      >
                        <span className="font-medium text-gray-900" style={correctionTextStyle}>
                          예문 상황
                        </span>
                      </div>

                      {example.exampleItems.length > 1 && (
                        <div className="flex items-center" style={{ gap: "4px" }}>
                          {example.exampleItems.map((_, idx: number) => {
                            const isActive = idx === currentIndex;
                            return (
                              <button
                                key={idx}
                                onClick={() => onItemIndexChange(example.id, "set", example.exampleItems.length, idx)}
                                aria-label={`예문 ${idx + 1}로 이동`}
                                className="transition-all duration-200 ease-in-out hover:scale-110 focus:outline-none rounded-full"
                                style={{
                                  width: "6px",
                                  height: "6px",
                                  borderRadius: "50%",
                                  backgroundColor: isActive ? "#00DAAA" : "#D1D5DB",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: "0",
                                  minWidth: "6px",
                                  minHeight: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <span
                                  style={{
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "50%",
                                    backgroundColor: isActive ? "#00DAAA" : "#D1D5DB",
                                    display: "block",
                                  }}
                                />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {currentItem.dialogues && currentItem.dialogues.length > 0 && (
                      <div className="space-y-2 mb-3" style={{ paddingLeft: "8px" }}>
                        {currentItem.dialogues.map((dialogue: ExampleDialogue, dialogueIdx: number) => (
                          <div
                            key={`${example.id}-item-${currentIndex}-dialogue-${dialogueIdx}`}
                            className="flex items-start space-x-2"
                          >
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${
                                dialogue.speaker === "A" ? "bg-[#B8E6D3]" : "bg-[#A8D5E2]"
                              }`}
                              style={xSmallTextStyle}
                            >
                              {dialogue.speaker}
                            </div>
                            <div className="flex-1" style={{ paddingLeft: "4px", marginTop: "-2px" }}>
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
                        ))}
                      </div>
                    )}

                    <div className="flex justify-center items-center gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => onItemIndexChange(example.id, "prev", example.exampleItems.length)}
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
                        onClick={() => onItemIndexChange(example.id, "next", example.exampleItems.length)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {currentItem.context && (
                  <div className="flex justify-start">
                    <div
                      className="max-w-[80%] px-4 py-3 rounded-lg bg-gray-50 text-gray-700 border border-gray-200"
                      style={{ boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}
                    >
                      <p
                        className="leading-relaxed whitespace-pre-wrap"
                        style={{ ...baseTextStyle, color: "#374151", lineHeight: "1.6" }}
                      >
                        {currentItem.context}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {exampleImages.length > 0 && (
                <div className="flex-shrink-0">
                  <div className="flex flex-col gap-2">
                    {exampleImages.map((imgUrl: string, imgIndex: number) => (
                      <div
                        key={imgIndex}
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden border border-gray-200 shadow-sm"
                      >
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

            {exampleIndex < exampleRecords.length - 1 && (
              <div className="border-t border-gray-300 my-4"></div>
            )}
          </div>
        );
      })}
    </>
  );
};

