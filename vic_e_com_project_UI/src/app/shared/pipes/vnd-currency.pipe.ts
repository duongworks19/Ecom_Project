import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'vndCurrency',
  standalone: true,
})
export class VndCurrencyPipe implements PipeTransform {
  private readonly numberFormat = new Intl.NumberFormat('vi-VN');

  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return '0 ₫';
    }
    const formatted = this.numberFormat.format(Math.round(Number(value)));
    return `${formatted} ₫`;
  }
}
