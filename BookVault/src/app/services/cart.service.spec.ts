import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { CartService } from './cart.service';
import { BookService } from './book.service';

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CartService,
        {
          provide: BookService,
          useValue: {
            getBookById: (id: string) =>
              of({
                id,
                title: `T-${id}`,
                author: 'A',
                authorId: 'au',
                description: '',
                price: 10,
                coverImage: '',
                category: 'c',
                rating: 0,
                reviewCount: 0,
                format: 'digital',
                datePublished: new Date(),
              }),
          },
        },
      ],
    });
    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getCart() should call GET /cart and map lines', () => {
    let count = -1;
    service.cartCount$.subscribe(n => (count = n));

    service.getCart().subscribe(lines => {
      expect(lines.length).toBe(1);
      expect(lines[0].title).toBe('T-b1');
      expect(count).toBe(2);
    });

    const req = httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/api/v1/cart'));
    req.flush([
      { id: 10, bookId: 'b1', quantity: 2, unitPrice: 10, format: 'EBOOK', lineTotal: 20 },
    ]);
  });
});

