/**
 * 예문 관련 유틸리티 함수
 */

import { Example } from "../types";

/**
 * 예문을 그룹으로 나누기
 */
export const EXAMPLES_PER_GROUP = 3;

export const groupExamples = (examples: Example[]): Example[][] => {
  const groups: Example[][] = [];
  for (let i = 0; i < examples.length; i += EXAMPLES_PER_GROUP) {
    groups.push(examples.slice(i, i + EXAMPLES_PER_GROUP));
  }
  return groups;
};

/**
 * 상황 설명 텍스트 포맷팅
 * 백엔드에서 이미 자세한 설명을 생성하므로 그대로 사용
 */
export const formatContextText = (context: string | undefined): string => {
  if (!context) {
    return "이런 상황에서 사용하는 대화입니다";
  }

  // 백엔드에서 이미 자세한 설명을 생성하므로 그대로 반환
  return context.trim();
};

