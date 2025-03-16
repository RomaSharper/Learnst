import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LessonTypeHelper } from '../../../helpers/LessonTypeHelper';
import { Topic } from '../../../models/Topic';
import { ValidationService } from '../../../services/validation.service';
import { LessonDialogComponent } from '../lesson.dialog/lesson.dialog.component';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-topic-dialog',
  templateUrl: './topic.dialog.component.html',
  styleUrls: ['./topic.dialog.component.scss'],
  imports: [
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    MatFormFieldModule,
    ReactiveFormsModule
  ]
})
export class TopicDialogComponent {
  topicForm: FormGroup;
  LessonTypeHelper = LessonTypeHelper;

  constructor(
    private fb: FormBuilder,
    private alertService: AlertService,
    public dialogRef: MatDialogRef<TopicDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { topic: any }
  ) {
    this.topicForm = this.fb.group({
      title: [data.topic?.title || '', Validators.required]
    });
  }

  // Метод для добавления урока
  addLesson(topic: Topic): void {
    const dialogRef = this.alertService.getDialog().open(LessonDialogComponent, {
      width: '600px',
      data: { lesson: null, topicId: topic.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result)
        topic.lessons.push({
          ...result, id: ValidationService.emptyGuid
        });
    });
  }

  // Метод для редактирования урока
  // Метод для редактирования урока
  editLesson(topic: Topic, index: number): void {
    const dialogRef = this.alertService.getDialog().open(LessonDialogComponent, {
      width: '600px',
      data: { lesson: topic.lessons[index], topicId: topic.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      // Находим урок по id и обновляем его
      const lessonIndex = topic.lessons.findIndex(lesson => lesson.id === result.id);
      if (lessonIndex === -1) return;
      topic.lessons[lessonIndex] = result;
    });
  }

  // Метод для удаления урока
  removeLesson(topic: Topic, index: number): void {
    const lesson = topic.lessons[index];
    this.alertService.openConfirmDialog(
      'Удаление урока',
      `Вы уверены, что хотите удалить урок "${lesson.title}"?`
    ).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      topic.lessons.splice(index, 1); // Удаляем урок, если пользователь подтвердил
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.topicForm.valid)
      this.dialogRef.close({
        ...this.data.topic,
        title: this.topicForm.value.title,
        lessons: this.data.topic?.lessons || []
      });
  }
}
