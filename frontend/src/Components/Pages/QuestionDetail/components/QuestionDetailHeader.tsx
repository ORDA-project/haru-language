import React from "react";
import { formatDisplayDate } from "../utils";

interface QuestionDetailHeaderProps {
  selectedDate: string;
  date?: string;
  availableDates: string[];
  previousDate: string | null;
  nextDate: string | null;
  onNavigateToDate: (date: string) => void;
  onBack: () => void;
  headerTextStyle: React.CSSProperties;
  xSmallTextStyle: React.CSSProperties;
  smallTextStyle: React.CSSProperties;
}

export const QuestionDetailHeader: React.FC<QuestionDetailHeaderProps> = ({
  selectedDate,
  date,
  availableDates,
  previousDate,
  nextDate,
  onNavigateToDate,
  onBack,
  headerTextStyle,
  xSmallTextStyle,
  smallTextStyle,
}) => {
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue) {
      onNavigateToDate(newValue);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 space-y-3 w-full max-w-full overflow-hidden box-border p-4">
      <div className="flex items-center justify-between w-full min-w-0 gap-2">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center flex-shrink-0"
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
        <div className="text-center flex-1 min-w-0 overflow-hidden">
          <h1 className="font-semibold text-gray-800 break-words" style={{...headerTextStyle, wordBreak: 'break-word', overflowWrap: 'break-word'}}>
            {formatDisplayDate(selectedDate || date)}
          </h1>
          {availableDates.length > 0 && (
            <p className="text-gray-500 mt-1 break-words" style={{...xSmallTextStyle, wordBreak: 'break-word', overflowWrap: 'break-word'}}>
              총 {availableDates.length}일의 기록
            </p>
          )}
        </div>
        <div className="w-8 flex-shrink-0" />
      </div>
      <div className="flex items-center gap-2 w-full min-w-0">
        <button
          onClick={() => previousDate && onNavigateToDate(previousDate)}
          disabled={!previousDate}
          className={`px-2 py-2 rounded-lg font-medium transition-colors flex-shrink-0 whitespace-nowrap ${
            previousDate
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
          style={smallTextStyle}
        >
          이전
        </button>
        <input
          type="date"
          value={selectedDate || ""}
          onChange={handleDateInputChange}
          className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00DAAA] box-border"
          style={{...smallTextStyle, width: '100%', maxWidth: '100%'}}
        />
        <button
          onClick={() => nextDate && onNavigateToDate(nextDate)}
          disabled={!nextDate}
          className={`px-2 py-2 rounded-lg font-medium transition-colors flex-shrink-0 whitespace-nowrap ${
            nextDate
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
          style={smallTextStyle}
        >
          다음
        </button>
      </div>
    </div>
  );
};

