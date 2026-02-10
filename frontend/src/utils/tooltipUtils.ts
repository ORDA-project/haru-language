// 툴팁 표시 여부를 localStorage에 저장/확인하는 유틸리티

export const TOOLTIP_KEYS = {
  HOME: "tooltip_home_seen",
  DAILY_SENTENCE_LANGUAGE_MODE: "tooltip_daily_sentence_language_mode",
  SENTENCE_CONSTRUCTION_HELP: "tooltip_sentence_construction_help",
  EXAMPLE_GENERATION: "tooltip_example_generation",
  REVISED_ANSWER: "tooltip_revised_answer",
} as const;

export const hasSeenTooltip = (key: string): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(key) === "true";
};

export const markTooltipAsSeen = (key: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, "true");
};

export const shouldShowHomeTooltip = (): boolean => {
  // 처음 회원가입 후 홈 화면 진입 시 한 번만 표시 (아직 툴팁을 본 적 없을 때)
  return !hasSeenTooltip(TOOLTIP_KEYS.HOME);
};

export const shouldShowFeatureTooltip = (key: string): boolean => {
  // 각 기능의 첫 사용 시에만 표시
  return !hasSeenTooltip(key);
};

