export interface User {
  userId: number;
  name: string;
  email?: string;
  provider?: string;
  visitCount?: number;
  mostVisitedDays?: string;
}

export interface AuthCheckResponse {
  isLoggedIn: boolean;
  user: User | null;
}

export interface LogoutResponse {
  message: string;
}