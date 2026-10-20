import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'vic-reports-filter-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports-filter-bar.component.html',
  styleUrl: './reports-filter-bar.component.scss',
})
export class ReportsFilterBarComponent {
  @Output() periodChange = new EventEmitter<string>();

  periods = [
    { id: 'today', label: 'Hôm nay' },
    { id: '7days', label: '7 ngày' },
    { id: '30days', label: '30 ngày' },
    { id: 'this_month', label: 'Tháng này' },
    { id: 'custom', label: 'Tùy chọn' },
  ];

  selectedPeriod = signal<string>('7days');

  selectPeriod(periodId: string): void {
    this.selectedPeriod.set(periodId);
    this.periodChange.emit(periodId);
  }
}
