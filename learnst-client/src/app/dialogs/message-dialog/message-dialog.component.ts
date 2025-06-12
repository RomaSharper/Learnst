import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-message-dialog',
  templateUrl: './message-dialog.component.html',
  imports: [
    MatDialogModule,
    MatButtonModule,
  ]
})
export class MessageDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<MessageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      title: string;
      message: string;
      okText: string;
    }
  ) {
  }

  onOk(): void {
    this.dialogRef.close();
  }
}
