import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {AuthService} from '../../data/services/auth.service';
import {map, Observable, tap} from 'rxjs';
import {Role} from '../../data/enums/Role';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  private router = inject(Router);
  private authService = inject(AuthService);

  canActivate(next: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean> {
    const role: Role = next.data.role;
    const roles: Role[] = next.data.roles;

    // Проверка на наличие либо role, либо roles
    if (!role && !roles?.length)
      throw new Error('Свойство "role" или "roles" должно быть передано по этому пути');

    return this.authService.getUser().pipe(
      tap(user => {
        if (role && user?.role !== role // Если определена роль и не совпадает с пользователем
          || roles?.length && !roles.includes(user?.role!)) // Если роли являются массивом и ни одна из них не совпадает с пользователем
          this.router.navigate(['/']).then();
      }),
      map(user =>
        // Проверяем соответствие роли или одной из ролей
        (role && user?.role === role) || (roles && roles.includes(user?.role!))
      )
    );
  }
}
