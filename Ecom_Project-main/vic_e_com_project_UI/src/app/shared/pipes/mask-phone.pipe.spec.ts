import { MaskPhonePipe } from './mask-phone.pipe';

describe('MaskPhonePipe', () => {
  const pipe = new MaskPhonePipe();

  it('formats 10-digit phone number with spaces by default', () => {
    expect(pipe.transform('0901234218')).toBe('0901 234 218');
  });

  it('masks middle digits when mode is mask', () => {
    expect(pipe.transform('0901234218', 'mask')).toBe('090****218');
  });

  it('returns empty string for null or undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
