export interface UserData {
  name: string;
  visitCount: number; // 전체 누적 방문 횟수
  mostVisitedDay: string;
  recommendation: string;
}

export interface HomeResponse {
  result: boolean;
  userData?: UserData;
  message?: string;
  error?: string;
}