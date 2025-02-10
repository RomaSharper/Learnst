import { AlertService } from './../../../services/alert.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Application } from '../../../models/Application';
import { AppsService } from '../../../services/apps.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MediumScreenSupport } from '../../../helpers/MediumScreenSupport';
import { CommonModule, Location } from '@angular/common';
import { Return } from '../../../helpers/Return';

@Return()
@Component({
  selector: 'app-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
  imports: [CommonModule, MatCardModule, MatInputModule, MatButtonModule, MatFormFieldModule, ReactiveFormsModule]
})
export class DevAppComponent extends MediumScreenSupport implements OnInit {
  isLoading = false;
  isEditing = false;
  appForm: FormGroup;
  goBack!: () => void;
  clientId: string | null = null;
  app: Application | null = null;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    public location: Location,
    public route: ActivatedRoute,
    private appsService: AppsService,
    private alertService: AlertService
  ) {
    super();
    this.appForm = this.fb.group({
      clientId: [{ value: '', disabled: true }],
      clientSecret: [{ value: '', disabled: true }],
      name: ['', Validators.required],
      redirectUri: ['', Validators.required],
      allowedScopes: ['', Validators.required],
      createdAt: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('clientId');
    if (this.clientId) {
      this.loadApp();
      return;
    }
    this.alertService.showSnackBar('Не был передан ClientID');
    this.router.navigate(['/apps']);
  }

  loadApp(): void {
    this.isLoading = true;
    this.appsService.getApplication(this.clientId!).subscribe({
      next: (app: Application) => {
        this.app = app;
        this.appForm.patchValue({
          clientId: app.clientId,
          clientSecret: app.clientSecret,
          name: app.name,
          redirectUri: app.redirectUri,
          allowedScopes: app.allowedScopes.join(' '),
          createdAt: app.createdAt
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
        this.alertService.showSnackBar(error?.error?.message || 'Не удалось найти приложение с таким ClientID');
        this.router.navigate(['/apps']);
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
  }

  onSubmit(): void {
    if (this.appForm.invalid)
      return;

    const updatedApp = {
      ...this.appForm.value,
      clientId: this.clientId,
      allowedScopes: this.appForm.value.allowedScopes.split(' ')
    };
    console.log(updatedApp);

    this.appsService.putApp(this.clientId!, updatedApp).subscribe({
      next: (response: Application) => {
        this.app = response;
        this.isEditing = false;
        this.alertService.showSnackBar('Приложение обновлено успешно');
      },
      error: (error) => {
        const message = error?.error?.message || 'Не удалось обновить приложение';
        this.alertService.showSnackBar(message);
        console.error(error);
      }
    });
  }

  deleteApp(): void {
    if (!this.clientId)
      return;

    this.appsService.deleteApp(this.clientId).subscribe({
      next: () => {
        this.router.navigate(['/apps']);
        this.alertService.showSnackBar('Приложение удалено успешно');
      },
      error: (error) => {
        const message = error?.error?.message || 'Не удалось удалить приложение';
        this.alertService.showSnackBar(message);
        console.error(error);
      }
    });
  }
}
