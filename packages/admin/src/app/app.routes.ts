import { Route } from '@angular/router';
import { authGuard, guestGuard } from './auth/auth.guard';
import { AdminShellComponent } from './layout/admin-shell.component';

export const appRoutes: Route[] = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    component: AdminShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/products/products-list.component').then(m => m.ProductsListComponent),
      },
      {
        path: 'products/new',
        loadComponent: () => import('./pages/products/product-edit.component').then(m => m.ProductEditComponent),
      },
      {
        path: 'products/:id',
        loadComponent: () => import('./pages/products/product-edit.component').then(m => m.ProductEditComponent),
      },
      {
        path: 'categories',
        loadComponent: () => import('./pages/categories/categories-list.component').then(m => m.CategoriesListComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
