import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from '../services/auth.service';
import {inject} from '@angular/core';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (!authService.isAdmin() && !authService.isSuperAdmin()) {
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};
