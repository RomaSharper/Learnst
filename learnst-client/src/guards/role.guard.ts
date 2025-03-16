import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, Observable, tap } from 'rxjs';
import { Role } from '../enums/Role';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) { }

  canActivate(next: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean> {
    const role: Role = next.data.role;
    const roles: Role[] = next.data.roles;

    // Проверка на наличие либо role, либо roles
    if (!role && (!roles || roles.length === 0)) {
        throw new Error("Either 'role' or 'roles' must be passed to this route.");
    }

    return this.authService.getUser().pipe(
      tap(user => {
        // Если определена роль и не совпадает с пользователем
        if (role && user?.role !== role)
            this.router.navigate(['/']).then();
        // Если роли являются массивом и ни одна из них не совпадает с пользователем
        else if (roles && roles.length > 0 && !roles.includes(user?.role!))
            this.router.navigate(['/']).then();
      }),
      map(user => {
        // Проверяем соответствие роли или одной из ролей
        return (role && user?.role === role) || (roles && roles.includes(user?.role!));
      })
    );
  }
}
