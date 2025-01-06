export interface Example {
    id: string;
    context: string;
    dialogue: {
      A: { english: string; korean: string };
      B: { english: string; korean: string };
    };
  }
  