export type ExampleDialogue = {
  speaker: string;
  english: string;
  korean?: string;
};

export type ExampleItem = {
  context: string;
  dialogues: ExampleDialogue[];
};

export type ExampleRecord = {
  id: number;
  description: string;
  exampleItems: ExampleItem[];
  extractedSentence?: string;
  images?: string[]; // 예문 생성에 사용된 이미지 URL 배열
};

export type WritingRecord = {
  id: number;
  writing_question_id: number;
  original_text: string;
  processed_text?: string;
  feedback?: string | string[];
  created_at: string;
};

export type Question = {
  id: number;
  content: string;
  created_at: string;
  Answers?: Array<{
    content: string;
  }>;
};

