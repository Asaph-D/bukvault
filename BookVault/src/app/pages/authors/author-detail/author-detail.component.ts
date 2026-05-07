import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthorService } from '../../../services/author.service';
import { BookService } from '../../../services/book.service';
import { AuthorPublicProfileDto } from '../../../models/api.types';
import { Book } from '../../../models/book.model';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-author-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    <div class="pt-app-header bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div class="container mx-auto px-4 py-10" *ngIf="!loading && profile">
        <h1 class="text-2xl sm:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white">{{ profile.penName }}</h1>
        <p class="text-zinc-600 dark:text-zinc-400 mt-4 whitespace-pre-line">{{ profile.bio || 'Pas de biographie.' }}</p>
        <p *ngIf="profile.website" class="mt-4">
          <a [href]="profile.website" target="_blank" rel="noopener" class="text-indigo-600 dark:text-indigo-400 underline">{{
            profile.website
          }}</a>
        </p>
        <h2 class="text-xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mt-10 mb-4">Livres au catalogue</h2>
        <p *ngIf="books.length === 0" class="text-zinc-600 dark:text-zinc-400">Aucun titre pour cet auteur.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div *ngFor="let book of books" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
            <img [src]="book.coverImage" class="w-full h-48 object-cover" [alt]="book.title" />
            <div class="p-4">
              <a [routerLink]="['/books', book.id]" class="font-semibold text-slate-900 dark:text-white hover:underline">{{ book.title }}</a>
              <p class="text-indigo-600 dark:text-indigo-400 font-semibold mt-2">{{ book.price | currency: 'EUR' }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="container mx-auto px-4 py-20 text-center" *ngIf="loading">
        <p class="text-zinc-600 dark:text-zinc-400">Chargement…</p>
      </div>
      <div class="container mx-auto px-4 py-20 text-center" *ngIf="!loading && !profile">
        <p class="text-zinc-600 dark:text-zinc-400">Auteur introuvable.</p>
        <a routerLink="/authors" class="text-indigo-600 dark:text-indigo-400 underline mt-4 inline-block">Retour à la liste</a>
      </div>
    </div>
    <app-footer></app-footer>
  `
})
export class AuthorDetailComponent implements OnInit {
  profile: AuthorPublicProfileDto | undefined;
  books: Book[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private authorService: AuthorService,
    private bookService: BookService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      return;
    }
    this.authorService.getProfile(id).subscribe({
      next: p => {
        this.profile = p;
        this.bookService.getBooksByAuthor(id, 0, 24).subscribe(b => {
          this.books = b;
          this.loading = false;
        });
      },
      error: () => {
        this.profile = undefined;
        this.loading = false;
      }
    });
  }
}
