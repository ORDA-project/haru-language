import { Example } from "../../../types";

interface ExampleApiResponse {
  extractedText?: string;
  generatedExample?: {
    generatedExample?: {
      description?: string;
      examples?: Array<{
        context?: string;
        dialogue?: {
          A?: { english?: string; korean?: string };
          B?: { english?: string; korean?: string };
        };
      }>;
    };
    description?: string;
    examples?: Array<{
      context?: string;
      dialogue?: {
        A?: { english?: string; korean?: string };
        B?: { english?: string; korean?: string };
      };
    }>;
  };
}

export const normalizeExampleResponse = (response: ExampleApiResponse) => {
  let actualExample = response?.generatedExample;
  if (actualExample?.generatedExample) {
    actualExample = actualExample.generatedExample;
  }
  return actualExample;
};

export const transformApiExamplesToLocal = (apiExamples: Array<any>): Example[] => {
  return apiExamples.map((ex) => ({
    id: `${Date.now()}-${Math.random()}`,
    context: ex.context || "",
    dialogue: {
      A: {
        english: ex.dialogue?.A?.english || "",
        korean: ex.dialogue?.A?.korean || "",
      },
      B: {
        english: ex.dialogue?.B?.english || "",
        korean: ex.dialogue?.B?.korean || "",
      },
    },
  }));
};

