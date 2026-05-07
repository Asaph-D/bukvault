import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BookService } from '../../../services/book.service';
import { Book } from '../../../models/book.model';
import { ThemeService } from '../../../services/theme.service';

declare var $: any;

@Component({
  selector: 'app-book-reader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-0 left-0 w-full h-full flex flex-col" [class.dark-mode]="isDarkMode">
      <!-- Reader Header -->
      <div class="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
        <div class="flex items-center">
          <button (click)="goBack()" class="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
            <i class="fas fa-arrow-left text-xl"></i>
          </button>
          <h1 class="ml-4 text-xl font-bold text-gray-800 dark:text-white">{{ book?.title }}</h1>
        </div>
        <div class="flex items-center space-x-4">
          <button (click)="toggleDarkMode()" class="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
            <i [class]="isDarkMode ? 'fas fa-sun' : 'fas fa-moon'" class="text-xl"></i>
          </button>
          <div class="flex items-center space-x-2">
            <button (click)="decreaseFontSize()" class="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
              <i class="fas fa-minus"></i>
            </button>
            <span class="text-gray-800 dark:text-white">{{ fontSize }}px</span>
            <button (click)="increaseFontSize()" class="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Reader Content -->
      <div class="flex-1 bg-white dark:bg-gray-900 overflow-hidden">
        <div #bookContainer class="book-container h-full flex items-center justify-center">
          <div #book class="bookElement">
            <div class="page" *ngFor="let page of pages">
              <div class="page-content p-8" [style.fontSize.px]="fontSize">
                {{ page }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Reader Footer -->
      <div class="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
        <span class="text-gray-600 dark:text-gray-300">Page {{ currentPage }} of {{ totalPages }}</span>
        <div class="flex space-x-4">
          <button (click)="previousPage()" [disabled]="currentPage === 1" 
                  class="px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </button>
          <button (click)="nextPage()" [disabled]="currentPage === totalPages"
                  class="px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed">
            Next
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
    }

    .dark-mode {
      @apply bg-gray-900;
    }

    .book-container {
      perspective: 2000px;
    }

    .bookElement {
      transform-style: preserve-3d;
      transition: transform 0.5s;
    }

    .page {
      background: white;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
      position: absolute;
      width: 100%;
      height: 100%;
      transform-origin: left center;
      transition: transform 0.5s;
    }

    .page.turning {
      animation: turnPage 0.5s ease-in-out;
    }

    .dark-mode .page {
      background: #1a1a1a;
      color: #ffffff;
    }

    @keyframes turnPage {
      0% { transform: rotateY(0deg); }
      100% { transform: rotateY(-180deg); }
    }

    .page-content {
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.6;
    }
  `]
})
export class BookReaderComponent implements OnInit, AfterViewInit {
  @ViewChild('bookContainer') bookContainer!: ElementRef;
  @ViewChild('book') bookElement!: ElementRef;

  book: Book | undefined;
  pages: string[] = [];
  currentPage = 1;
  totalPages = 0;
  isDarkMode = false;
  fontSize = 16;

  constructor(
    private route: ActivatedRoute,
    private bookService: BookService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    const bookId = this.route.snapshot.paramMap.get('id');
    if (bookId) {
      this.bookService.getBookById(bookId).subscribe(book => {
        this.book = book;
        // Simulate book content with pages
        this.pages = this.generateDummyPages();
        this.totalPages = this.pages.length;
      });
    }

    this.isDarkMode = this.themeService.isDark;
    this.themeService.theme$.subscribe(t => {
      this.isDarkMode = t === 'dark';
    });
    this.fontSize = parseInt(localStorage.getItem('readerFontSize') || '16', 10);
  }

  ngAfterViewInit(): void {
    this.initializeReader();
  }

  initializeReader(): void {
    // Initialize turn.js
    $(this.bookElement.nativeElement).turn({
      width: 800,
      height: 600,
      acceleration: true,
      gradients: true,
      when: {
        turning: (event: any, page: number) => {
          this.currentPage = page;
        }
      }
    });
  }

  generateDummyPages(): string[] {
    return Array(10).fill(null).map((_, i) => 
      `Chapter ${i + 1}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`
    );
  }

  toggleDarkMode(): void {
    this.themeService.toggle();
  }

  increaseFontSize(): void {
    if (this.fontSize < 24) {
      this.fontSize += 2;
      localStorage.setItem('readerFontSize', this.fontSize.toString());
    }
  }

  decreaseFontSize(): void {
    if (this.fontSize > 12) {
      this.fontSize -= 2;
      localStorage.setItem('readerFontSize', this.fontSize.toString());
    }
  }

  previousPage(): void {
    $(this.bookElement.nativeElement).turn('previous');
  }

  nextPage(): void {
    $(this.bookElement.nativeElement).turn('next');
  }

  goBack(): void {
    window.history.back();
  }
}