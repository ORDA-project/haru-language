import React from "react";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  examples?: Array<{
    context: string;
    dialogue: {
      A: { english: string; korean?: string };
      B: { english: string; korean?: string };
    };
  }>;
}

interface ChatMessageProps {
  message: Message;
  isLargeTextMode: boolean;
  baseTextStyle: React.CSSProperties;
  onExampleScrollChange?: (messageId: string, index: number) => void;
  exampleScrollIndex?: number;
  children?: React.ReactNode; // 예문 카드는 children으로 전달
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLargeTextMode,
  baseTextStyle,
  children,
}) => {
  // 예문이 있으면 children(예문 카드)만 렌더링
  if (message.examples && message.examples.length > 0) {
    return <>{children}</>;
  }

  // 일반 메시지 렌더링
  return (
    <div
      className={`flex ${
        message.type === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          message.type === "user"
            ? "bg-gray-200 text-gray-800"
            : "bg-gray-200 text-gray-800 shadow-sm border border-gray-100"
        }`}
      >
        {/* 텍스트 내용 표시 */}
        {message.content && (
          message.type === "ai" ? (
            <div
              className="leading-relaxed"
              style={baseTextStyle}
              dangerouslySetInnerHTML={{
                __html: message.content
                  .replace(/"text-decoration:\s*underline;\s*color:\s*#00DAAA;\s*font-weight:\s*500;">/gi, "")
                  .replace(/"text-decoration:\s*underline;\s*color:\s*#00DAAA;\s*font-weight:\s*500;"/gi, "")
                  .replace(/\*\*(.*?)\*\*/g, "<u>$1</u>")
                  .replace(/__(.*?)__/g, "<u>$1</u>")
                  .replace(/\*(.*?)\*/g, "<u>$1</u>"),
              }}
            />
          ) : (
            <p className="leading-relaxed whitespace-pre-wrap" style={baseTextStyle}>
              {message.content}
            </p>
          )
        )}
      </div>
    </div>
  );
};

