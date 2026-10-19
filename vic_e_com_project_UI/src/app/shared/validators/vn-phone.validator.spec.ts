import { FormControl } from '@angular/forms';
import { formatVnPhoneDisplay, normalizeVnPhone, vnPhoneValidator } from './vn-phone.validator';

describe('vnPhoneValidator', () => {
  const validator = vnPhoneValidator();

  it('returns null for empty value (let required validator handle empty)', () => {
    expect(validator(new FormControl(''))).toBeNull();
    expect(validator(new FormControl('   '))).toBeNull();
  });

  it('accepts valid 10-digit Vietnamese phone numbers with or without spaces', () => {
    expect(validator(new FormControl('0901234218'))).toBeNull();
    expect(validator(new FormControl('0901 234 218'))).toBeNull();
    expect(validator(new FormControl(' 0987 654 321 '))).toBeNull();
  });

  it('rejects phone numbers not starting with 0 or not 10 digits', () => {
    expect(validator(new FormControl('84901234218'))).toEqual({ vnPhone: true });
    expect(validator(new FormControl('090123421'))).toEqual({ vnPhone: true });
    expect(validator(new FormControl('09012342189'))).toEqual({ vnPhone: true });
    expect(validator(new FormControl('090123421a'))).toEqual({ vnPhone: true });
  });

  it('normalizes and formats phone numbers properly', () => {
    expect(normalizeVnPhone('0901 234 218')).toBe('0901234218');
    expect(formatVnPhoneDisplay('0901234218')).toBe('0901 234 218');
  });
});
