// 툴팁 관련 상수

export const TOOLTIP_CONSTANTS = {
  OVERLAY_OPACITY: 0.3,
  RIGHT_CLICK_THRESHOLD: 0.67, // 화면의 67% 이상 클릭 시 다음 페이지
  TOOLTIP_OFFSET: 10, // 툴팁과 타겟 요소 사이의 기본 간격
  Z_INDEX: 50, // 툴팁 오버레이 z-index
} as const;

export const TOOLTIP_STYLES = {
  OVERLAY: "fixed inset-0 z-50 bg-black bg-opacity-30",
  INDICATOR: "absolute top-4 left-1/2 transform -translate-x-1/2 z-10",
  CLOSE_BUTTON: "absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md z-10 hover:bg-gray-100 transition-colors",
} as const;

