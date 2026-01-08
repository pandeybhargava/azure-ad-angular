import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { permissionGuard } from './guards/permission.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  // { 
  //   path: 'admin', 
  //   loadComponent: () => import('./components/admin-panel/admin-panel.component').then(m => m.AdminPanelComponent),
  //   canActivate: [authGuard, permissionGuard],
  //   data: { permission: 'canManageUsers' }
  // },
  { 
    path: 'reports', 
    loadComponent: () => import('./components/reports/reports.component').then(m => m.ReportsComponent),
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'canViewReports' }
  },
  { 
    path: 'unauthorized', 
    loadComponent: () => import('./components/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  { 
    path: '', 
    redirectTo: '/login',  // Changed from /dashboard to /login
    pathMatch: 'full' 
  },
  { 
    path: '**', 
    redirectTo: '/login'   // Changed from /dashboard to /login
  }
];