export interface UserDetails {
  id: number;
  social_id?: string;
  social_provider?: string;
  name?: string;
  email?: string;
  gender?: string; // "male" | "female" | "private"
  goal?: string; // "hobby" | "exam" | "business" | "travel"
  interests?: string[]; // ["conversation", "reading", "grammar", "business", "vocabulary"]
  books?: string[]; // ["none", "travel_conversation", "daily_conversation", "english_novel", "textbook"]
  profileImage?: string;
  level?: string;
  points?: number;
  createdAt?: string;
  updatedAt?: string;
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