import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Get required permission from route data
  const requiredPermission = route.data?.['permission'] as string;
  const redirectTo = route.data?.['redirectTo'] || '/unauthorized';
  
  // Debug logging
  console.log('🔐 Permission Guard Activated:');
  console.log('  Route:', state.url);
  console.log('  Required Permission:', requiredPermission);
  
  // Check if user has the required permission
  if (requiredPermission && authService.hasPermission(requiredPermission as any)) {
    console.log('✅ Permission granted');
    return true;
  }
  
  console.log('❌ Permission denied - Redirecting to:', redirectTo);
  
  // Store attempted URL for redirect after login
  if (redirectTo !== '/login') {
    const attemptedUrl = state.url;
    console.log('📝 Storing attempted URL:', attemptedUrl);
    localStorage.setItem('redirectAfterLogin', attemptedUrl);
  }
  
  // Redirect to unauthorized page
  router.navigate([redirectTo]);
  return false;
};

// Alternative: Create a function that returns route configuration
export function withPermission(permission: string, redirectTo: string = '/unauthorized') {
  return {
    canActivate: [permissionGuard],
    data: { permission, redirectTo }
  };
}