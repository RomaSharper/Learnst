import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { Return } from '../../helpers/Return';
import { Question } from '../../models/Question';
import { UserAnswer } from '../../models/UserAnswer';
import { AnswersService } from '../../services/answers.service';
import { AuthService } from '../../services/auth.service';
import { AnswerType } from './../../enums/AnswerType';

@Return()
@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.less'],
  imports: [
    CommonModule,
    MatCardModule,
    MatRadioModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ]
})
export class QuestionsComponent implements OnInit {
  userId!: string;
  isTestEnded?: boolean;
  AnswerType = AnswerType;
  userAnswers: UserAnswer[] = [];
  @Input() questions?: Question[];
  loadingQuestions: Set<string> = new Set(); // Для хранения ID вопросов, которые загружаются
  selectedAnswers: { answerId: number, questionId: string }[] = [];

  constructor(
    private answersService: AnswersService,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.authService.getUser().subscribe(user => {
      this.userId = user?.id!;
      if (this.questions) {
        this.loadUserAnswers();
        this.isTestEnded = this.isTestCompleted();
      } else {
        console.warn('Вопросы не загружены.');
      }
    });
  }

  loadUserAnswers(): void {
    if (!this.questions || this.questions.length === 0) {
      console.warn('Вопросы отсутствуют или пусты.');
      return;
    }

    const lessonId = this.questions[0].lessonId;

    // Добавляем все вопросы в состояние загрузки
    this.questions.forEach(question => this.loadingQuestions.add(question.id));

    // Загружаем ответы пользователя для всех вопросов
    this.answersService.getUserAnswersByLesson(lessonId, this.userId).subscribe({
      next: (answers) => {
        this.userAnswers = answers;

        // Убираем вопросы из состояния загрузки
        this.questions?.forEach(question => this.loadingQuestions.delete(question.id));

        // Проверяем, завершён ли тест после загрузки ответов
        this.isTestEnded = this.isTestCompleted();
      },
      error: (err) => {
        console.error('Ошибка при загрузке ответов:', err);
        // Убираем вопросы из состояния загрузки в случае ошибки
        this.questions?.forEach(question => this.loadingQuestions.delete(question.id));
      }
    });
  }

  isLoading(questionId: string): boolean {
    return this.loadingQuestions.has(questionId);
  }

  selectAnswer(answerId: number, questionId: string, isChecked: boolean): void {
    if (isChecked) {
      this.selectedAnswers.push({ answerId, questionId });
      return;
    }
    this.selectedAnswers = this.selectedAnswers.filter(answer => answer.answerId !== answerId);
  }

  submitAnswers(): void {
    console.log('Отправка ответов...');
    const userAnswers: UserAnswer[] = this.selectedAnswers.map(answer => ({
      userId: this.userId,
      answerId: answer.answerId
    }));

    this.answersService.answerQuestions(userAnswers).subscribe({
      next: (responses) => {
        // Обновляем userAnswers
        this.userAnswers = [...this.userAnswers, ...responses];

        // Очищаем выбранные ответы
        this.selectedAnswers = [];

        // Проверяем, завершён ли тест
        this.isTestEnded = this.isTestCompleted();
      },
      error: (err) => {
        console.error('Ошибка при сохранении ответов:', err);
      }
    });
  }

  isAnswerSelected(answerId: number, questionId: string): boolean {
    return this.userAnswers.some(userAnswer => {
      const answer = this.questions!
        .flatMap(q => q.answers)
        .find(a => a.id === userAnswer.answerId);

      return answer?.questionId === questionId && userAnswer.answerId === answerId;
    });
  }

  isQuestionAnswered(questionId: string): boolean {
    const isAnswered = this.userAnswers.some(userAnswer => {
      // Находим ответ по answerId
      const answer = this.questions!
        .flatMap(q => q.answers)
        .find(a => a.id === userAnswer.answerId);

      // Проверяем, что ответ принадлежит текущему вопросу
      const belongsToQuestion = answer?.questionId === questionId;
      return belongsToQuestion;
    });
    return isAnswered;
  }

  isAnswerCorrect(questionId: string): boolean {
    // Находим все ответы пользователя на этот вопрос
    const userAnswers = this.userAnswers
      .filter(userAnswer => {
        const answer = this.questions!
          .flatMap(q => q.answers)
          .find(a => a.id === userAnswer.answerId);
        return answer?.questionId === questionId;
      })
      .map(userAnswer => userAnswer.answerId);

    if (userAnswers.length === 0) {
      return false;
    }

    // Находим вопрос
    const question = this.questions!.find(q => q.id === questionId);
    if (!question) {
      console.log('Вопрос не найден.');
      return false;
    }

    // Находим все правильные ответы на этот вопрос
    const correctAnswers = question.answers
      .filter(a => a.isCorrect)
      .map(a => a.id);

    // Проверяем, совпадают ли ответы пользователя с правильными ответами
    const isCorrect =
      userAnswers.length === correctAnswers.length &&
      userAnswers.every(answer => correctAnswers.includes(answer)) &&
      correctAnswers.every(answer => userAnswers.includes(answer));

    return isCorrect;
  }

  isTestCompleted(): boolean {
    if (!this.questions || this.questions.length === 0)
      return false;

    // Проверяем, ответил ли пользователь на все вопросы
    const allAnswered = this.questions.every(question => this.isQuestionAnswered(question.id));
    return allAnswered;
  }
}
