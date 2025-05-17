import {MatStepper, MatStepperModule} from '@angular/material/stepper';
import {Component, inject, Input, OnChanges, ViewChild} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatRadioModule} from '@angular/material/radio';
import {Return} from '../../helpers/Return';
import {Question} from '../../models/Question';
import {UserAnswer} from '../../models/UserAnswer';
import {AnswersService} from '../../services/answers.service';
import {AuthService} from '../../services/auth.service';
import {AnswerType} from '../../enums/AnswerType';
import {MatDividerModule} from '@angular/material/divider';
import {StepperSelectionEvent} from '@angular/cdk/stepper';
import {MatTooltipModule} from '@angular/material/tooltip';
import {lastValueFrom} from 'rxjs';
import {LogService} from '../../services/log.service';

@Return()
@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.scss'],
  imports: [
    MatCardModule,
    MatRadioModule,
    MatButtonModule,
    MatStepperModule,
    MatDividerModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ]
})
export class QuestionsComponent implements OnChanges {
  userId!: string;
  isTestEnded = false;
  selectedStepIndex = 0;
  userAnswers: UserAnswer[] = [];
  correctAnswersCount = 0;
  @Input() questions?: Question[];
  isTransitioning = false;
  AnswerType = AnswerType;
  loadingQuestions: Set<string> = new Set();
  @ViewChild("stepper") stepper!: MatStepper;
  selectedAnswers: { answerId: number, questionId: string }[] = [];
  private logService = inject(LogService);
  private authService = inject(AuthService);
  private answersService = inject(AnswersService);

  ngOnChanges(): void {
    this.authService.getUser().subscribe(user => {
      this.userId = user?.id!;
      if (this.questions?.length && this.userId)
        this.loadUserAnswers();
      else
        this.logService.errorWithData('Вопросы не загружены.');
    });
  }

  async moveToNextUnanswered(): Promise<void> {
    if (this.isTestEnded || !this.questions) return;

    const nextIndex = this.questions.findIndex(
      (q, index) => index > this.selectedStepIndex && !this.isQuestionAnswered(q.id)
    );

    if (nextIndex !== -1) {
      this.selectedStepIndex = nextIndex;
    } else {
      this.selectedStepIndex = this.questions.length; // Перейти на шаг результатов
      this.isTestEnded = true;
    }

    // Синхронизировать с UI
    this.updateSelectedStep();
  }

  async submitAnswers(): Promise<void> {
    if (this.selectedAnswers.length === 0) return;

    const userAnswers: UserAnswer[] = this.selectedAnswers.map(answer => ({
      userId: this.userId,
      answerId: answer.answerId
    }));

    try {
      const responses = await lastValueFrom(this.answersService.answerQuestions(userAnswers));
      this.userAnswers = [...this.userAnswers, ...responses!];
      this.selectedAnswers = [];
      this.calculateProgress();
      this.isTestEnded = this.isTestCompleted();
    } catch (error) {
      if (!(error instanceof Error)) return;
      this.logService.errorWithData('Ошибка сохранения:', error);
    }
  }

  async handleNextOrComplete(): Promise<void> {
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    try {
      await this.submitAnswers(); // Просто сохраняем

      await new Promise(res => setTimeout(res, 400));

      // Если тест завершён – переход к результатам
      if (this.isTestCompleted() && this.questions) {
        this.isTestEnded = true;
        this.selectedStepIndex = this.questions.length;
      } else {
        // Строго на следующий вопрос (не искать следующий пропущенный)
        this.selectedStepIndex++;
      }

      this.updateSelectedStep();
    } finally {
      this.isTransitioning = false;
    }
  }

  isLastQuestion(): boolean {
    if (!this.questions) return true;
    const currentIndex = this.selectedStepIndex;
    for (let i = currentIndex + 1; i < this.questions.length; i++) {
      if (!this.isQuestionAnswered(this.questions[i].id)) {
        return false;
      }
    }
    return true;
  }

  isLoading(questionId: string): boolean {
    return this.loadingQuestions.has(questionId);
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
    // Проверяем только сохраненные ответы
    return this.userAnswers.some(userAnswer => {
      const answer = this.questions!
        .flatMap(q => q.answers)
        .find(a => a.id === userAnswer.answerId);
      return answer?.questionId === questionId;
    });
  }

