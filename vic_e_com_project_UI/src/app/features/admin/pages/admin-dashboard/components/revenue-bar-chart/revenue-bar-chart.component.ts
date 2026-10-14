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

  private readonly maxAmount = 20; // 20 triệu đồng làm mốc trần 100%

  getBarHeightPercentage(amount: number): number {
    return Math.min(100, Math.round((amount / this.maxAmount) * 100));
  }

  formatAmount(amount: number): string {
    return amount.toString().replace('.', ',');
  }
}
