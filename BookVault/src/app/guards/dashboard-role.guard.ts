import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';

export function roleDashboardSegment(role: User['role']): 'reader' | 'author' | 'admin' {
  if (role === 'admin') return 'admin';
  if (role === 'author') return 'author';
  return 'reader';
}

/** Segments du tableau de bord autorisés pour ce rôle JWT. */
export const dashboardRoleGuard = (allowedRoles: User['role'][]): CanActivateFn => {
  return (): boolean | UrlTree => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.getCurrentUser();
    if (!user) {
      return router.parseUrl('/auth/login');
    }
    if (allowedRoles.includes(user.role)) {
      return true;
    }
    const seg = roleDashboardSegment(user.role);
    return router.parseUrl(`/dashboard/${seg}/home`);
  };
};
