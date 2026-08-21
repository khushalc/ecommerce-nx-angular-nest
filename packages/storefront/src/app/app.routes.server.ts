import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '',           renderMode: RenderMode.Prerender },
  { path: 'c/:slug',    renderMode: RenderMode.Server   },
  { path: 'p/:slug',    renderMode: RenderMode.Server   },
  { path: '**',         renderMode: RenderMode.Server   },
];
