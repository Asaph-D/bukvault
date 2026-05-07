import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookService } from '../../../services/book.service';
import { BookCategory } from '../../../models/book.model';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    <div class="pt-app-header bg-white dark:bg-slate-950 min-h-screen transition-colors">
      <div class="container mx-auto px-4 py-10">
        <h1 class="text-2xl sm:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-8">Catégories</h1>
        <p *ngIf="loading" class="text-zinc-600 dark:text-zinc-400">Chargement…</p>
        <p *ngIf="error" class="text-red-600 dark:text-red-400">{{ error }}</p>
        <div class="flex flex-wrap gap-3" *ngIf="!loading && !error">
          <a
            *ngFor="let c of categories"
            [routerLink]="['/categories', c.slug]"
            class="px-6 py-3 text-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-full hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition"
            >{{ c.name }}</a
          >
        </div>
      </div>
    </div>
    <app-footer></app-footer>
  `
})
export class CategoriesListComponent implements OnInit {
  categories: BookCategory[] = [];
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
      }
    });
  }
}
