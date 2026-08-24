import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoriesService } from '../../data/categories.service';
import { Category } from '../../data/api.types';

interface TreeRow {
  category: Category;
  depth: 0 | 1;
}

@Component({
  selector: 'admin-categories-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between mb-lg">
      <div>
        <h1 class="text-h2 text-ink">Categories</h1>
        <p class="text-body-sm text-ink-muted">Tree view — root categories with sub-categories indented one level.</p>
      </div>
      <a routerLink="/categories/new" class="admin-btn-primary">+ New category</a>
    </div>

    <div class="admin-card overflow-hidden">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Pricing mode</th>
            <th class="text-right">Sub-cats</th>
            <th class="text-right">Products</th>
            <th class="text-right">Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (row of tree(); track row.category.id) {
            <tr>
              <td>
                <div class="flex items-center gap-sm">
                  @if (row.depth === 1) {
                    <span class="text-ink-subtle pl-lg" aria-hidden="true">↳</span>
                  }
                  <div>
                    <div class="text-ink font-medium">{{ row.category.name }}</div>
                    @if (row.category.description) {
                      <div class="text-caption text-ink-subtle line-clamp-1">{{ row.category.description }}</div>
                    }
                  </div>
                </div>
              </td>
              <td class="font-mono text-caption">{{ row.category.slug }}</td>
              <td>
                <span class="badge" [class.badge-gold]="row.category.pricingMode === 'LIVE_METAL_RATE'">
                  {{ row.category.pricingMode }}
                </span>
                @if (row.depth === 1) {
                  <span class="text-caption text-ink-subtle ml-xs" title="Inherited from parent">↑</span>
                }
              </td>
              <td class="text-right num-tabular">{{ row.category._count?.children ?? 0 }}</td>
              <td class="text-right num-tabular">{{ row.category._count?.products ?? 0 }}</td>
              <td class="text-right">
                <span class="badge" [class.badge-success]="row.category.isActive" [class.badge-danger]="!row.category.isActive">
                  {{ row.category.isActive ? 'Yes' : 'No' }}
                </span>
              </td>
              <td class="text-right">
                <a [routerLink]="['/categories', row.category.id]" class="admin-btn">Edit</a>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="7" class="text-center text-ink-muted py-xl">No categories yet.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class CategoriesListComponent {
  private readonly categoriesService = inject(CategoriesService);
  readonly categories = signal<Category[]>([]);

  readonly tree = computed<TreeRow[]>(() => {
    const cats = this.categories();
    const roots = cats.filter((c) => c.parentId === null);
    const rows: TreeRow[] = [];
    for (const root of roots.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))) {
      rows.push({ category: root, depth: 0 });
      const children = cats
        .filter((c) => c.parentId === root.id)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      for (const child of children) rows.push({ category: child, depth: 1 });
    }
    return rows;
  });

  constructor() {
    this.categoriesService.list().subscribe((c) => this.categories.set(c));
  }
}
