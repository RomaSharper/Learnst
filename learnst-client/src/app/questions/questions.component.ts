import {MatStepper, MatStepperModule} from '@angular/material/stepper';
import {Component, inject, Input, OnInit, ViewChild} from '@angular/core';
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
export class QuestionsComponent implements OnInit {
  private authService = inject(AuthService);
  private answersService = inject(AnswersService);

  userId!: string;
  isTestEnded = false;
  selectedStepIndex = 0;
  correctAnswersCount = 0;
  AnswerType = AnswerType;
  userAnswers: UserAnswer[] = [];
  @Input() questions?: Question[];
  loadingQuestions: Set<string> = new Set();
  @ViewChild("stepper") stepper!: MatStepper;
  selectedAnswers: { answerId: number, questionId: string }[] = [];

  ngOnInit(): void {
    this.authService.getUser().subscribe(user => {
      this.userId = user?.id!;
      if (this.questions)
        this.loadUserAnswers();
      else
        console.warn('Вопросы не загружены.');
    });
  }

  async moveToNextUnanswered(): Promise<void> {
    if (this.isTestEnded || !this.questions) return;

    // Сохраняем текущие ответы перед переходом
    await this.submitAnswers();

    const nextUnanswered = this.questions.findIndex(
      (q, index) => index > this.selectedStepIndex && !this.isQuestionAnswered(q.id)
    );

    if (nextUnanswered === -1) {
      if (this.isTestCompleted()) {
        this.selectedStepIndex = this.questions.length;
        this.isTestEnded = true;
      } else {
        this.updateSelectedStep();
      }
      return;
    }
    this.selectedStepIndex = nextUnanswered;
  }

  isLastQuestion(): boolean {
    return this.selectedStepIndex === this.questions!.length - 1;
  }

  isLoading(questionId: string): boolean {
    return this.loadingQuestions.has(questionId);
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
      this.updateSelectedStep();

      if (this.isTestEnded) {
        this.selectedStepIndex = this.questions!.length;
      }
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      // Можно добавить обработку ошибки для пользователя
    }
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
    if (!this.questions || this.questions.length === 0)
      return false;

    // Проверяем, ответил ли пользователь на все вопросы
    return this.questions.every(question => this.isQuestionAnswered(question.id));
  }

  onStepChange(event: StepperSelectionEvent): void {
    if (!this.questions) return;

    if (this.isTestEnded) {
      this.selectedStepIndex = this.questions.length;
      return;
    }

    const targetStep = event.selectedIndex;
    if (targetStep < this.questions.length) {
      const targetQuestion = this.questions[targetStep];
      if (this.isQuestionAnswered(targetQuestion.id))
        this.selectedStepIndex = targetStep;
      else
        this.updateSelectedStep();
    }
  }

  selectAnswer(answerId: number, questionId: string, isChecked: boolean): void {
    const question = this.questions!.find(q => q.id === questionId)!;

    if (question.answerType === AnswerType.Single) {
      this.selectedAnswers = this.selectedAnswers
        .filter(a => a.questionId !== questionId);
    }

    if (isChecked) {
      this.selectedAnswers.push({ answerId, questionId });
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

  async handleNextOrComplete(): Promise<void> {
    await this.submitAnswers();
    this.stepper.next();

    if (this.isLastQuestion() && this.isTestCompleted()) {
      this.isTestEnded = true;
    } else {
      await this.moveToNextUnanswered();
    }
  }

  private loadUserAnswers(): void {
    const lessonId = this.questions![0].lessonId;
    this.questions!.forEach(q => this.loadingQuestions.add(q.id));

    this.answersService.getUserAnswersByLesson(lessonId, this.userId).subscribe({
      next: (answers) => {
        this.userAnswers = answers;
        this.calculateProgress();
        this.updateSelectedStep(true);
        this.isTestEnded = this.isTestCompleted();
        this.questions!.forEach(q => this.loadingQuestions.delete(q.id));
      },
      error: (err) => {
        console.error('Ошибка загрузки ответов:', err);
        this.questions!.forEach(q => this.loadingQuestions.delete(q.id));
      }
    });
  }

  private calculateProgress(): void {
    this.correctAnswersCount = this.questions!.filter(q =>
      this.isAnswerCorrect(q.id)
    ).length;
  }

  private updateSelectedStep(initialLoad: boolean = false): void {
    if (!this.questions) return;

    if (this.isTestEnded) {
      this.selectedStepIndex = this.questions.length;
      return;
    }

    const firstUnanswered = this.questions!.findIndex(
      q => !this.isQuestionAnswered(q.id)
    );

    if (firstUnanswered === -1) {
      this.selectedStepIndex = this.questions.length - 1;
      return;
    }

    this.selectedStepIndex = firstUnanswered;
    if (initialLoad) {
      setTimeout(() => this.selectedStepIndex = firstUnanswered);
    }
  }
}
