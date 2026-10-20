import { HttpErrorResponse } from '@angular/common/http';
import { mapHttpError } from './api-error.mapper';

describe('mapHttpError', () => {
  it('maps status 0 to friendly network error', () => {
    const err = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
    const mapped = mapHttpError(err);
    expect(mapped.status).toBe(0);
    expect(mapped.isNetworkError).toBe(true);
    expect(mapped.message).toContain('Không thể kết nối');
  });

  it('maps 400, 401, 403, 404 with server message or default fallback', () => {
    expect(mapHttpError(new HttpErrorResponse({ status: 400 })).status).toBe(400);
    expect(mapHttpError(new HttpErrorResponse({ status: 401 })).status).toBe(401);
    expect(mapHttpError(new HttpErrorResponse({ status: 403 })).status).toBe(403);
    expect(mapHttpError(new HttpErrorResponse({ status: 404 })).status).toBe(404);
  });

  it('maps 409 conflict and preserves field property', () => {
    const err = new HttpErrorResponse({
      status: 409,
      error: {
        status: 409,
        code: 'DUPLICATE_PHONE',
        message: 'Số điện thoại đã được sử dụng',
        field: 'phone',
      },
    });
    const mapped = mapHttpError(err);
    expect(mapped.status).toBe(409);
    expect(mapped.field).toBe('phone');
    expect(mapped.message).toBe('Số điện thoại đã được sử dụng');
  });

  it('maps 5xx errors to generic safe message without exposing internals', () => {
    const err = new HttpErrorResponse({
      status: 500,
      error: { message: 'NullPointerException at line 42' },
    });
    const mapped = mapHttpError(err);
    expect(mapped.status).toBe(500);
    expect(mapped.message).toBe('Hệ thống đang bận hoặc gặp sự cố. Vui lòng thử lại sau.');
  });
});
