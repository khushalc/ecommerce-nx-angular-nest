import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminTopbarComponent } from './admin-topbar.component';
import { AdminSidebarComponent } from './admin-sidebar.component';

@Component({
  selector: 'admin-shell',
  standalone: true,
  imports: [RouterOutlet, AdminTopbarComponent, AdminSidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <admin-topbar />
    <div class="flex">
      <admin-sidebar />
      <main class="flex-1 p-lg overflow-x-auto min-h-[calc(100vh-56px)]">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminShellComponent {}
