import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {AuthService} from '../../data/services/auth.service';
import {map, Observable, tap} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private router = inject(Router);
  private authService = inject(AuthService);

  canActivate(next: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean> {
    const auth: boolean = next.data.auth ?? true;
    return this.authService.isUserAuthorized().pipe(
      tap(isUserAuthorized => {
        if (isUserAuthorized != auth)
          this.router.navigate([auth ? '/login' : '/']).then();
      }),
      map(isUserAuthorized => isUserAuthorized == auth)
    );
  }
}
