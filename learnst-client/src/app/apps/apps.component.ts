import { AuthService } from './../../services/auth.service';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NoDownloadingDirective } from '../../directives/NoDownloadingDirective';
import { PlaceholderImageDirective } from '../../directives/PlaceholderImageDirective';
import { Return } from '../../helpers/Return';
import { Application } from '../../models/ClientApplication';
import { AlertService } from '../../services/alert.service';
import { AppsService } from './../../services/apps.service';

@Return()
@Component({
  selector: 'app-apps',
  templateUrl: './apps.component.html',
  styleUrls: ['./apps.component.less'],
  imports: [
    RouterLink,
    FormsModule,
    MatIconModule,
    MatMenuModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatAutocompleteModule,
    // NoDownloadingDirective,
    MatProgressSpinnerModule,
    // PlaceholderImageDirective
  ],
})
export class AppsComponent implements OnInit {
  pageSize = 20;
  loading = true;
  userId!: string;
  currentPage = 0;
  goBack!: () => void;
  apps: Application[] = [];
  pageSizeOptions = [20, 50, 100];
  displayedApps: Application[] = [];

  constructor(
    private alertService: AlertService,
    private authService: AuthService,
    private appsService: AppsService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authService.getUser().subscribe(user => {
      this.userId = user?.id!;
      this.loadApps();
    });
  }

  loadApps(): void {
    this.loading = true; // Начало загрузки
    this.appsService.getApplications(this.userId).subscribe(data => {
      this.apps = data;
      this.loading = false; // Завершение загрузки
    });
  }

  updateDisplayedApps(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedApps = this.apps.slice(startIndex, endIndex);
    this.loading = false; // Завершение загрузки
  }

  onPageChange(event: any): void {
    this.loading = true; // Начало загрузки
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedApps();
    this.loading = false; // Завершение загрузки
  }

  deleteApp(appId: string): void {
    this.alertService.openConfirmDialog(
      AlertService.CONFIRM_TITLE,
      'Вы уверены, что хотите удалить это приложение?'
    ).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.appsService.deleteApp(appId);
    })
  }
}
