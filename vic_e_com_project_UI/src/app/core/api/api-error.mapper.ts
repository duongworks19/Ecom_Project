import { HttpErrorResponse } from '@angular/common/http';
import { ApiError, ApiErrorBody } from './api-error.model';

export function mapHttpError(error: unknown): ApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return {
      status: 0,
      code: 'UNKNOWN_ERROR',
      message: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
      isNetworkError: false,
    };
  }

  const body = (typeof error.error === 'object' && error.error !== null ? error.error : {}) as ApiErrorBody;
  const status = error.status ?? 0;
  const field = typeof body.field === 'string' && body.field.trim() ? body.field.trim() : undefined;
  const serverMessage = typeof body.message === 'string' && body.message.trim() ? body.message.trim() : '';
  const code = typeof body.code === 'string' && body.code.trim() ? body.code.trim() : `HTTP_${status}`;

  if (status === 0) {
    return {
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.',
      isNetworkError: true,
    };
  }

  if (status === 400 || status === 422) {
    return {
      status,
      code,
      message: serverMessage || 'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.',
      field,
      isNetworkError: false,
    };
  }

  if (status === 401) {
    return {
      status: 401,
      code,
      message: serverMessage || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      isNetworkError: false,
    };
  }

  if (status === 403) {
    return {
      status: 403,
      code,
      message: serverMessage || 'Bạn không có quyền thực hiện thao tác này.',
      isNetworkError: false,
    };
  }

  if (status === 404) {
    return {
      status: 404,
      code,
      message: serverMessage || 'Không tìm thấy dữ liệu yêu cầu.',
      isNetworkError: false,
    };
  }

  if (status === 409) {
    return {
      status: 409,
      code,
      message: serverMessage || 'Dữ liệu bị trùng hoặc xung đột trạng thái.',
      field,
      isNetworkError: false,
    };
  }

  if (status >= 500) {
    return {
      status,
      code,
      message: 'Hệ thống đang bận hoặc gặp sự cố. Vui lòng thử lại sau.',
      isNetworkError: false,
    };
  }

  return {
    status,
    code,
    message: serverMessage || 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.',
    field,
    isNetworkError: false,
  };
}
