export interface UserData {
  name: string;
  visitCount: number;
  mostVisitedDay: string;
  recommendation: string;
}

export interface HomeResponse {
  result: boolean;
  userData?: UserData;
  message?: string;
  error?: string;
}