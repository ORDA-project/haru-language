export interface Question {
  id: number;
  userId: number;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionParams {
  question: string;
}

export interface CreateQuestionResponse {
  answer: string;
}

export interface GetQuestionsParams {
  userId: number;
}

export interface GetQuestionsResponse {
  message: string;
  data: Question[];
}