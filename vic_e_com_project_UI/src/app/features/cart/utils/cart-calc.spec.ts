import { HttpErrorResponse } from '@angular/common/http';
import { mapItemsWithTotal, calcSelectedTotal } from './cart-calc';
import { mapApiError } from '../../../shared/utils/api-error-messages';
import { CartItem } from '../models/cart.models';

const makeItem = (partial: Partial<CartItem>): CartItem => ({
  itemId: 1,
  productId: 10,
  productName: 'Test',
  imageUrl: null,
  variantId: 100,
  variantLabel: 'S',
  unitPrice: 100_000,
  quantity: 2,
  stockQty: 10,
  lowStock: false,
  reason: null,
  ...partial,
});

describe('cart-calc: mapItemsWithTotal', () => {
  it('tính lineTotal = unitPrice * quantity cho mỗi dòng', () => {
    const items = [
      makeItem({ itemId: 1, unitPrice: 50_000, quantity: 3 }),
      makeItem({ itemId: 2, unitPrice: 200_000, quantity: 1 }),
    ];
    const result = mapItemsWithTotal(items);
    expect(result[0].lineTotal).toBe(150_000);
    expect(result[1].lineTotal).toBe(200_000);
  });
});

describe('cart-calc: calcSelectedTotal', () => {
  it('chỉ cộng các dòng có itemId trong checkedIds', () => {
    const items = mapItemsWithTotal([
      makeItem({ itemId: 1, unitPrice: 100_000, quantity: 2 }),
      makeItem({ itemId: 2, unitPrice: 50_000, quantity: 4 }),
      makeItem({ itemId: 3, unitPrice: 30_000, quantity: 1 }),
    ]);
    const total = calcSelectedTotal(items, new Set([1, 3]));
    expect(total).toBe(230_000); // 200_000 + 30_000
  });

  it('trả về 0 khi checkedIds rỗng', () => {
    const items = mapItemsWithTotal([makeItem({ itemId: 1 })]);
    expect(calcSelectedTotal(items, new Set())).toBe(0);
  });
});

describe('api-error-messages: mapApiError', () => {
  const makeErr = (status: number, body: object): HttpErrorResponse =>
    new HttpErrorResponse({ status, error: body });

  it('ánh xạ STOCK_EXCEEDED đúng', () => {
    const err = makeErr(400, { code: 'STOCK_EXCEEDED' });
    expect(mapApiError(err)).toBe('Số lượng vượt quá tồn kho');
  });

  it('HTTP 500 trả về thông báo hệ thống', () => {
    const err = makeErr(500, {});
    expect(mapApiError(err)).toBe('Hệ thống đang gặp sự cố, thử lại sau');
  });

  it('status 0 là mất kết nối', () => {
    const err = makeErr(0, {});
    expect(mapApiError(err)).toBe('Không thể kết nối máy chủ');
  });
});
