import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from '../../../../services/auth.service';
import { BookService, PLACEHOLDER_COVER } from '../../../../services/book.service';
import { ReadingService } from '../../../../services/reading.service';
import { ReadingProgressDto } from '../../../../models/api.types';
import { DashboardInternalHeaderComponent } from '../../shared/dashboard-internal-header.component';

function parseProgressPercent(json: string): number {
  try {
    const o = JSON.parse(json) as { percent?: number };
    if (typeof o.percent === 'number') {
      return Math.min(100, Math.max(0, Math.round(o.percent)));
    }
  } catch {
    /* ignore */
  }
  return 0;
}

@Component({
  standalone: true,
  selector: 'app-reader-home',
  imports: [CommonModule, RouterModule, FormsModule, DashboardInternalHeaderComponent],
  templateUrl: './reader-home.component.html',
})
export class ReaderHomeComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private bookService: BookService,
    private reading: ReadingService,
  ) {}

  get displayName(): string {
    return this.auth.getCurrentUser()?.firstName || 'Lecteur';
  }

  dataLoading = true;
  loadError: string | null = null;

  resumeBook: {
    id: string;
    title: string;
    author: string;
    progress: number;
    cover: string;
  } | null = null;

  reco: {
    id: string;
    title: string;
    reason: string;
    cover: string;
  } | null = null;

  libTabs = [
    { id: 'all', label: 'Tous' },
    { id: 'progress', label: 'En cours' },
    { id: 'done', label: 'Terminés' },
    { id: 'paused', label: 'En pause' },
  ];
  activeLibTab = 'progress';

  library: {
    id: string;
    title: string;
    cover: string;
    progress: number;
    tab: string;
  }[] = [];

  theme: 'light' | 'dark' | 'sepia' = 'dark';
  themes = [
    { id: 'light' as const, label: 'Clair' },
    { id: 'dark' as const, label: 'Sombre' },
    { id: 'sepia' as const, label: 'Sepia' },
  ];

  fontSize = 18;
  fontFamilies = ['Lora', 'Georgia', 'Merriweather', 'Source Serif 4'];
  fontFamily = 'Lora';
  lineHeight = 1.65;

  effect: 'fade' | 'slide' | 'flip' = 'fade';
  animClass = '';

  previewChapter = 8;
  previewTotal = 20;
  previewParagraph = `Le vent porta une odeur de sel et de vieux papier. Sur le quai désert, les lanternes dessinaient des halos évanescents — comme si la ville elle-même retenait son souffle en attendant la marée.`;

  ngOnInit(): void {
    this.reading
      .listProgress()
      .pipe(
        catchError(() => of<ReadingProgressDto[]>([])),
        switchMap(progress => {
          const sorted = [...progress].sort(
            (a, b) =>
              new Date(b.serverUpdatedAt).getTime() - new Date(a.serverUpdatedAt).getTime(),
          );
          const first = sorted[0];
          return forkJoin({
            progress: of(progress),
            catalogue: this.bookService.getBooks(0, 12),
            hot: this.bookService.getBestsellers(8),
            resume: first ? this.bookService.getBookById(first.bookId) : of(undefined),
          }).pipe(
            map(({ progress: prog, catalogue, hot, resume }) => ({
              prog,
              catalogue,
              hot,
              resume,
              first,
            })),
          );
        }),
      )
      .subscribe({
        next: ({ prog, catalogue, hot, resume, first }) => {
          const byId = new Map<string, number>();
          prog.forEach(p => byId.set(p.bookId, parseProgressPercent(p.positionJson)));

          if (resume && first) {
            this.resumeBook = {
              id: resume.id,
              title: resume.title,
              author: resume.author,
              cover: resume.coverImage,
              progress: byId.get(resume.id) ?? parseProgressPercent(first.positionJson),
            };
          }

          const rid = this.resumeBook?.id;
          const pick = hot.find(b => b.id !== rid) ?? hot[0];
          if (pick) {
            this.reco = {
              id: pick.id,
              title: pick.title,
              reason: `${pick.category} · ${pick.rating.toFixed(1)}★ · ${pick.reviewCount} avis`,
              cover: pick.coverImage,
            };
          }

          this.library = catalogue.map(b => {
            const p = byId.get(b.id) ?? 0;
            const tab =
              p >= 95 ? 'done' : p > 0 && p < 22 ? 'paused' : p > 0 ? 'progress' : 'progress';
            return {
              id: b.id,
              title: b.title,
              cover: b.coverImage,
              progress: p,
              tab,
            };
          });

          this.dataLoading = false;
        },
        error: () => {
          this.loadError = 'Impossible de charger le catalogue ou la progression.';
          this.dataLoading = false;
        },
      });
  }

  onCoverErr(ev: Event): void {
    const el = ev.target as HTMLImageElement;
    el.src = PLACEHOLDER_COVER;
  }

  get filteredLibrary() {
    if (this.activeLibTab === 'all') return this.library;
    return this.library.filter(b => b.tab === this.activeLibTab);
  }

  adjustFont(delta: number): void {
    const n = Math.min(26, Math.max(14, this.fontSize + delta));
    this.fontSize = n;
  }

  prevChapter(): void {
    if (this.previewChapter <= 1) return;
    this.previewChapter--;
    this.playAnim();
  }

  nextChapter(): void {
    if (this.previewChapter >= this.previewTotal) return;
    this.previewChapter++;
    this.playAnim();
  }

  onEffectChange(): void {
    this.playAnim();
  }

  private playAnim(): void {
    if (this.effect === 'flip') {
      this.animClass = 'reader-preview-flip';
    } else if (this.effect === 'slide') {
      this.animClass = 'reader-preview-slide';
    } else {
      this.animClass = 'reader-preview-slide';
    }
    setTimeout(() => {
      this.animClass = '';
    }, 720);
  }
}
