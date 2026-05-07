import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BookService } from '../../../services/book.service';
import { Book } from '../../../models/book.model';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    <div class="pt-app-header bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div class="container mx-auto px-4 py-10">
        <h1 class="text-2xl sm:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-2">{{ categoryName }}</h1>
        <p *ngIf="loading" class="text-zinc-600 dark:text-zinc-400">Chargement…</p>
        <p *ngIf="missingSlug" class="text-red-600 dark:text-red-400">Catégorie introuvable.</p>
        <div *ngIf="!loading && !missingSlug" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div *ngFor="let book of books" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
            <img [src]="book.coverImage" class="w-full h-56 object-cover" [alt]="book.title" />
            <div class="p-4">
              <h2 class="font-semibold text-slate-900 dark:text-white">{{ book.title }}</h2>
              <p class="text-zinc-500 dark:text-zinc-400 text-sm">{{ book.author }}</p>
              <div class="flex justify-between items-center mt-3">
                <span class="font-semibold text-indigo-600 dark:text-indigo-400">{{ book.price | currency: 'EUR' }}</span>
                <a [routerLink]="['/books', book.id]" class="text-sm text-indigo-600 dark:text-indigo-400 underline">Voir</a>
              </div>
            </div>
          </div>
        </div>
        <p *ngIf="!loading && !missingSlug && books.length === 0" class="text-zinc-600 dark:text-zinc-400 mt-8">
          Aucun livre dans cette catégorie.
        </p>
      </div>
    </div>
    <app-footer></app-footer>
  `
})
export class CategoryDetailComponent implements OnInit {
  books: Book[] = [];
  categoryName = '';
  loading = true;
  missingSlug = false;

  constructor(
    private route: ActivatedRoute,
    private bookService: BookService
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.missingSlug = true;
      this.loading = false;
      return;
    }
    this.bookService.getCategories().subscribe({
      next: cats => {
        const cat = cats.find(c => c.slug === slug);
        if (!cat) {
          this.missingSlug = true;
          this.loading = false;
          return;
        }
        this.categoryName = cat.name;
        this.bookService.getBooksByCategory(cat.id, 0, 48).subscribe({
          next: b => {
            this.books = b;
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          }
        });
      },
      error: () => {
        this.missingSlug = true;
        this.loading = false;
      }
    });
  }
}
