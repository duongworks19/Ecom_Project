import { VndCurrencyPipe } from './vnd-currency.pipe';

describe('VndCurrencyPipe', () => {
  const pipe = new VndCurrencyPipe();

  it('formats number to Vietnamese currency with dot separators and ₫ symbol', () => {
    expect(pipe.transform(640000)).toBe('640.000 ₫');
    expect(pipe.transform(1250000)).toBe('1.250.000 ₫');
    expect(pipe.transform(0)).toBe('0 ₫');
  });

  it('handles null or undefined safely', () => {
    expect(pipe.transform(null)).toBe('0 ₫');
    expect(pipe.transform(undefined)).toBe('0 ₫');
  });
});
