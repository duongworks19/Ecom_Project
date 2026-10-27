import { CartItem, CartItemWithTotal } from '../models/cart.models';

/**
 * Thêm lineTotal = unitPrice * quantity vào mỗi CartItem.
 * Hàm thuần — KHÔNG gọi API, KHÔNG có side-effect.
 */
export function mapItemsWithTotal(items: CartItem[]): CartItemWithTotal[] {
  return items.map((item) => ({
    ...item,
    lineTotal: item.unitPrice * item.quantity,
  }));
}

/**
 * Tính tổng tiền của các dòng được chọn (theo Set<itemId>).
 * Hàm thuần — dùng trong cart-page và mini-cart.
 */
export function calcSelectedTotal(
  items: CartItemWithTotal[],
  checkedIds: Set<number>
): number {
  return items
    .filter((item) => checkedIds.has(item.itemId))
    .reduce((sum, item) => sum + item.lineTotal, 0);
}
