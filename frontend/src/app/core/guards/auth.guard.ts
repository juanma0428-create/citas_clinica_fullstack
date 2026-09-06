import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const roleGuard: CanActivateFn = (route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const allowedRoles = route.data?.['roles'] as number[] | undefined;
  const currentRole = authService.userRole();

  if (allowedRoles && currentRole !== null && !allowedRoles.includes(currentRole)) {
    // Redirigir a su propio portal según su rol
    authService.redirectAfterLogin(currentRole);
    return false;
  }

  return true;
};