  isAnswerCorrect(questionId: string): boolean {
    if (!this.questions || !this.questions.length) return false;

    // Используем только сохраненные ответы
    const userAnswers = this.userAnswers
      .filter(answer => {
        const ans = this.questions!
          .flatMap(q => q.answers)
          .find(a => a.id === answer.answerId);
        return ans?.questionId === questionId;
      })
      .map(a => a.answerId);

    const question = this.questions.find(q => q.id === questionId)!;
    const correctAnswers = question.answers
      .filter(a => a.isCorrect)
      .map(a => a.id);

    if (question.answerType === AnswerType.Single) {
      return correctAnswers.some(ca => userAnswers.includes(ca));
    }

    return correctAnswers.length === userAnswers.length &&
      correctAnswers.every(ca => userAnswers.includes(ca)) &&
      userAnswers.every(ua => correctAnswers.includes(ua));
  }

  isTestCompleted(): boolean {
    return this.questions?.every(q => this.isQuestionAnswered(q.id)) ?? false;
  }

  onStepChange(event: StepperSelectionEvent): void {
    if (!this.questions) return;

    // Разрешаем переход на любой вопрос, если тест не завершен
    if (!this.isTestEnded) {
      this.selectedStepIndex = event.selectedIndex;
    }
  }

  selectAnswer(answerId: number, questionId: string, isChecked: boolean): void {
    const question = this.questions!.find(q => q.id === questionId)!;

    if (question.answerType === AnswerType.Single) {
      this.selectedAnswers = this.selectedAnswers
        .filter(a => a.questionId !== questionId);
    }

    if (isChecked) {
      this.selectedAnswers.push({answerId, questionId});
    } else {
      this.selectedAnswers = this.selectedAnswers
        .filter(a => !(a.answerId === answerId && a.questionId === questionId));
    }
  }

  // Добавим метод для проверки валидности текущего шага
  isCurrentStepValid(): boolean {
    // Проверяем наличие вопросов и корректность индекса
    if (!this.questions ||
      this.questions.length === 0 ||
      this.selectedStepIndex < 0 ||
      this.selectedStepIndex >= this.questions.length) {
      return false;
    }

    const currentQuestion = this.questions[this.selectedStepIndex];

    // Дополнительная проверка на существование вопроса
    if (!currentQuestion?.id) {
      return false;
    }

    const hasSelected = this.selectedAnswers.some(a => a.questionId === currentQuestion.id);
    return hasSelected || this.isQuestionAnswered(currentQuestion.id);
  }

  private loadUserAnswers(): void {
    const lessonId = this.questions![0].lessonId;
    this.questions!.forEach(q => this.loadingQuestions.add(q.id));

    this.answersService.getUserAnswersByLesson(lessonId, this.userId).subscribe({
      next: answers => {
        this.userAnswers = answers;
        this.calculateProgress();
        this.isTestEnded = this.isTestCompleted();

        // Важно: Обновляем шаг после получения ответов
        this.questions!.forEach(q => this.loadingQuestions.delete(q.id));
        this.updateSelectedStep();
      },
      error: err => {
        this.logService.errorWithData('Ошибка загрузки ответов:', err);
        this.questions!.forEach(q => this.loadingQuestions.delete(q.id));
      }
    });
  }

  private updateSelectedStep(): void {
    if (!this.questions) return;

    if (this.isTestCompleted()) {
      this.selectedStepIndex = this.questions.length;
      this.isTestEnded = true;
    } else {
      const firstUnanswered = this.questions.findIndex(q => !this.isQuestionAnswered(q.id));
      this.selectedStepIndex = firstUnanswered !== -1 ? firstUnanswered : 0;
    }

    // 🛠 Принудительно обновим индекс Stepper после вычислений
    if (this.stepper) {
      setTimeout(() => {
        this.stepper.selectedIndex = this.selectedStepIndex;
      });
    }
  }

  private calculateProgress(): void {
    this.correctAnswersCount = this.questions!.filter(q => this.isAnswerCorrect(q.id)).length;
  }
}
