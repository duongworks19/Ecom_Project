import { buildOrderHttpParams } from './admin-orders.service';

describe('buildOrderHttpParams', () => {
  it('omits blank or empty query parameters and applies defaults', () => {
    const params = buildOrderHttpParams({
      q: '   ',
      status: 'ALL',
      shopId: undefined,
      paymentMethod: '',
      from: '',
      to: '',
    });

    expect(params.has('q')).toBe(false);
    expect(params.has('status')).toBe(false);
    expect(params.has('shopId')).toBe(false);
    expect(params.has('paymentMethod')).toBe(false);
    expect(params.has('from')).toBe(false);
    expect(params.has('to')).toBe(false);
    expect(params.get('page')).toBe('1');
    expect(params.get('pageSize')).toBe('20');
  });

  it('correctly sets valid query parameters', () => {
    const params = buildOrderHttpParams({
      q: 'VM240918',
      status: 'delivering',
      shopId: 3,
      paymentMethod: 'COD',
      from: '2026-10-01',
      to: '2026-10-30',
      page: 2,
      pageSize: 50,
    });

    expect(params.get('q')).toBe('VM240918');
    expect(params.get('status')).toBe('delivering');
    expect(params.get('shopId')).toBe('3');
    expect(params.get('paymentMethod')).toBe('COD');
    expect(params.get('from')).toBe('2026-10-01');
    expect(params.get('to')).toBe('2026-10-30');
    expect(params.get('page')).toBe('2');
    expect(params.get('pageSize')).toBe('50');
  });
});

