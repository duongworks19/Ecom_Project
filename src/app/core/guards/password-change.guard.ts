import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const passwordChangeGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.mustChangePassword() && !state.url.startsWith('/change-password')) {
    return router.createUrlTree(['/change-password']);
  }
  return true;
};
