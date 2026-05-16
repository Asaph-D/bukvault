import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, takeUntil } from 'rxjs/operators';
import { DashboardInternalHeaderComponent } from '../../shared/dashboard-internal-header.component';
import { ReadingService } from '../../../../services/reading.service';
import { BookService, PLACEHOLDER_COVER } from '../../../../services/book.service';
import { ReadingProgressDto } from '../../../../models/api.types';
import { Book } from '../../../../models/book.model';
import {
  ReaderCustomList,
  ReaderCustomListsService,
} from '../services/reader-custom-lists.service';
import { parseProgressPercent, readingMediaLabel } from '../utils/reading-progress.util';

interface ProgressRow {
  progress: ReadingProgressDto;
  book?: Book;
  percent: number;
}

@Component({
  standalone: true,
  selector: 'app-reader-reading-lists',
  imports: [CommonModule, RouterModule, FormsModule, DashboardInternalHeaderComponent],
  templateUrl: './reader-reading-lists.component.html',
})
export class ReaderReadingListsComponent implements OnInit, OnDestroy {
  readonly PLACEHOLDER_COVER = PLACEHOLDER_COVER;

  progressRows: ProgressRow[] = [];
  lists: ReaderCustomList[] = [];
  selectedListId: string | null = null;
  newListName = '';
  searchQuery = '';
  searchHits: Book[] = [];
  searching = false;

  listsLoading = false;
  progressLoading = true;
  progressError: string | null = null;

  renameDraft = '';
  private readonly destroy$ = new Subject<void>();
  private readonly search$ = new Subject<string>();

  constructor(
    private reading: ReadingService,
    private books: BookService,
    private customLists: ReaderCustomListsService,
  ) {}

  get selectedList(): ReaderCustomList | null {
    return this.lists.find(l => l.id === this.selectedListId) ?? null;
  }

  get selectedListBooks(): { id: string; book?: Book }[] {
    const list = this.selectedList;
    if (!list) return [];
    return list.bookIds.map(id => ({
      id,
      book: this.bookCache.get(id),
    }));
  }

  private bookCache = new Map<string, Book>();

  ngOnInit(): void {
    this.customLists.lists$.pipe(takeUntil(this.destroy$)).subscribe(l => {
      this.lists = l;
      if (!this.selectedListId && l.length) {
        this.selectedListId = l[0].id;
      }
      if (this.selectedListId && !l.some(x => x.id === this.selectedListId)) {
        this.selectedListId = l[0]?.id ?? null;
      }
      this.hydrateListBooks();
    });

    this.search$
      .pipe(
        debounceTime(300),
        map(q => q.trim()),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
        switchMap(q => {
          if (!q) {
            this.searchHits = [];
            this.searching = false;
            return of([]);
          }
          this.searching = true;
          return this.books.searchBooks(q, 0, 12).pipe(
            catchError(() => of([] as Book[])),
            map(b => {
              this.searching = false;
              return b;
            }),
          );
        }),
      )
      .subscribe(h => {
        this.searchHits = h;
      });

    this.loadProgress();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(): void {
    this.search$.next(this.searchQuery);
  }

  onCoverErr(ev: Event): void {
    (ev.target as HTMLImageElement).src = PLACEHOLDER_COVER;
  }

  createList(): void {
    const n = this.newListName.trim();
    if (!n) {
      this.banner = { kind: 'danger', text: 'Donnez un nom à votre liste.' };
      return;
    }
    try {
      const l = this.customLists.createList(n);
      this.newListName = '';
      this.selectedListId = l.id;
      this.banner = null;
    } catch {
      this.banner = { kind: 'danger', text: 'Impossible de créer la liste.' };
    }
  }

  selectList(id: string): void {
    this.selectedListId = id;
    this.renameDraft = '';
    this.hydrateListBooks();
  }

  startRename(): void {
    if (this.selectedList) {
      this.renameDraft = this.selectedList.name;
    }
  }

  commitRename(): void {
    if (this.selectedListId && this.renameDraft.trim()) {
      this.customLists.renameList(this.selectedListId, this.renameDraft.trim());
    }
    this.renameDraft = '';
  }

  deleteSelectedList(): void {
    if (!this.selectedListId) return;
    this.customLists.deleteList(this.selectedListId);
    this.selectedListId = null;
  }

  addHitToList(b: Book): void {
    if (!this.selectedListId) {
      this.banner = { kind: 'danger', text: 'Créez ou sélectionnez une liste.' };
      return;
    }
    this.customLists.addBook(this.selectedListId, b.id);
    this.bookCache.set(b.id, b);
  }

  removeFromList(bookId: string): void {
    if (!this.selectedListId) return;
    this.customLists.removeBook(this.selectedListId, bookId);
  }

  banner: { kind: 'success' | 'danger'; text: string } | null = null;
  clearBanner(): void {
    this.banner = null;
  }

  labelMedia(m: string): string {
    return readingMediaLabel(m);
  }

  private hydrateListBooks(): void {
    const list = this.lists.find(l => l.id === this.selectedListId);
    if (!list?.bookIds.length) return;
    const missing = list.bookIds.filter(id => !this.bookCache.has(id));
    if (!missing.length) return;
    forkJoin(
      missing.map(id =>
        this.books.getBookById(id).pipe(
          map(b => {
            if (b) this.bookCache.set(id, b);
            return b;
          }),
        ),
      ),
    ).subscribe();
  }

  loadProgress(): void {
    this.progressLoading = true;
    this.progressError = null;
    this.reading.listProgress().subscribe({
      next: progresses => {
        if (!progresses.length) {
          this.progressRows = [];
          this.progressLoading = false;
          return;
        }
        forkJoin(
          progresses.map(p =>
            this.books.getBookById(p.bookId).pipe(
              map(b => ({
                progress: p,
                book: b,
                percent: parseProgressPercent(p.positionJson),
              } satisfies ProgressRow)),
              catchError(() =>
                of({
                  progress: p,
                  book: undefined,
                  percent: parseProgressPercent(p.positionJson),
                } satisfies ProgressRow),
              ),
            ),
          ),
        ).subscribe({
          next: rows => {
            this.progressRows = rows.sort(
              (a, b) =>
                new Date(b.progress.serverUpdatedAt).getTime() -
                new Date(a.progress.serverUpdatedAt).getTime(),
            );
            this.progressLoading = false;
          },
          error: () => {
            this.progressError = 'Impossible de charger les détails des livres.';
            this.progressLoading = false;
          },
        });
      },
      error: () => {
        this.progressError = 'Progression indisponible.';
        this.progressLoading = false;
      },
    });
  }
}
