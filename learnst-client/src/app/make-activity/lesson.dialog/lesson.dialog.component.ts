import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AnswerTypeHelper } from '../../../helpers/AnswerTypeHelper';
import { LessonTypeHelper } from '../../../helpers/LessonTypeHelper';
import { Answer } from '../../../models/Answer';
import { Question } from '../../../models/Question';
import { AlertService } from '../../../services/alert.service';
import { FileService } from '../../../services/file.service';
import { ValidationService } from '../../../services/validation.service';
import { AnswerType } from './../../../enums/AnswerType';
import { LessonType } from './../../../enums/LessonType';
import { format } from 'date-fns';

@Component({
  selector: 'app-lesson-dialog',
  templateUrl: './lesson.dialog.component.html',
  styleUrls: ['./lesson.dialog.component.less'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule
  ]
})
export class LessonDialogComponent {
  oldFileUrl?: string;
  selectedFile?: File;
  lessonForm: FormGroup;
  answerTypes = AnswerTypeHelper.getAnswerTypes();
  lessonTypes = LessonTypeHelper.getLessonTypes();

  AnswerType = AnswerType;
  LessonType = LessonType;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<LessonDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { lesson: any },
    private alertService: AlertService,
    private fileService: FileService
  ) {
    this.lessonForm = this.fb.group({
      title: [data.lesson?.title || '', Validators.required],
      lessonType: [data.lesson?.lessonType || LessonType.LongRead, Validators.required],
      longReadUrl: [data.lesson?.longReadUrl || ''],
      videoUrl: [data.lesson?.videoUrl || ''],
      questions: this.fb.array(data.lesson?.questions?.map((q: Question) => this.createQuestionGroup(q)) || [])
    });

    // Сохраняем старый URL файла (если редактируем)
    if (data.lesson) {
      this.oldFileUrl = data.lesson.longReadUrl || data.lesson.videoUrl;
    }

    // Отслеживаем изменение типа урока
    this.lessonForm.get('lessonType')?.valueChanges.subscribe((value: LessonType) => {
      this.updateFormValidation(value);
    });
  }

  // Создание группы для вопроса
  createQuestionGroup(question?: Question): FormGroup {
    const questionGroup = this.fb.group({
      id: [question?.id || ValidationService.emptyGuid], // Guid
      text: [question?.text || '', Validators.required],
      answerType: [question?.answerType || AnswerType.Single, Validators.required],
      answers: this.fb.array(question?.answers?.map(a => this.createAnswerGroup(a)) || []),
    });

    // Подписка на изменение типа ответа
    questionGroup.get('answerType')?.valueChanges.subscribe(answerType => {
      if (answerType === AnswerType.Single) {
        const answers = questionGroup.get('answers') as FormArray;
        const firstCorrectIndex = answers.controls.findIndex(answer => answer.get('isCorrect')?.value);

        // Если есть хотя бы один правильный ответ, оставляем его, остальные делаем неправильными
        if (firstCorrectIndex === -1) return;
        answers.controls.forEach((answer, index) => {
          if (index !== firstCorrectIndex)
            answer.get('isCorrect')?.setValue(false, { emitEvent: false });
        });
      }
    });

    return questionGroup;
  }

  // Создание группы для ответа
  createAnswerGroup(answer?: Answer): FormGroup {
    return this.fb.group({
      id: [answer?.id || 0],
      text: [answer?.text || '', Validators.required],
      isCorrect: [answer?.isCorrect || false],
      questionId: [answer?.questionId || ''], // Guid
    });
  }

  // Обработка выбора правильного ответа
  onCorrectAnswerChange(question: AbstractControl, answerIndex: number): void {
    const answerType = question.get('answerType')?.value;
    const answers = question.get('answers') as FormArray;

    if (answerType === AnswerType.Single) {
      // Если тип ответа Single, оставляем только один правильный ответ
      answers.controls.forEach((answer, index) => {
        if (index !== answerIndex) {
          answer.get('isCorrect')?.setValue(false, { emitEvent: false });
        }
      });
    }
  }

  // Получение массива вопросов
  get questions(): FormArray {
    return this.lessonForm.get('questions') as FormArray;
  }

  // Добавление вопроса
  addQuestion(): void {
    this.questions.push(this.createQuestionGroup());
  }

  // Удаление вопроса
  removeQuestion(index: number): void {
    this.questions.removeAt(index);
  }

  // Получение массива ответов для вопроса
  getAnswers(question: AbstractControl): FormArray {
    return question.get('answers') as FormArray;
  }

  // Добавление ответа
  addAnswer(question: AbstractControl): void {
    const questionGroup = question as FormGroup;
    const answers = questionGroup.get('answers') as FormArray;

    if (!answers) {
      console.error('FormArray "answers" не найден в вопросе.');
      return;
    }

    const newAnswerGroup = this.createAnswerGroup();

    // Установите идентификатор вопроса
    newAnswerGroup.get('questionId')?.setValue(questionGroup.get('id')?.value);

    answers.push(newAnswerGroup);
  }

  // Удаление ответа
  removeAnswer(question: AbstractControl, index: number): void {
    this.getAnswers(question).removeAt(index);
  }

  // Открытие файлового диалога
  openFilePicker(fileType: 'md' | 'mp4'): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = fileType === 'md' ? '.md' : '.mp4';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (!file) return;
      this.selectedFile = file;
      const controlName = fileType === 'md' ? 'longReadUrl' : 'videoUrl';
      this.lessonForm.get(controlName)?.setValue(file.name);
    };
    input.click();
  }

  // Обновление валидации в зависимости от типа урока
  updateFormValidation(lessonType: LessonType): void {
    if (lessonType === LessonType.LongRead) {
      this.lessonForm.get('longReadUrl')?.setValidators(Validators.required);
      this.lessonForm.get('videoUrl')?.clearValidators();
    } else if (lessonType === LessonType.Video) {
      this.lessonForm.get('videoUrl')?.setValidators(Validators.required);
      this.lessonForm.get('longReadUrl')?.clearValidators();
    } else if (lessonType === LessonType.Test) {
      this.lessonForm.get('longReadUrl')?.clearValidators();
      this.lessonForm.get('videoUrl')?.clearValidators();
    }

    this.lessonForm.get('longReadUrl')?.updateValueAndValidity();
    this.lessonForm.get('videoUrl')?.updateValueAndValidity();
  }

  // Сохранение урока
  onSave(): void {
    if (this.lessonForm.invalid) {
      return;
    }

    // Если выбран новый файл, загружаем его
    if (this.selectedFile) {
      this.fileService.upload(this.selectedFile).pipe(
        catchError(err => {
          console.error('Не удалось загрузить файл:', err);
          return of(null);
        })
      ).subscribe({
        next: (response) => {
          if (response) {
            // Удаляем старый файл (если он есть)
            if (this.oldFileUrl)
              this.fileService.delete(this.oldFileUrl).subscribe();

            // Обновляем URL файла в форме
            const fileUrl = response.fileUrl; // Предположим, что сервер возвращает URL файла
            if (this.lessonForm.get('lessonType')?.value === LessonType.LongRead)
              this.lessonForm.get('longReadUrl')?.setValue(fileUrl);
            else if (this.lessonForm.get('lessonType')?.value === LessonType.Video)
              this.lessonForm.get('videoUrl')?.setValue(fileUrl);

            // Закрываем диалог и возвращаем данные
            this.dialogRef.close({
              ...this.lessonForm.value,
              id: this.data.lesson?.id || ValidationService.emptyGuid // Сохраняем id, если он есть
            });
          }
        },
        error: (error) => {
          this.alertService.showSnackBar('Произошла ошибка при загрузке файла');
          console.error('Ошибка при загрузке файла:', error);
        }
      });
    } else {
      // Если файл не выбран, просто закрываем диалог
      this.dialogRef.close({
        ...this.lessonForm.value,
        id: this.data.lesson?.id || ValidationService.emptyGuid // Сохраняем id, если он есть
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
