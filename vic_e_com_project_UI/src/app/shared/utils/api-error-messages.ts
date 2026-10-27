import { HttpErrorResponse } from '@angular/common/http';

/** Map mã lỗi backend → thông báo tiếng Việt.
 *  NGUỒN DUY NHẤT cho ánh xạ này trong toàn bộ ứng dụng. */
const ERROR_CODE_MAP: Record<string, string> = {
  STOCK_EXCEEDED: 'Số lượng vượt quá tồn kho',
  PRODUCT_UNAVAILABLE: 'Sản phẩm hiện không khả dụng',
  VARIANT_MISMATCH: 'Phân loại không hợp lệ',
  CART_ITEM_NOT_FOUND: 'Sản phẩm không còn trong giỏ hàng',
  VARIANT_NOT_FOUND: 'Không tìm thấy phân loại',
  INVALID_QUANTITY: 'Số lượng không hợp lệ (từ 1 đến 99)',
  INVALID_ITEM_IDS: 'Danh sách sản phẩm không hợp lệ',
  PRODUCT_NOT_FOUND: 'Không tìm thấy sản phẩm',
};

/**
 * Ánh xạ lỗi HTTP → thông báo thân thiện tiếng Việt.
 * Ưu tiên: code riêng → HTTP status → message của backend → fallback chung.
 */
export function mapApiError(error: HttpErrorResponse): string {
  const body = error.error as { code?: string; message?: string } | null;
  const code = body?.code;

  if (code && ERROR_CODE_MAP[code]) {
    return ERROR_CODE_MAP[code];
  }

  if (error.status === 403) {
    return 'Bạn không có quyền thực hiện thao tác này';
  }

  if (error.status === 409) {
    return 'Dữ liệu đã thay đổi, vui lòng tải lại';
  }

  if (error.status === 500) {
    return 'Hệ thống đang gặp sự cố, thử lại sau';
  }

  if (error.status === 0) {
    return 'Không thể kết nối máy chủ';
  }

  return body?.message ?? 'Đã có lỗi xảy ra, thử lại sau';
}
