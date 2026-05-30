import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthorService } from './author.service';

describe('AuthorService', () => {
  let service: AuthorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthorService],
    });
    service = TestBed.inject(AuthorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('myDashboard() should GET /authors/me/dashboard', () => {
    let ok = false;
    service.myDashboard().subscribe(r => {
      ok = true;
      expect(r.publishedBooksEstimate).toBe(1);
    });
    const req = httpMock.expectOne(
      r => r.method === 'GET' && r.url.endsWith('/api/v1/authors/me/dashboard'),
    );
    req.flush({ publishedBooksEstimate: 1, draftBooksEstimate: 0, hint: 'ok' });
    expect(ok).toBeTrue();
  });

  it('myStats() should GET /authors/me/stats', () => {
    let ok = false;
    service.myStats().subscribe(r => {
      ok = true;
      expect(r.totalSalesEstimate).toBe(0);
    });
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/api/v1/authors/me/stats'));
    req.flush({ totalSalesEstimate: 0, revenueEstimate: 0, note: 'stub' });
    expect(ok).toBeTrue();
  });
});

