import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrderService],
    });
    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('listMyOrders() should call GET /orders with paging', () => {
    service.listMyOrders(2, 50).subscribe();
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/api/v1/orders'));
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('50');
    req.flush({ content: [], totalElements: 0, totalPages: 0, size: 50, number: 2 });
  });

  it('createFromCart() should POST /orders', () => {
    let ok = false;
    service.createFromCart().subscribe(o => {
      ok = true;
      expect(o.id).toBe(1);
    });
    const req = httpMock.expectOne(r => r.method === 'POST' && r.url.endsWith('/api/v1/orders'));
    req.flush({
      id: 1,
      userId: 'u',
      status: 'PENDING',
      totalAmount: 10,
      currency: 'XAF',
      paymentReference: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: [],
    });
    expect(ok).toBeTrue();
  });

  it('pay() should POST /orders/{id}/pay', () => {
    let ok = false;
    service.pay(123).subscribe(o => {
      ok = true;
      expect(o.status).toBe('PAID');
    });
    const req = httpMock.expectOne(
      r => r.method === 'POST' && r.url.endsWith('/api/v1/orders/123/pay'),
    );
    req.flush({
      id: 123,
      userId: 'u',
      status: 'PAID',
      totalAmount: 10,
      currency: 'XAF',
      paymentReference: 'MOCK',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: [],
    });
    expect(ok).toBeTrue();
  });
});

