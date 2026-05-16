import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BookService } from '../../../../services/book.service';
import { BookCategory } from '../../../../models/book.model';
import { DashboardInternalHeaderComponent } from '../../shared/dashboard-internal-header.component';

@Component({
  standalone: true,
  selector: 'app-admin-catalog-categories',
  imports: [CommonModule, RouterModule, FormsModule, DashboardInternalHeaderComponent],
  templateUrl: './admin-catalog-categories.component.html',
})
export class AdminCatalogCategoriesComponent implements OnInit {
  categories: BookCategory[] = [];
  searchQuery = '';
  loading = true;
  error: string | null = null;

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.bookService.getCategories().subscribe({
      next: c => {
        this.categories = c;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les catégories.';
        this.loading = false;
      },
    });
  }

  get filteredCategories(): BookCategory[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      return this.categories;
    }
    return this.categories.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description?.toLowerCase().includes(q) ?? false),
    );
  }

  get totalBooksInCatalog(): number {
    return this.categories.reduce((s, c) => s + (c.bookCount ?? 0), 0);
  }
}
