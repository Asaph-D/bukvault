import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReviewService } from './review.service';

describe('ReviewService', () => {
  let service: ReviewService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReviewService],
    });
    service = TestBed.inject(ReviewService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('listByBook() should GET /books/{id}/reviews', () => {
    service.listByBook('b1', 1, 10).subscribe();
    const req = httpMock.expectOne(
      r => r.method === 'GET' && r.url.endsWith('/api/v1/books/b1/reviews'),
    );
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('10');
    req.flush({ content: [], totalElements: 0, totalPages: 0, size: 10, number: 1 });
  });

  it('create() should POST /books/{id}/reviews', () => {
    service.create('b1', { rating: 5, body: 'super livre' }).subscribe();
    const req = httpMock.expectOne(
      r => r.method === 'POST' && r.url.endsWith('/api/v1/books/b1/reviews'),
    );
    expect(req.request.body.rating).toBe(5);
    req.flush({
      id: 1,
      bookId: 'b1',
      userId: 'u1',
      rating: 5,
      title: null,
      body: 'super livre',
      verifiedPurchase: true,
      helpfulCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });
});

