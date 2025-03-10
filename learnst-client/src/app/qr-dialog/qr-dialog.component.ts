import { QRCodeComponent } from 'angularx-qrcode';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-qr-dialog',
  template: `
    <h2 mat-dialog-title>Оплата через QR-код</h2>
    <mat-dialog-content class="qr-content">
      <qrcode [qrdata]="data.url" [width]="256" [errorCorrectionLevel]="'M'"></qrcode>
      <p>Просканируйте QR-код мобильным приложением банка</p>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button mat-dialog-close>Закрыть</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .qr-content {
      text-align: center;
      padding: 20px;
    }
  `],
  imports: [
    QRCodeComponent,
    MatDialogModule,
    MatButtonModule
  ]
})
export class QrDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { url: string },
    public dialogRef: MatDialogRef<QrDialogComponent>
  ) {}
}
