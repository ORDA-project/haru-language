export interface Answer {
  content: string;
}

export interface Question {
  id: number;
  content: string;
  created_at: string;
  Answers: Answer[];
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
