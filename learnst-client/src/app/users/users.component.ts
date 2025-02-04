import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
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
import { TimeoutHandler } from '../../handlers/TimeoutHandler';
import { RoleHelper } from '../../helpers/RoleHelper';
import { User } from '../../models/User';
import { UsersService } from '../../services/users.service';
import { Role } from './../../enums/Role';
import { AlertService } from './../../services/alert.service';
import { AuthService } from './../../services/auth.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.less'],
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
    NoDownloadingDirective,
    MatProgressSpinnerModule,
    PlaceholderImageDirective
  ],
})
export class UsersComponent implements OnInit {
  pageSize = 20;
  loading = true;
  currentPage = 0;
  searchInput = ''; // Поле для отображения текста и тегов
  searchQuery = ''; // Текст запроса (без тегов)
  users: User[] = [];
  tags: string[] = []; // Теги для фильтрации
  hintUsers: User[] = [];
  displayedUsers: User[] = [];
  currentUser: User | null = null;
  pageSizeOptions = [20, 50, 100];

  Role = Role;
  RoleHelper = RoleHelper;

  constructor(
    private alertService: AlertService,
    private usersService: UsersService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.authService.getUser().subscribe(user => this.currentUser = user);
      this.searchQuery = params['search_query'] || '';
      this.tags = params['tags'] ? params['tags'].split(',').map((tag: string) => tag.trim()) : [];
      this.searchInput = this.searchQuery.trim() + (
        this.searchInput.length && this.tags.length ? ' ' : ''
      ) + (this.tags.length ? '#' : '') + this.tags.join(' #').trim();
      this.loadUsers();
    });
  }

  // Функция для отображения имени пользователя в автозаполнении
  displayFn(user: string): string {
    return user || '';
  }

  // Обновление подсказок при вводе текста
  onInputChange(): void {
    this.hintUsers = this.searchInput.trim() === '' ? [] : this.users.filter(user => user.username.toLowerCase().includes(this.searchInput.toLowerCase()));
  }

  // Поиск при нажатии Enter или клике на иконку
  onSearch(): void {
    this.parseSearchInput(); // Разбираем ввод на текст и теги
    this.updateUrl(); // Обновляем URL
    this.filterUsers(); // Фильтруем пользователей
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
    this.loading = true; // Начало загрузки
    this.currentPage = 0; // Сброс текущей страницы при новом поиске

    // Фильтрация по тексту запроса и тегам
    this.hintUsers = this.users.filter(user => {
      const matchesSearchQuery = this.searchQuery === '' || user.username.toLowerCase().includes(this.searchQuery.toLowerCase());

      // Фильтрация по тегам
      const matchesTags = this.tags.length === 0 || this.tags.some(tag => {
        const normalizedTag = tag.toLowerCase();
        if (['a', 'admin', 'а', 'админ', 'администратор'].includes(normalizedTag))
          return user.role === Role.Admin;
        else if (['s', 'spec', 'specialist', 'с', 'спец', 'специалист'].includes(normalizedTag))
          return user.role === Role.Specialist;
        else if (['b', 'back', 'backup', 'п', 'поддержка'].includes(normalizedTag))
          return user.role === Role.Backup;
        else if (['u', 'usr', 'user', 'п', 'пользователь'].includes(normalizedTag))
          return user.role === Role.User;
        return false;
      });

      return matchesSearchQuery && matchesTags;
    });

    this.updateDisplayedUsers();
    this.loading = false; // Завершение загрузки
  }

  // Разбор ввода пользователя на searchQuery и теги
  parseSearchInput(): void {
    const parts = this.searchInput.split('#');
    this.searchQuery = parts[0].trim(); // Текст до первого #
    this.tags = parts.slice(1).map(tag => tag.trim()); // Теги
  }

  // Обновление URL с новыми параметрами
  updateUrl(): void {
    const queryParams: any = {};

    // Добавляем search_query, только если он не пустой
    if (this.searchQuery)
      queryParams.search_query = this.searchQuery;
    else
      queryParams.search_query = null; // Удаляем search_query из URL, если он пустой

    // Добавляем теги, только если они есть
    if (this.tags.length > 0)
      queryParams.tags = this.tags.join(','); // Теги уже в URL-формате
    else
      queryParams.tags = null; // Удаляем теги из URL, если их нет

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
          console.error(response.message);
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
          console.error(response.message);
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
      this.usersService.deleteUser(user.id!).pipe(
        TimeoutHandler.retryOnCodes([500, 504])
      ).subscribe({
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
          console.error(err);
        }
      });
    });
  }
}
