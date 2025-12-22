/**
 * localStorage 관련 유틸리티 함수
 */

import { getTodayStringBy4AM } from "./dateUtils";

/**
 * 오늘 날짜 기준으로 저장 키 생성
 */
export const createStorageKey = (prefix: string): string => {
  const dateKey = getTodayStringBy4AM();
  return `${prefix}_${dateKey}`;
};

/**
 * localStorage에 안전하게 저장
 */
export const safeSetItem = (key: string, value: any): boolean => {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`localStorage 저장 실패 (${key}):`, error);
    }
    return false;
  }
};

/**
 * localStorage에서 안전하게 불러오기
 */
export const safeGetItem = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    return JSON.parse(item) as T;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`localStorage 불러오기 실패 (${key}):`, error);
    }
    return null;
  }
};

/**
 * 오늘 날짜 기준으로 저장된 데이터가 유효한지 확인
 */
export const isTodayData = (timestamp: string): boolean => {
  try {
    const savedDate = new Date(timestamp);
    const today = new Date();
    const todayBy4AM = new Date(today);
    todayBy4AM.setHours(4, 0, 0, 0);
    if (today < todayBy4AM) {
      todayBy4AM.setDate(todayBy4AM.getDate() - 1);
    }
    return savedDate >= todayBy4AM;
  } catch {
    return false;
  }
};

