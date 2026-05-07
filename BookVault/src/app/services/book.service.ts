import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { Book, BookCategory } from '../models/book.model';
import { environment } from '../../environments/environment';
import {
  AuthorPublicProfileDto,
  BookDetailDto,
  BookListItemDto,
  CategoryResponseDto,
  CreateBookRequestDto,
  PublishBookRequestDto,
  PageDto
} from '../models/api.types';

export const PLACEHOLDER_COVER =
  'https://images.pexels.com/photos/2908984/pexels-photo-2908984.jpeg';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private formatLabel(fmt: string): 'digital' | 'physical' | 'both' {
    switch (fmt) {
      case 'EBOOK':
        return 'digital';
      case 'PHYSICAL':
        return 'physical';
      case 'BOTH':
        return 'both';
      default:
        return 'both';
    }
  }

  /**
   * Si `coverUrl` est absent, utilise la couverture servie par file-service (première page générée côté seed / script).
   */
  private resolveCover(url: string | null, bookId: string): string {
    if (url && url.trim()) {
      if (url.startsWith('http')) return url;
      return url.startsWith('/') ? url : `/${url}`;
    }
    return `${this.base}/files/cover/${bookId}`;
  }

  private mapListItemToBook(b: BookListItemDto, categoryLabel = 'Catalogue'): Book {
    return {
      id: b.id,
      title: b.title,
      author: '—',
      authorId: b.authorId,
      description: '',
      price: Number(b.price),
      coverImage: this.resolveCover(b.coverUrl, b.id),
      category: categoryLabel,
      rating: b.averageRating,
      reviewCount: b.reviewCount,
      format: this.formatLabel(b.format),
      datePublished: b.publishedAt ? new Date(b.publishedAt) : new Date(b.createdAt),
      sales: b.viewCount,
      revenue: undefined
    };
  }

  private mapDetailToBook(d: BookDetailDto, authorName: string): Book {
    const cat =
      d.categories && d.categories.length > 0 ? d.categories[0].name : 'Catalogue';
    return {
      id: d.id,
      title: d.title,
      author: authorName,
      authorId: d.authorId,
      description: d.description || '',
      price: Number(d.price),
      coverImage: this.resolveCover(d.coverUrl, d.id),
      category: cat,
      rating: d.averageRating,
      reviewCount: d.reviewCount,
      format: this.formatLabel(d.format),
      datePublished: d.publishedAt ? new Date(d.publishedAt) : new Date(d.createdAt),
      isbn: d.isbn,
      language: d.language,
      viewCount: d.viewCount
    };
  }

  /**
   * Enrichit la liste avec les noms de plume via `GET /authors/{authorId}` (un appel par auteur distinct).
   */
  enrichBooksWithAuthors(books: Book[]): Observable<Book[]> {
    if (!books.length) {
      return of([]);
    }
    const uniqueIds = [...new Set(books.map(b => b.authorId))];
    return forkJoin(
      uniqueIds.map(aid =>
        this.http.get<AuthorPublicProfileDto>(`${this.base}/authors/${aid}`).pipe(
          map(a => ({ id: aid, name: a.penName || 'Auteur' })),
          catchError(() => of({ id: aid, name: 'Auteur' }))
        )
      )
    ).pipe(
      map(rows => {
        const nameById = new Map(rows.map(r => [r.id, r.name]));
        return books.map(b => ({
          ...b,
          author: nameById.get(b.authorId) ?? b.author
        }));
      })
    );
  }

  private listToBooks(
    request: Observable<PageDto<BookListItemDto>>
  ): Observable<Book[]> {
    return request.pipe(
      switchMap(p => {
        const books = p.content.map(b => this.mapListItemToBook(b));
        return this.enrichBooksWithAuthors(books);
      })
    );
  }

  getBooks(page = 0, size = 24): Observable<Book[]> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', 'publishedAt,desc');
    return this.listToBooks(this.http.get<PageDto<BookListItemDto>>(`${this.base}/books`, { params }));
  }

  getBestsellers(size = 12): Observable<Book[]> {
    const params = new HttpParams().set('size', String(size)).set('sort', 'viewCount,desc');
    return this.listToBooks(
      this.http.get<PageDto<BookListItemDto>>(`${this.base}/books/bestsellers`, { params })
    );
  }

  getBookById(id: string): Observable<Book | undefined> {
    return this.http.get<BookDetailDto>(`${this.base}/books/${id}`).pipe(
      switchMap(d =>
        this.http.get<AuthorPublicProfileDto>(`${this.base}/authors/${d.authorId}`).pipe(
          map(a => this.mapDetailToBook(d, a.penName || 'Auteur')),
          catchError(() => of(this.mapDetailToBook(d, 'Auteur')))
        )
      ),
      catchError(() => of(undefined))
    );
  }

  getBooksByCategory(categoryId: string, page = 0, size = 24): Observable<Book[]> {
    const params = new HttpParams()
      .set('categoryId', categoryId)
      .set('page', String(page))
      .set('size', String(size));
    return this.listToBooks(this.http.get<PageDto<BookListItemDto>>(`${this.base}/books`, { params }));
  }

  getBooksByAuthor(authorId: string, page = 0, size = 24): Observable<Book[]> {
    const params = new HttpParams()
      .set('authorId', authorId)
      .set('page', String(page))
      .set('size', String(size));
    return this.listToBooks(this.http.get<PageDto<BookListItemDto>>(`${this.base}/books`, { params }));
  }

  searchBooks(query: string, page = 0, size = 24): Observable<Book[]> {
    if (!query.trim()) return of([]);
    const params = new HttpParams()
      .set('q', query.trim())
      .set('page', String(page))
      .set('size', String(size));
    return this.listToBooks(this.http.get<PageDto<BookListItemDto>>(`${this.base}/books/search`, { params }));
  }

  getCategories(): Observable<BookCategory[]> {
    return this.http.get<CategoryResponseDto[]>(`${this.base}/categories`).pipe(
      map(list =>
        list.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug
        }))
      )
    );
  }

  /** API brute : création d'un livre (retour DTO). */
  createBook(request: CreateBookRequestDto): Observable<BookDetailDto> {
    return this.http.post<BookDetailDto>(`${this.base}/books`, request);
  }

  /** API brute : mise à jour livre (retour DTO). */
  updateBookRaw(id: string, request: Omit<CreateBookRequestDto, 'authorUserId'>): Observable<BookDetailDto> {
    // CreateBookRequestDto superset pour éviter de multiplier les types.
    // Le backend attend UpdateBookRequest = mêmes champs sauf authorUserId.
    const body = {
      isbn: request.isbn,
      title: request.title,
      description: request.description,
      price: request.price,
      language: request.language,
      format: request.format,
      categoryIds: request.categoryIds,
      coverUrl: request.coverUrl
    };
    return this.http.put<BookDetailDto>(`${this.base}/books/${id}`, body);
  }

  /** API brute : publier/dépublier. */
  setPublished(id: string, publish: boolean): Observable<BookDetailDto> {
    const body: PublishBookRequestDto = { publish };
    return this.http.patch<BookDetailDto>(`${this.base}/books/${id}/publish`, body);
  }

  /** API brute : soft-delete. */
  deleteBookRaw(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/books/${id}`);
  }
}
