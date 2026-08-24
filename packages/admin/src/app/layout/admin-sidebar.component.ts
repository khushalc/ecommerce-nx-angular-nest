import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { AdminRole } from '../data/api.types';

interface NavItem { label: string; path: string; icon: string; roles: AdminRole[]; }

const ALL: AdminRole[] = ['SUPER_ADMIN', 'CATALOG_MANAGER', 'ORDER_MANAGER'];
const CATALOG: AdminRole[] = ['SUPER_ADMIN', 'CATALOG_MANAGER'];
const ORDERS: AdminRole[] = ['SUPER_ADMIN', 'ORDER_MANAGER'];

@Component({
  selector: 'admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="w-[240px] shrink-0 border-r border-line bg-bg-elevated min-h-[calc(100vh-56px)]">
      <nav class="p-md space-y-xs" aria-label="Admin navigation">
        @for (n of visible(); track n.path) {
          <a
            [routerLink]="n.path"
            routerLinkActive="bg-bg-muted text-accent border-accent"
            [routerLinkActiveOptions]="{ exact: n.path === '/dashboard' }"
            class="flex items-center gap-sm px-md py-sm rounded-md border border-transparent text-ink-muted hover:bg-bg-muted hover:text-ink transition">
            <span aria-hidden="true" class="w-4 text-center">{{ n.icon }}</span>
            <span>{{ n.label }}</span>
          </a>
        }
      </nav>
    </aside>
  `,
})
export class AdminSidebarComponent {
  private readonly auth = inject(AuthService);

  private readonly items: NavItem[] = [
    { label: 'Dashboard',  path: '/dashboard',  icon: '⌘', roles: ALL },
    { label: 'Categories', path: '/categories', icon: '❏', roles: CATALOG },
    { label: 'Products',   path: '/products',   icon: '◆', roles: CATALOG },
    { label: 'Events',     path: '/sales',      icon: '★', roles: CATALOG },
    { label: 'Orders',     path: '/orders',     icon: '↗', roles: ORDERS },
    { label: 'Customers',  path: '/customers',  icon: '⚇', roles: ['SUPER_ADMIN'] },
    { label: 'Reports',    path: '/reports',    icon: '≣', roles: ['SUPER_ADMIN'] },
    { label: 'Settings',   path: '/settings',   icon: '⚙', roles: ['SUPER_ADMIN'] },
  ];

  visible() {
    const role = this.auth.user()?.role;
    if (!role) return [];
    return this.items.filter(n => n.roles.includes(role));
  }
}
