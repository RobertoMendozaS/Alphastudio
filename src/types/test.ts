export interface TestQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface TestResult {
  topic: string;
  type: 'pre' | 'post';
  questions: TestQuestion[];
  answers: number[];
  score: number;
  total: number;
  timestamp: string;
}
