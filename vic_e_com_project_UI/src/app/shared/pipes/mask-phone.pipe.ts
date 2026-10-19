import { Pipe, PipeTransform } from '@angular/core';
import { formatVnPhoneDisplay, normalizeVnPhone } from '../validators/vn-phone.validator';

@Pipe({
  name: 'maskPhone',
  standalone: true,
})
export class MaskPhonePipe implements PipeTransform {
  transform(value: string | null | undefined, mode: 'format' | 'mask' = 'format'): string {
    if (!value) {
      return '';
    }
    const digits = normalizeVnPhone(value);
    if (mode === 'mask' && digits.length >= 7) {
      return `${digits.slice(0, 3)}****${digits.slice(-3)}`;
    }
    return formatVnPhoneDisplay(value);
  }
}
