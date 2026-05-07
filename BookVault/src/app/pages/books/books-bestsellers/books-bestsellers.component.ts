import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookService } from '../../../services/book.service';
import { Book } from '../../../models/book.model';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-books-bestsellers',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    <div class="pt-app-header bg-white dark:bg-slate-950 min-h-screen transition-colors">
      <div class="container mx-auto px-4 py-10">
        <h1 class="text-2xl sm:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-4">Meilleures ventes</h1>
        <p class="text-zinc-600 dark:text-zinc-400 mb-8 text-sm">Tri par popularité (vues) côté catalogue.</p>
        <p *ngIf="loading" class="text-zinc-600 dark:text-zinc-400">Chargement…</p>
        <p *ngIf="error" class="text-red-600 dark:text-red-400">{{ error }}</p>
        <div *ngIf="!loading && !error" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div *ngFor="let book of books; let i = index" class="flex gap-4 items-start">
            <span class="text-4xl font-semibold text-indigo-200 dark:text-indigo-800">{{ i + 1 }}</span>
            <div>
              <img
                [src]="book.coverImage"
                [alt]="book.title"
                class="w-28 h-40 object-cover rounded-md shadow mb-2"
              />
              <a [routerLink]="['/books', book.id]" class="font-semibold text-slate-900 dark:text-white hover:underline">{{ book.title }}</a>
              <p class="text-zinc-500 dark:text-zinc-400 text-sm">{{ book.author }}</p>
              <p class="text-indigo-600 dark:text-indigo-400 font-semibold mt-1">{{ book.price | currency: 'EUR' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <app-footer></app-footer>
  `
})
export class BooksBestsellersComponent implements OnInit {
  books: Book[] = [];
  loading = true;
  error: string | null = null;

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.bookService.getBestsellers(24).subscribe({
      next: b => {
        this.books = b;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les meilleures ventes.';
        this.loading = false;
      }
    });
  }
}
