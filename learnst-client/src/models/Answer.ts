import { Question } from './Question';

export interface Answer {
  id: number;
  text: string;
  isCorrect: boolean;
  questionId: string; // Guid
  question?: Question;
}
