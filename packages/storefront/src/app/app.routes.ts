import { Route } from '@angular/router';
import { ShellComponent } from './layout/shell.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
        title: 'e-com-shop — Fine jewelry for every occasion',
      },
      {
        path: 'c/:slug',
        loadComponent: () => import('./pages/category/category.component').then(m => m.CategoryComponent),
      },
      {
        path: 'p/:slug',
        loadComponent: () => import('./pages/product/product.component').then(m => m.ProductComponent),
      },
    ],
  },
];
