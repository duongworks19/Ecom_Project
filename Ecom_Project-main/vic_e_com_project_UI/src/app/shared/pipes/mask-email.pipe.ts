import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'maskEmail',
  standalone: true,
})
export class MaskEmailPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const trimmed = value.trim();
    const atIndex = trimmed.indexOf('@');
    if (atIndex <= 0) {
      return trimmed;
    }
    const local = trimmed.slice(0, atIndex);
    const domain = trimmed.slice(atIndex);
    if (local.length <= 2) {
      return `${local.charAt(0)}***${domain}`;
    }
    const prefix = local.slice(0, 2);
    const maskedLength = Math.max(local.length - 2, 3);
    return `${prefix}${'*'.repeat(maskedLength)}${domain}`;
  }
}
