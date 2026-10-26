import { describe, expect, it } from 'vitest';
import {
  formatRelativeSeconds,
  getFailureActionAvailability,
  getLatestFailureReason,
  getStatusBadge,
} from './dispatch-helpers';
import { ShipmentEvent } from '../models/dispatch.models';

describe('dispatch-helpers', () => {
  describe('getStatusBadge', () => {
    it('maps all four display statuses correctly to Vietnamese labels', () => {
      expect(getStatusBadge('WAITING').label).toBe('Chờ điều phối');
      expect(getStatusBadge('DELIVERING').label).toBe('Đang giao');
      expect(getStatusBadge('FAILED').label).toBe('Giao thất bại');
      expect(getStatusBadge('DELIVERED').label).toBe('Đã giao');
    });
  });

  describe('getFailureActionAvailability', () => {
    it('enables all three actions when attempt is under max attempts', () => {
      const result = getFailureActionAvailability(1, 3);
      expect(result.canRetry).toBe(true);
      expect(result.canReassign).toBe(true);
      expect(result.canReturn).toBe(true);
      expect(result.disabledReason).toBeUndefined();
    });

    it('disables retry and reassign when attempt reaches or exceeds max attempts', () => {
      const result = getFailureActionAvailability(3, 3);
      expect(result.canRetry).toBe(false);
      expect(result.canReassign).toBe(false);
      expect(result.canReturn).toBe(true);
      expect(result.disabledReason).toContain('3/3');
    });
  });

  describe('getLatestFailureReason', () => {
    it('extracts note from the latest failed event', () => {
      const events: ShipmentEvent[] = [
        { status: 'ASSIGNED', note: 'Gán đơn', createdAt: '2026-10-26T08:00:00' },
        { status: 'FAILED', note: 'Lần 1: Không nghe máy', createdAt: '2026-10-26T10:00:00' },
        { status: 'DELIVERING', note: 'Giao lại', createdAt: '2026-10-26T11:00:00' },
        { status: 'FAILED', note: 'Lần 2: Khách hẹn chiều', createdAt: '2026-10-26T14:00:00' },
      ];

      expect(getLatestFailureReason(events)).toBe('Lần 2: Khách hẹn chiều');
    });
  });

  describe('formatRelativeSeconds', () => {
    it('returns formatted seconds ago', () => {
      const tenSecsAgo = new Date(Date.now() - 10000).toISOString();
      expect(formatRelativeSeconds(tenSecsAgo)).toBe('10 giây trước');
    });
  });
});
