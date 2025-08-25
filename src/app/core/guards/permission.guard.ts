import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../services/auth.service';

export const permissionGuard = (permission: string): CanActivateFn => {
  return (route, state) => {
    const router = inject(Router);
    const authService = inject(AuthService);

    if (!authService.hasPermission(permission)()) {
      router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  };
};
