import React, { useState } from "react";
import { DeleteActionBar } from "./DeleteActionBar";
import { DeleteModeToggle } from "./DeleteModeToggle";
import { ChatExampleCard } from "./ChatExampleCard";
import { useChatTTS } from "../hooks/useChatTTS";

interface ChatMessagesSectionProps {
  chatMessages: any[];
  targetDate: string;
  isDeleteMode: boolean;
  selectedIds: Set<string>;
  exampleScrollIndices: Record<string, number>;
  onToggleDeleteMode: () => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: () => void;
  onExampleScrollChange: (messageId: string, index: number) => void;
  isLargeTextMode: boolean;
  baseTextStyle: React.CSSProperties;
  smallTextStyle: React.CSSProperties;
  xSmallTextStyle: React.CSSProperties;
  headerTextStyle: React.CSSProperties;
}

export const ChatMessagesSection: React.FC<ChatMessagesSectionProps> = ({
  chatMessages,
  targetDate,
  isDeleteMode,
  selectedIds,
  exampleScrollIndices,
  onToggleDeleteMode,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onExampleScrollChange,
  isLargeTextMode,
  baseTextStyle,
  smallTextStyle,
  xSmallTextStyle,
  headerTextStyle,
}) => {
  const { isPlayingTTS, playingChatExampleId, playChatExampleTTS, stopTTS } = useChatTTS();

  if (chatMessages.length === 0) return null;

  const allSelected = selectedIds.size === chatMessages.length && chatMessages.length > 0;

  return (
    <>
      <div className="space-y-2 w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between w-full min-w-0 gap-2">
          <div className="font-semibold text-gray-600 flex-shrink-0" style={headerTextStyle}>
            채팅기록
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
              deleteMessage={`선택한 ${selectedIds.size}개의 채팅 기록을 삭제하시겠습니까?`}
              baseTextStyle={baseTextStyle}
              smallTextStyle={smallTextStyle}
            />
          </>
        )}
      </div>

      {chatMessages.map((message: any, index: number) => {
        // 실제 DB ID만 사용 (임시 ID는 삭제 불가)
        const messageId = message.id && typeof message.id === 'string' && !isNaN(Number(message.id))
          ? String(message.id)
          : message.id && typeof message.id === 'number'
          ? String(message.id)
          : null;
        const isSelected = messageId ? selectedIds.has(messageId) : false;
        const currentIndex = exampleScrollIndices[messageId] ?? 0;
        const currentExample = message.examples?.[currentIndex];
        const exampleId = `${messageId}-${currentIndex}`;
        const isPlaying = playingChatExampleId === exampleId && isPlayingTTS;

        // ID가 없으면 렌더링하지 않음 (삭제 불가)
        if (!messageId) return null;
        
        return (
          <div
            key={messageId}
            className={`space-y-3 relative transition-all duration-200 ${
              isDeleteMode && isSelected ? "ring-2 ring-red-500 ring-offset-2 rounded-lg" : ""
            }`}
          >
            {/* 사용자 메시지 */}
            {message.type === "user" && (
              <div className="flex justify-end items-start gap-3">
                {isDeleteMode && messageId && (
                  <div className="flex-shrink-0 pt-1">
                    <button
                      onClick={() => messageId && onToggleSelect(messageId)}
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
                  className={`max-w-[80%] min-w-0 ${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"} rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100 transition-all ${
                    isDeleteMode && isSelected ? "bg-red-50 border-red-200" : ""
                  }`}
                  style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
                >
                  {message.content && message.content.trim() && (
                    <p
                      className="leading-relaxed whitespace-pre-wrap break-words"
                      style={{ ...baseTextStyle, wordBreak: "break-word", overflowWrap: "break-word" }}
                    >
                      {message.content}
                    </p>
                  )}
                  {!message.content && (
                    <p className="text-gray-400 italic" style={smallTextStyle}>
                      (빈 메시지)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* AI 메시지 */}
            {message.type === "ai" && (
              <div className="flex justify-start items-start gap-3">
                {isDeleteMode && messageId && (
                  <div className="flex-shrink-0 pt-1">
                    <button
                      onClick={() => messageId && onToggleSelect(messageId)}
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
                  className={`max-w-[80%] min-w-0 ${isLargeTextMode ? "px-5 py-4" : "px-4 py-3"} rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100 transition-all ${
                    isDeleteMode && isSelected ? "bg-red-50 border-red-200" : ""
                  }`}
                  style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
                >
                  {message.examples && message.examples.length > 0 ? (
                    <div className="space-y-3">
                      {message.content && (
                        <div
                          className="leading-relaxed whitespace-pre-wrap"
                          style={baseTextStyle}
                          dangerouslySetInnerHTML={{
                            __html: message.content
                              .replace(/"text-decoration:\s*underline;\s*color:\s*#00DAAA;\s*font-weight:\s*500;">/gi, "")
                              .replace(/\*\*(.*?)\*\*/g, "<u>$1</u>")
                              .replace(/__(.*?)__/g, "<u>$1</u>")
                              .replace(/\*(.*?)\*/g, "<u>$1</u>")
                              .replace(/\n/g, "<br>"),
                          }}
                        />
                      )}
                      {currentExample && (
                        <ChatExampleCard
                          example={currentExample}
                          currentIndex={currentIndex}
                          totalExamples={message.examples.length}
                          onPrevious={() => {
                            const newIndex = Math.max(0, currentIndex - 1);
                            onExampleScrollChange(messageId, newIndex);
                          }}
                          onNext={() => {
                            const newIndex = Math.min(message.examples.length - 1, currentIndex + 1);
                            onExampleScrollChange(messageId, newIndex);
                          }}
                          onPlay={() => {
                            if (isPlaying) {
                              stopTTS();
                            } else if (currentExample.dialogue?.A?.english && currentExample.dialogue?.B?.english) {
                              playChatExampleTTS(
                                currentExample.dialogue.A.english,
                                currentExample.dialogue.B.english,
                                exampleId
                              );
                            }
                          }}
                          isPlaying={isPlaying}
                          baseTextStyle={baseTextStyle}
                          smallTextStyle={smallTextStyle}
                          xSmallTextStyle={xSmallTextStyle}
                        />
                      )}
                    </div>
                  ) : (
                    <>
                      {message.content && message.content.trim() ? (
                        <div
                          className="leading-relaxed whitespace-pre-wrap"
                          style={baseTextStyle}
                          dangerouslySetInnerHTML={{
                            __html: message.content
                              .replace(/"text-decoration:\s*underline;\s*color:\s*#00DAAA;\s*font-weight:\s*500;">/gi, "")
                              .replace(/\*\*(.*?)\*\*/g, "<u>$1</u>")
                              .replace(/__(.*?)__/g, "<u>$1</u>")
                              .replace(/\*(.*?)\*/g, "<u>$1</u>")
                              .replace(/\n/g, "<br>"),
                          }}
                        />
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="border-t border-gray-300 my-4"></div>
    </>
  );
};

