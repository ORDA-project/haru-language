/**
 * 스타일 관련 유틸리티 함수
 */

import React from "react";

export interface TextStyles {
  base: React.CSSProperties;
  small: React.CSSProperties;
  xSmall: React.CSSProperties;
  header: React.CSSProperties;
}

export interface ExtendedTextStyles extends TextStyles {
  correction: React.CSSProperties;
  feedback: React.CSSProperties;
}

/**
 * 큰글씨 모드에 따른 텍스트 스타일 생성
 */
export const createTextStyles = (isLargeTextMode: boolean): TextStyles => {
  const baseFontSize = isLargeTextMode ? 20 : 16;
  const smallFontSize = isLargeTextMode ? 18 : 14;
  const xSmallFontSize = isLargeTextMode ? 16 : 12;
  const headerFontSize = isLargeTextMode ? 24 : 20;

  const commonStyle: Pick<React.CSSProperties, 'wordBreak' | 'overflowWrap'> = {
    wordBreak: 'keep-all' as const,
    overflowWrap: 'break-word' as const,
  };

  return {
    base: {
      fontSize: `${baseFontSize}px`,
      ...commonStyle,
    },
    small: {
      fontSize: `${smallFontSize}px`,
      ...commonStyle,
    },
    xSmall: {
      fontSize: `${xSmallFontSize}px`,
      ...commonStyle,
    },
    header: {
      fontSize: `${headerFontSize}px`,
      ...commonStyle,
    },
  };
};

/**
 * 확장된 텍스트 스타일 생성 (correction, feedback 포함)
 */
export const createExtendedTextStyles = (isLargeTextMode: boolean): ExtendedTextStyles => {
  const baseStyles = createTextStyles(isLargeTextMode);
  const correctionTextSize = isLargeTextMode ? 16 : 12;
  const feedbackTextSize = isLargeTextMode ? 18 : 14;

  const commonStyle: Pick<React.CSSProperties, 'wordBreak' | 'overflowWrap'> = {
    wordBreak: 'keep-all' as const,
    overflowWrap: 'break-word' as const,
  };

  return {
    ...baseStyles,
    correction: {
      fontSize: `${correctionTextSize}px`,
      ...commonStyle,
    },
    feedback: {
      fontSize: `${feedbackTextSize}px`,
      ...commonStyle,
    },
  };
};

