export interface UserDetails {
  id: number;
  userId: number;
  name?: string;
  email?: string;
  profileImage?: string;
  level?: string;
  points?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDetailsParams {
  name?: string;
  email?: string;
  profileImage?: string;
  level?: string;
}

export interface UpdateUserDetailsParams {
  name?: string;
  email?: string;
  profileImage?: string;
  level?: string;
}

export interface UserDetailsResponse {
  success: boolean;
  data?: UserDetails;
  message?: string;
}