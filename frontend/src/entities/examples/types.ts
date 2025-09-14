export interface Example {
  id: number;
  userId: number;
  extractedText: string;
  generatedExample: any;
  createdAt: string;
  updatedAt: string;
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