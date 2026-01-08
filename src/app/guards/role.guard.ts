import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: string[]) => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    if (authService.hasAnyRole(allowedRoles)) {
      return true;
    }
    
    // Redirect to unauthorized page or dashboard
    router.navigate(['/unauthorized']);
    return false;
  };
};

export const permissionGuard = (requiredPermission: string) => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    if (authService.hasPermission(requiredPermission as any)) {
      return true;
    }
    
    router.navigate(['/unauthorized']);
    return false;
  };
};