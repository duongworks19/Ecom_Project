import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RevenueTrendPoint } from '../../../../models/admin-reports.model';

@Component({
  selector: 'vic-revenue-line-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './revenue-line-chart.component.html',
  styleUrl: './revenue-line-chart.component.scss',
})
export class RevenueLineChartComponent {
  @Input() trendPoints: RevenueTrendPoint[] = [];

  readonly yGrids = [
    { value: 20, y: 30 },
    { value: 15, y: 70 },
    { value: 10, y: 110 },
    { value: 5, y: 150 },
    { value: 0, y: 190 },
  ];

  getX(index: number): number {
    return 65 + index * 98;
  }

  getY(val: number): number {
    return 190 - (val / 20) * 160;
  }

  get currentPolyline(): string {
    return this.trendPoints.map((pt, i) => `${this.getX(i)},${this.getY(pt.currentAmount)}`).join(' ');
  }

  get previousPolyline(): string {
    return this.trendPoints.map((pt, i) => `${this.getX(i)},${this.getY(pt.previousAmount)}`).join(' ');
  }

  formatAmount(val: number): string {
    return val.toString().replace('.', ',');
  }
}
