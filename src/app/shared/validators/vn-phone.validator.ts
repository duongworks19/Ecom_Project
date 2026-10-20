import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function normalizeVnPhone(raw: string | null | undefined): string {
  return (raw ?? '').replace(/\s+/g, '');
}

export function formatVnPhoneDisplay(raw: string | null | undefined): string {
  const digits = normalizeVnPhone(raw);
  if (/^0\d{9}$/.test(digits)) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return (raw ?? '').trim();
}

export function vnPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value as string | null | undefined;
    const normalized = normalizeVnPhone(raw);
    if (!normalized) {
      return null;
    }
    return /^0\d{9}$/.test(normalized) ? null : { vnPhone: true };
  };
}
