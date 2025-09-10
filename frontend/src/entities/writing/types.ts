export interface WritingCorrection {
  id: number;
  userId: number;
  originalText: string;
  correctedText: string;
  feedback: string;
  writingQuestionId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WritingTranslation {
  id: number;
  userId: number;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  createdAt: string;
  updatedAt: string;
}

export interface CorrectWritingParams {
  text: string;
  writingQuestionId?: number;
}

export interface CorrectWritingResponse {
  message: string;
  data: WritingCorrection;
}

export interface TranslateWritingParams {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslateWritingResponse {
  message: string;
  data: WritingTranslation;
}