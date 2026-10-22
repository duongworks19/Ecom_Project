import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderStatusStat } from '../../../../models/admin-dashboard.model';

interface SvgSlice {
  color: string;
  dashArray: string;
  dashOffset: number;
}

@Component({
  selector: 'vic-order-status-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-status-chart.component.html',
  styleUrl: './order-status-chart.component.scss',
})
export class OrderStatusChartComponent implements OnChanges {
  @Input() stats: OrderStatusStat[] = [];
  @Input() totalOrders: number = 0;

  svgSlices: SvgSlice[] = [];
  private readonly radius = 56;
  private readonly circumference = 2 * Math.PI * this.radius;

  ngOnChanges(): void {
    this.calculateSlices();
  }

  private calculateSlices(): void {
    if (!this.stats.length || this.totalOrders <= 0) {
      this.svgSlices = [];
      return;
    }

    let accumulatedOffset = 0;
    this.svgSlices = this.stats.map((stat) => {
      const sliceLength = (stat.count / this.totalOrders) * this.circumference;
      const dashArray = `${sliceLength} ${this.circumference - sliceLength}`;
      const dashOffset = -accumulatedOffset;
      accumulatedOffset += sliceLength;

      return {
        color: stat.color,
        dashArray,
        dashOffset,
      };
    });
  }
}
