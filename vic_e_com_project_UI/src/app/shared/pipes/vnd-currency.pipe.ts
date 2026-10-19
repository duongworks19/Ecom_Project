import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'vndCurrency',
  standalone: true,
})
export class VndCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return '0 ₫';
    }
    const formatted = Math.round(Number(value))
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formatted} ₫`;
  }
}
