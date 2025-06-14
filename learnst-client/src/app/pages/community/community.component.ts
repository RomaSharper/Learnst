import {Component, inject, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatAutocompleteModule, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {NoDownloadingDirective} from '../../../angular/directives/no-downloading.directive';
import {PlaceholderImageDirective} from '../../../angular/directives/placeholder-image.directive';
import {MediumScreenSupport} from '../../../data/helpers/MediumScreenSupport';
import {RoleHelper} from '../../../data/helpers/RoleHelper';
import {User} from '../../../data/models/User';
import {UsersService} from '../../../data/services/users.service';
import {Role} from '../../../data/enums/Role';
import {AlertService} from '../../../data/services/alert.service';
import {AuthService} from '../../../data/services/auth.service';
import {NgClass} from '@angular/common';
import {StatusHelper} from '../../../data/helpers/StatusHelper';
import {Status} from '../../../data/enums/Status';
import {LogService} from '../../../data/services/log.service';

@Component({
  selector: 'app-community',
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.scss'],
  imports: [
    NgClass,
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
    NoDownloadingDirective,
    MatProgressSpinnerModule,
    PlaceholderImageDirective
  ],
})
export class CommunityComponent extends MediumScreenSupport implements OnInit {
  users: User[] = [];
  tags: string[] = [];
  pageSize = 20;
  hintUsers: User[] = [];
  loading = true;
  searchInput = '';
  searchQuery = '';
  currentPage = 0;
  displayedUsers: User[] = [];
  currentUser: User | null = null;
  pageSizeOptions = [20, 50, 100];
  protected readonly Role = Role;
  protected readonly Status = Status;
  protected readonly RoleHelper = RoleHelper;
  protected readonly StatusHelper = StatusHelper;
  private router = inject(Router);
  private logService = inject(LogService);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private usersService = inject(UsersService);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.authService.getUser().subscribe(user => this.currentUser = user);
      this.searchQuery = params['search_query'] || '';
      this.tags = params['tags'] ? params['tags'].split(',').map((tag: string) => tag.trim()) : [];

      // Формируем searchInput без лишних пробелов
      this.searchInput = [
        this.searchQuery,
        ...this.tags.map(t => `#${t}`)
      ].join(' ').trim();

      this.loadUsers();
    });
  }

  displayFn(user: string): string {
    return user || '';
  }

  onInputChange(): void {
    if (this.searchInput.trim() === '')
      this.hintUsers = [];
    else
      this.hintUsers = this.users.filter(user =>
        user.username.toLowerCase().includes(this.searchInput.toLowerCase())
      );
  }

  onSearch(): void {
    this.parseSearchInput();
    this.updateUrl();
    this.filterUsers();
  }

  onSelected(event: MatAutocompleteSelectedEvent): void {
    this.searchInput = event.option.value || '';
    this.filterUsers();
    event.option.deselect();
  }

  // Загрузка пользователей
  loadUsers(): void {
    this.loading = true; // Начало загрузки
    this.usersService.getUsers().subscribe(data => {
      this.users = data;
      this.hintUsers = []; // Инициализация подсказок
      this.filterUsers();
      this.loading = false; // Завершение загрузки
    });
  }

  // Фильтрация пользователей для отображения в списке
  filterUsers(): void {
    this.loading = true;
    this.currentPage = 0;

    const searchQueryNormalized = this.searchQuery.trim().toLowerCase();

    // Разделяем теги на категории
    const roleTags: string[] = [];
    const statusTags: string[] = [];
    const adminTags = ['a', 'admin', 'а', 'админ', 'администратор'];
    const backupTags = ['b', 'back', 'support', 'п', 'поддержка'];
    const specialistTags = ['s', 'spec', 'specialist', 'с', 'спец', 'специалист'];
    const userTags = ['u', 'usr', 'user', 'ю', 'юзер', 'пользователь'];

    this.tags.forEach(tag => {
      const normalizedTag = tag.toLowerCase();

      // Определяем принадлежность к ролям
      const isRoleTag = [
        ...adminTags,
        ...specialistTags,
        ...backupTags,
        ...userTags
      ].includes(normalizedTag);

      // Определяем принадлежность к статусам
      const isStatusTag = [
        'here',
        'act', 'active',
        'off', 'offline'
      ].includes(normalizedTag);

      if (isRoleTag) roleTags.push(normalizedTag);
      if (isStatusTag) statusTags.push(normalizedTag);
    });

    this.hintUsers = this.users.filter(user => {
      const matchesSearchQuery = searchQueryNormalized === '' ||
        user.username.toLowerCase().includes(searchQueryNormalized);

      // Проверяем ролевые теги (хотя бы один должен совпасть)
      const matchesRoleTags = roleTags.length === 0 ||
        roleTags.some(tag => {
          if (adminTags.includes(tag))
            return user.role === Role.Admin;
          else if (specialistTags.includes(tag))
            return user.role === Role.Specialist;
          else if (backupTags.includes(tag))
            return user.role === Role.Backup;
          else if (userTags.includes(tag))
            return user.role === Role.User;
          return false;
        });

      // Проверяем статусные теги (хотя бы один должен совпасть)
      const matchesStatusTags = statusTags.length === 0 ||
        statusTags.some(tag => {
          if (tag === 'here')
            return user.status === Status.Online;
          else if (['act', 'active'].includes(tag))
            return user.status === Status.Activity;
          else if (['off', 'offline'].includes(tag))
            return user.status === Status.Offline;
          return false;
        });

      return matchesSearchQuery && matchesRoleTags && matchesStatusTags;
    });

    this.updateDisplayedUsers();
    this.loading = false;
  }

  // Разбор ввода пользователя на searchQuery и теги
  parseSearchInput(): void {
    // Разделяем ввод на части, игнорируя пустые теги
    const parts = this.searchInput.split('#').map(p => p.trim());
    this.searchQuery = parts[0]; // Первая часть - текст запроса
    this.tags = parts.slice(1).filter(tag => tag.length > 0); // Остальные - непустые теги
  }

  // Обновление URL с новыми параметрами
  updateUrl(): void {
    const queryParams: any = {};

    // Добавляем search_query, только если он не пустой
    if (this.searchQuery) {
      queryParams.search_query = this.searchQuery;
    } else {
      queryParams.search_query = null; // Удаляем search_query из URL, если он пустой
    }

    // Добавляем теги, только если они есть
    if (this.tags.length > 0) {
      queryParams.tags = this.tags.join(','); // Теги уже в URL-формате
    } else {
      queryParams.tags = null; // Удаляем теги из URL, если их нет
    }

    // Обновляем URL с новыми параметрами
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge', // Объединяем с существующими параметрами
    });
  }

  updateDisplayedUsers(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedUsers = this.hintUsers.slice(startIndex, endIndex);
    this.loading = false; // Завершение загрузки
  }

  onPageChange(event: any): void {
    this.loading = true; // Начало загрузки
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedUsers();
    this.loading = false; // Завершение загрузки
  }

  // Повышение роли пользователя
  upRole(user: User): void {
    let newRole: Role;

    switch (user.role) {
      case Role.User:
        newRole = Role.Backup;
        break;
      case Role.Backup:
        newRole = Role.Specialist;
        break;
      default:
        return; // Если роль уже Admin или Specialist, ничего не делаем
    }

    this.alertService.openConfirmDialog(
      AlertService.CONFIRM_TITLE,
      `Вы уверены, что хотите повысить пользователя ${user.username} до роли "${RoleHelper.getName(newRole)}"?`
    ).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.usersService.updateUserRole({
        adminId: this.currentUser?.id!,
        userId: user.id!,
        role: newRole
      }).subscribe(response => {
        if (!response.succeed) {
          this.alertService.showSnackBar('Произошла ошибка при обновлении роли пользователя');
          this.logService.errorWithData(response.message);
          return;
        }
        user.role = newRole;
        this.alertService.showSnackBar(`Вы успешно повысили пользователя ${user.username} до роли "${RoleHelper.getName(newRole)}"`);
      });
    });
  }

  // Понижение роли пользователя
  downRole(user: User): void {
    let newRole: Role;

    switch (user.role) {
      case Role.Admin:
        newRole = Role.Specialist;
        break;
      case Role.Specialist:
        newRole = Role.Backup;
        break;
      case Role.Backup:
        newRole = Role.User;
        break;
      default:
        return; // Если роль уже User, ничего не делаем
    }

    this.alertService.openConfirmDialog(
      AlertService.CONFIRM_TITLE,
      `Вы уверены, что хотите понизить пользователя ${user.username} до роли "${RoleHelper.getName(newRole)}"?`
    ).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.usersService.updateUserRole({
        adminId: this.currentUser?.id!,
        userId: user.id!,
        role: newRole
      }).subscribe(response => {
        if (!response.succeed) {
          this.alertService.showSnackBar('Произошла ошибка при обновлении роли пользователя');
          this.logService.errorWithData(response.message);
          return;
        }
        user.role = newRole;
        this.alertService.showSnackBar(`Вы успешно понизили пользователя ${user.username} до роли "${RoleHelper.getName(newRole)}"`);
      });
    });
  }

  deleteUser(user: User): void {
    this.alertService.openConfirmDialog(
      AlertService.CONFIRM_TITLE,
      `Вы уверены, что хотите удалить пользователя с ником ${user.username}?`
    ).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.usersService.deleteUser(user.id!).subscribe({
        next: () => {
          this.alertService.showSnackBar(`Вы успешно удалили пользователя ${user.username}`);
          this.loadUsers();
        },
        error: err => {
          // Обработка ошибки
          if (err.status === 404) {
            this.alertService.showSnackBar('Пользователь не найден');
            return;
          }

          this.alertService.showSnackBar(`Произошла непредвиденная ошибка, повторите попытку позже`);
          this.logService.errorWithData(err);
        }
      });
    });
  }
}
