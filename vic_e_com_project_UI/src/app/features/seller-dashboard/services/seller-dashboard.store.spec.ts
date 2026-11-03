import { TestBed } from '@angular/core/testing';
import { SellerDashboardStore } from './seller-dashboard.store';
import { OrderItem, ReturnItem, ReviewItem, QuestionItem } from '../models/seller-dashboard.model';

describe('SellerDashboardStore', () => {
  let store: SellerDashboardStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SellerDashboardStore],
    });
    store = TestBed.inject(SellerDashboardStore);
  });

  it('should initialize with default states and computed values', () => {
    expect(store.shopStatus()).toBe('APPROVED');
    expect(store.products().length).toBe(0);
    expect(store.orders().length).toBe(8);
  });

  it('should accurately compute order counts and todo count', () => {
    const mockOrders: OrderItem[] = [
      { c: 'VM1', n: 'Khách 1', k: 1, t: 100000, s: 'PENDING', h: 'Vừa xong' },
      { c: 'VM2', n: 'Khách 2', k: 2, t: 200000, s: 'PREPARING', h: '10:00' },
      { c: 'VM3', n: 'Khách 3', k: 1, t: 150000, s: 'PACKED', h: '09:00' },
      { c: 'VM4', n: 'Khách 4', k: 1, t: 50000, s: 'DELIVERED', h: 'Hôm qua' },
    ];
    store.orders.set(mockOrders);

    expect(store.pendingOrderCount()).toBe(1);
    expect(store.preparingOrderCount()).toBe(1);
    expect(store.openOrdersCount()).toBe(3); // PENDING + PREPARING + PACKED
  });

  it('should accurately compute return, review, and question counts', () => {
    const mockReturns: ReturnItem[] = [
      { id: 1, o: 'VM1', n: 'Khách', type: 'Đổi hàng', why: 'Lỗi', amt: 50000, img: 1, st: 'PENDING' },
      { id: 2, o: 'VM2', n: 'Khách', type: 'Hoàn tiền', why: 'Sai màu', amt: 70000, img: 0, st: 'APPROVED' },
    ];
    store.returns.set(mockReturns);
    expect(store.pendingReturnCount()).toBe(1);

    const mockReviews: ReviewItem[] = [
      { id: 1, p: 'SP1', who: 'A', st: 5, x: 'Tốt' },
      { id: 2, p: 'SP2', who: 'B', st: 4, x: 'Được', re: 'Cảm ơn' },
    ];
    store.reviews.set(mockReviews);
    expect(store.unrepliedReviewCount()).toBe(1);

    const mockQuestions: QuestionItem[] = [
      { id: 1, p: 'SP1', who: 'A', x: 'Còn hàng không?' },
      { id: 2, p: 'SP2', who: 'B', x: 'Bảo hành bao lâu?', a: '12 tháng' },
    ];
    store.questions.set(mockQuestions);
    expect(store.unrepliedQuestionCount()).toBe(1);
  });

  it('should correctly set and reset toast notifications', () => {
    store.showToast('Test notification', false);
    expect(store.toastMessage()).toBe('Test notification');
    expect(store.isToastError()).toBe(false);

    store.showToast('Test error', true);
    expect(store.toastMessage()).toBe('Test error');
    expect(store.isToastError()).toBe(true);
  });
});
