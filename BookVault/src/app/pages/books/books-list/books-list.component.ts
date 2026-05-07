import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookService } from '../../../services/book.service';
import { Book } from '../../../models/book.model';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-books-list',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    <div class="pt-app-header bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div class="container mx-auto px-4 py-10">
        <h1 class="text-2xl sm:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-8">Catalogue</h1>
        <p *ngIf="loading" class="text-zinc-600 dark:text-zinc-400">Chargement…</p>
        <p *ngIf="error" class="text-red-600 dark:text-red-400">{{ error }}</p>
        <div
          *ngIf="!loading && !error"
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          <div *ngFor="let book of books" class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
            <img [src]="book.coverImage" [alt]="book.title" class="w-full h-64 object-cover" />
            <div class="p-4">
              <h2 class="font-semibold text-lg text-slate-900 dark:text-white">{{ book.title }}</h2>
              <p class="text-zinc-500 dark:text-zinc-400 text-sm mb-2">{{ book.author }}</p>
              <div class="flex justify-between items-center mt-2">
                <span class="font-semibold text-indigo-600 dark:text-indigo-400">{{ book.price | currency: 'EUR' }}</span>
                <a
                  [routerLink]="['/books', book.id]"
                  class="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:brightness-110"
                  >Voir</a
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <app-footer></app-footer>
  `
})
export class BooksListComponent implements OnInit {
  books: Book[] = [];
  loading = true;
  error: string | null = null;

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.bookService.getBooks(0, 48).subscribe({
      next: b => {
        this.books = b;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger le catalogue. Vérifiez que la gateway et le catalogue sont démarrés.';
        this.loading = false;
      }
    });
  }
}
