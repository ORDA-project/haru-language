export interface Dialogue {
  id: number;
  example_item_id: number;
  speaker: "A" | "B";
  english: string;
  korean: string;
  created_at: string;
}

export interface ExampleItem {
  id: number;
  example_id: number;
  context: string;
  created_at: string;
  Dialogues?: Dialogue[];
}

export interface Example {
  [x: string]: any;
  id: number;
  userId: number;
  extractedText: string;
  generatedExample: any;
  createdAt: string;
  updatedAt: string;
  extracted_sentence?: string;
  description?: string;
  images?: string[]; // 예문 생성에 사용된 이미지 URL 배열
  ExampleItems?: ExampleItem[];
  created_at?: string;
}

export interface CreateExampleParams {
  image: File;
}

export interface CreateExampleResponse {
  extractedText: string;
  generatedExample: any;
}

export interface GetExamplesParams {
  userId: number;
}

export interface GetExamplesResponse {
  message: string;
  data: Example[];
}
