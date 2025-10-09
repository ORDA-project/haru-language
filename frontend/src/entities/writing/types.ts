// Writing Question 타입 (API 문서에 맞춤)
export interface WritingQuestion {
  id: number;
  englishQuestion: string;
  koreanQuestion: string;
  secondQuestion?: {
    english: string;
    korean: string;
  };
  thirdQuestion?: {
    english: string;
    korean: string;
  };
  example?: {
    korean: string;
    english: string;
  };
}

export interface GetWritingQuestionsResponse {
  message: string;
  data: WritingQuestion[];
}

export interface GetWritingQuestionResponse {
  message: string;
  data: WritingQuestion;
}

// Writing Correction 타입 (API 문서에 맞춤)
export interface WritingCorrection {
  originalText: string;
  processedText: string;
  hasErrors: boolean;
  feedback: string[];
}

export interface CorrectWritingParams {
  text: string;
  userId: number;
  writingQuestionId: number;
}

export interface CorrectWritingResponse {
  message: string;
  data: WritingCorrection;
}

// Writing Translation 타입 (API 문서에 맞춤)
export interface SentencePair {
  originalSentence: string;
  koreanSentence?: string;
  englishSentence?: string;
  shuffledWords: string[];
}

export interface WritingTranslation {
  originalText: string;
  sentencePairs: SentencePair[];
  feedback: string[];
  example?: {
    korean: string;
    english: string;
  };
}

export interface TranslateWritingParams {
  text: string;
  userId: number;
  writingQuestionId: number;
}

export interface TranslateWritingResponse {
  message: string;
  data: WritingTranslation;
}

// Writing Record 타입 (API 문서에 맞춤)
export interface WritingRecord {
  original_text: string;
  processed_text: string;
  feedback: string[];
}

export interface GetWritingRecordsResponse {
  message: string;
  data: WritingRecord[];
}
