/**
 * 날짜 유틸리티 함수
 * 오전 4시~다음날 3:59am 기준으로 날짜를 계산합니다.
 */

/**
 * 오전 4시 기준으로 오늘 날짜를 계산합니다.
 * 현재 시간이 오전 4시 이전이면 어제 날짜를, 4시 이후면 오늘 날짜를 반환합니다.
 * @returns {Date} 기준 날짜 (시간은 00:00:00으로 설정)
 */
export function getTodayBy4AM(): Date {
  const now = new Date();
  // 한국 시간으로 변환
  const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  
  // 오전 4시 기준으로 날짜 계산
  const hour = koreaTime.getHours();
  const today = new Date(koreaTime);
  
  // 오전 4시 이전이면 어제 날짜 사용
  if (hour < 4) {
    today.setDate(today.getDate() - 1);
  }
  
  // 시간을 00:00:00으로 설정
  today.setHours(0, 0, 0, 0);
  
  return today;
}

/**
 * 오전 4시 기준으로 오늘 날짜 문자열을 반환합니다 (YYYY-MM-DD 형식).
 * @returns {string} 날짜 문자열 (예: "2024-01-15")
 */
export function getTodayStringBy4AM(): string {
  const today = getTodayBy4AM();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 날짜 문자열을 해시하여 정수 인덱스를 반환합니다.
 * @param {string} dateString - 날짜 문자열 (YYYY-MM-DD)
 * @returns {number} 해시 값
 */
export function hashDateString(dateString: string): number {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
