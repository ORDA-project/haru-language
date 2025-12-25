import React from "react";

type Step = "question" | "sentence-construction" | "result";
type LanguageMode = "korean" | "english";

interface ProgressIndicatorProps {
  currentStep: Step;
  languageMode: LanguageMode;
  onStepClick: (step: Step) => void;
  xSmallTextStyle: React.CSSProperties;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  languageMode,
  onStepClick,
  xSmallTextStyle,
}) => {
  const steps =
    languageMode === "korean"
      ? ["question", "sentence-construction", "result"]
      : ["question", "result"];

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-center space-x-2">
        {steps.map((step, index) => {
          const currentIndex = steps.indexOf(currentStep);
          const isCompleted = currentIndex > index;
          const isCurrent = currentStep === step;
          const isClickable = index <= currentIndex;

          return (
            <div key={step} className="flex items-center">
              <div
                onClick={() => isClickable && onStepClick(step as Step)}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-all duration-200 ${
                  isCurrent
                    ? "bg-[#00DAAA] text-white"
                    : isCompleted
                    ? "bg-[#00DAAA] text-white cursor-pointer hover:bg-[#00C299]"
                    : "bg-gray-200 text-gray-500"
                } ${isClickable ? "cursor-pointer" : "cursor-default"}`}
                style={xSmallTextStyle}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 ${
                    isCompleted ? "bg-[#00DAAA]" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

