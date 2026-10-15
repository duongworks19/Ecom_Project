import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailyRevenue } from '../../../../models/admin-dashboard.model';

@Component({
  selector: 'vic-revenue-bar-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './revenue-bar-chart.component.html',
  styleUrl: './revenue-bar-chart.component.scss',
})
export class RevenueBarChartComponent {
  @Input() revenueData: DailyRevenue[] = [];

  get maxAmount(): number {
    const maxVal = Math.max(0, ...this.revenueData.map((d) => d.amount));
    return maxVal > 0 ? maxVal : 1;
  }

  getBarHeightPercentage(amount: number): number {
    if (amount <= 0) return 0;
    return Math.min(100, Math.round((amount / this.maxAmount) * 100));
  }

  formatAmount(amount: number): string {
    return amount.toString().replace('.', ',');
  }
}
