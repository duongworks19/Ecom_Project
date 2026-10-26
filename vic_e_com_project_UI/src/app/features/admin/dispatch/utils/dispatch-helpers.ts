import {
  ActionAvailability,
  DisplayStatus,
  ShipmentEvent,
} from '../models/dispatch.models';

export interface StatusBadge {
  label: string;
  cssModifier: string;
}

export function getStatusBadge(status: DisplayStatus | string): StatusBadge {
  switch (status) {
    case 'WAITING':
      return { label: 'Chờ điều phối', cssModifier: 'badge--waiting' };
    case 'DELIVERING':
      return { label: 'Đang giao', cssModifier: 'badge--delivering' };
    case 'FAILED':
      return { label: 'Giao thất bại', cssModifier: 'badge--failed' };
    case 'DELIVERED':
      return { label: 'Đã giao', cssModifier: 'badge--delivered' };
    default:
      return { label: status || 'Chưa xác định', cssModifier: 'badge--default' };
  }
}

export function getFailureActionAvailability(
  attemptNo: number,
  maxAttempts = 3
): ActionAvailability {
  const currentAttempts = Math.max(1, attemptNo || 1);

  if (currentAttempts >= maxAttempts) {
    return {
      canRetry: false,
      canReassign: false,
      canReturn: true,
      disabledReason: `Đã đạt giới hạn ${maxAttempts}/${maxAttempts} lần giao. Bắt buộc hoàn hàng về Shop.`,
    };
  }

  return {
    canRetry: true,
    canReassign: true,
    canReturn: true,
  };
}

export function getLatestFailureReason(events: ShipmentEvent[] | undefined): string {
  if (!events || events.length === 0) {
    return 'Shipper báo giao hàng không thành công.';
  }

  const failedEvents = events.filter((e) => e.status === 'FAILED');
  if (failedEvents.length > 0) {
    const latest = failedEvents[failedEvents.length - 1];
    if (latest.note && latest.note.trim().length > 0) {
      return latest.note.trim();
    }
  }

  return 'Khách hàng không thể nhận hàng hoặc không liên lạc được.';
}

export function formatRelativeSeconds(isoString: string | null | undefined): string {
  if (!isoString) {
    return 'vừa xong';
  }

  const scanTime = new Date(isoString).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - scanTime) / 1000));

  if (diffSec < 60) {
    return `${diffSec} giây trước`;
  }

  const diffMin = Math.floor(diffSec / 60);
  return `${diffMin} phút trước`;
}
