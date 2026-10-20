import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.mustChangePassword()) {
    return router.createUrlTree(['/change-password']);
  }

  if (authService.isLoggedIn() && authService.getRole() === 'ADMIN') {
    return true;
  }

  return router.createUrlTree(['/login']);
};
