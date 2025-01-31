import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) { }

  canActivate(next: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean> {
    const auth: boolean = next.data.auth ?? true;
    return this.authService.isUserAuthorized().pipe(
      tap(isUserAuthorized => {
        if (isUserAuthorized != auth)
          this.router.navigate([auth ? '/login' : '/']);
      }),
      map(isUserAuthorized => isUserAuthorized == auth)
    );
  }
}
