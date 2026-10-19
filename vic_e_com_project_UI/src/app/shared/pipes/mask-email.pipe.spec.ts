import { MaskEmailPipe } from './mask-email.pipe';

describe('MaskEmailPipe', () => {
  const pipe = new MaskEmailPipe();

  it('masks local part keeping first 2 characters and preserves domain', () => {
    expect(pipe.transform('minhanh@gmail.com')).toBe('mi*****@gmail.com');
    expect(pipe.transform('ab@domain.vn')).toBe('a***@domain.vn');
  });

  it('handles empty or invalid email gracefully', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('invalid-email')).toBe('invalid-email');
  });
});
