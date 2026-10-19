import { HttpErrorResponse } from '@angular/common/http';
import { ApiError, ApiErrorBody } from './api-error.model';

const DEFAULT_STATUS_MESSAGES: Record<number, string> = {
  400: 'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.',
  401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy dữ liệu yêu cầu.',
  409: 'Dữ liệu bị trùng hoặc xung đột trạng thái.',
  422: 'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.',
};

function readTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function resolveErrorMessage(status: number, serverMessage: string): string {
  if (status >= 500) {
    return 'Hệ thống đang bận hoặc gặp sự cố. Vui lòng thử lại sau.';
  }
  return serverMessage || DEFAULT_STATUS_MESSAGES[status] || 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.';
}

export function mapHttpError(error: unknown): ApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return {
      status: 0,
      code: 'UNKNOWN_ERROR',
      message: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
      isNetworkError: false,
    };
  }

  const status = error.status ?? 0;
  if (status === 0) {
    return {
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.',
      isNetworkError: true,
    };
  }

  const body = (typeof error.error === 'object' && error.error !== null ? error.error : {}) as ApiErrorBody;
  const field = readTrimmedString(body.field) || undefined;
  const serverMessage = readTrimmedString(body.message);
  const code = readTrimmedString(body.code) || `HTTP_${status}`;

  return {
    status,
    code,
    message: resolveErrorMessage(status, serverMessage),
    field,
    isNetworkError: false,
  };
}
