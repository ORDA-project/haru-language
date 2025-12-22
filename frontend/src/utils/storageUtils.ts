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

/**
 * 예문 생성 상태에서 특정 예문 ID들을 제거
 */
export const removeExamplesFromStorage = (exampleIds: number[]): void => {
  try {
    const storageKey = createStorageKey("example_generation_state");
    const saved = safeGetItem<any>(storageKey);
    if (saved && saved.examples && Array.isArray(saved.examples)) {
      const filteredExamples = saved.examples.filter((ex: any) => 
        !exampleIds.includes(ex.id)
      );
      if (filteredExamples.length === 0) {
        // 모든 예문이 삭제되면 localStorage에서 제거
        localStorage.removeItem(storageKey);
      } else {
        saved.examples = filteredExamples;
        safeSetItem(storageKey, saved);
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("예문 localStorage 삭제 실패:", error);
    }
  }
};

/**
 * 채팅 메시지에서 특정 question ID들을 제거
 * questionIds와 questionContents를 모두 받아서 매칭
 */
export const removeChatMessagesFromStorage = (
  questionIds: number[], 
  questionContents: string[],
  storageKeyPrefix: string = "stage_chat_messages"
): void => {
  try {
    const storageKey = createStorageKey(storageKeyPrefix);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const messages = JSON.parse(saved);
      if (Array.isArray(messages)) {
        // questionId를 문자열로 변환하여 비교
        const questionIdStrings = questionIds.map(id => String(id));
        const filteredMessages: any[] = [];
        let skipNextAI = false;
        
        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          
          // 메시지에 questionId가 있으면 그것으로 비교
          if (msg.questionId && questionIdStrings.includes(String(msg.questionId))) {
            skipNextAI = true;
            continue; // 이 메시지와 다음 AI 메시지들을 건너뛰기
          }
          
          // questionId가 없으면 content로 비교 (user 메시지의 경우)
          if (msg.type === "user" && msg.content) {
            const shouldRemove = questionContents.some(content => {
              const msgContent = msg.content.trim();
              const questionContent = content.trim();
              return msgContent === questionContent || msgContent.includes(questionContent) || questionContent.includes(msgContent);
            });
            if (shouldRemove) {
              skipNextAI = true;
              continue; // 이 user 메시지와 다음 AI 메시지들을 건너뛰기
            }
          }
          
          // AI 메시지이고 이전 user 메시지가 삭제된 경우 건너뛰기
          if (skipNextAI && msg.type === "ai") {
            continue;
          }
          
          // skipNextAI를 리셋 (다음 user 메시지를 만나면)
          if (msg.type === "user") {
            skipNextAI = false;
          }
          
          filteredMessages.push(msg);
        }
        
        if (filteredMessages.length === 0) {
          localStorage.removeItem(storageKey);
        } else {
          localStorage.setItem(storageKey, JSON.stringify(filteredMessages));
        }
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("채팅 localStorage 삭제 실패:", error);
    }
  }
};

