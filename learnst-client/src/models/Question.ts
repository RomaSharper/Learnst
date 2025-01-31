import { AnswerType } from '../enums/AnswerType';
import { Answer } from './Answer';
import { Lesson } from './Lesson';
import { UserAnswer } from './UserAnswer';

export interface Question {
  id: string; // Guid
  text: string;
  answerType: AnswerType;
  lessonId: string; // Guid
  lesson?: Lesson;
  answers: Answer[];
  userAnswers: UserAnswer[];
}
