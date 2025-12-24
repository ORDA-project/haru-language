import React from "react";

interface CheckboxButtonProps {
  isSelected: boolean;
  onToggle: () => void;
  ariaLabel: string;
}

export const CheckboxButton: React.FC<CheckboxButtonProps> = ({
  isSelected,
  onToggle,
  ariaLabel,
}) => {
  return (
    <button
      onClick={onToggle}
      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
        isSelected 
          ? 'bg-red-500 border-red-500' 
          : 'bg-white border-gray-300 hover:border-red-400'
      }`}
      aria-label={ariaLabel}
    >
      {isSelected && (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
};

