import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReadingService } from './reading.service';

describe('ReadingService', () => {
  let service: ReadingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReadingService],
    });
    service = TestBed.inject(ReadingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('listProgress() should GET /reading/progress', () => {
    let ok = false;
    service.listProgress().subscribe(list => {
      ok = true;
      expect(Array.isArray(list)).toBeTrue();
    });
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/api/v1/reading/progress'));
    req.flush([]);
    expect(ok).toBeTrue();
  });

  it('getProgress() should GET /reading/progress/{bookId}?mediaType=EBOOK', () => {
    service.getProgress('b1', 'EBOOK').subscribe();
    const req = httpMock.expectOne(
      r => r.method === 'GET' && r.url.endsWith('/api/v1/reading/progress/b1'),
    );
    expect(req.request.params.get('mediaType')).toBe('EBOOK');
    req.flush({
      bookId: 'b1',
      mediaType: 'EBOOK',
      positionJson: '{}',
      deviceId: null,
      serverUpdatedAt: new Date().toISOString(),
      clientUpdatedAt: null,
    });
  });

  it('upsertProgress() should PUT /reading/progress/{bookId}', () => {
    service.upsertProgress('b1', { mediaType: 'EBOOK', positionJson: '{}' }).subscribe();
    const req = httpMock.expectOne(
      r => r.method === 'PUT' && r.url.endsWith('/api/v1/reading/progress/b1'),
    );
    expect(req.request.body.mediaType).toBe('EBOOK');
    req.flush({
      bookId: 'b1',
      mediaType: 'EBOOK',
      positionJson: '{}',
      deviceId: 'web',
      serverUpdatedAt: new Date().toISOString(),
      clientUpdatedAt: new Date().toISOString(),
    });
  });
});

