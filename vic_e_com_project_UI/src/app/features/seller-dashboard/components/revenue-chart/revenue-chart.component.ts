import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import {
  ChartPointSvg,
  RevenuePoint,
} from '../../models/seller-dashboard.model';

@Component({
  selector: 'app-revenue-chart',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './revenue-chart.component.html',
  styleUrl: './revenue-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevenueChartComponent {
  readonly selectedRange = input.required<'7' | '30'>();
  readonly chart7Days = input.required<RevenuePoint[]>();
  readonly chart30Days = input.required<RevenuePoint[]>();

  readonly rangeChange = output<'7' | '30'>();

  readonly activeHoverPoint = signal<ChartPointSvg | null>(null);

  readonly svgWidth = 560;
  readonly svgHeight = 220;
  readonly paddingLeft = 38;
  readonly paddingRight = 16;
  readonly paddingTop = 20;
  readonly paddingBottom = 28;
  readonly maxValue = 6;

  readonly gridLines = [
    { value: 6, label: '6tr' },
    { value: 4, label: '4tr' },
    { value: 2, label: '2tr' },
    { value: 0, label: '0tr' },
  ];

  readonly chartData = computed(() =>
    this.selectedRange() === '7' ? this.chart7Days() : this.chart30Days()
  );

  getY(val: number): number {
    const chartHeight = this.svgHeight - this.paddingTop - this.paddingBottom;
    return (
      this.svgHeight - this.paddingBottom - (val / this.maxValue) * chartHeight
    );
  }

  getX(index: number, total: number): number {
    const chartWidth = this.svgWidth - this.paddingLeft - this.paddingRight;
    if (total <= 1) return this.paddingLeft;
    return this.paddingLeft + (index * chartWidth) / (total - 1);
  }

  readonly chartPoints = computed<ChartPointSvg[]>(() => {
    const list = this.chartData();
    if (!list || list.length === 0) return [];
    const total = list.length;
    return list.map((item, i) => ({
      x: this.getX(i, total),
      y: this.getY(item.valueInMillions),
      label: item.label,
      value: item.valueInMillions,
      exactRevenue: item.exactRevenue,
      orderCount: item.orderCount,
    }));
  });

  readonly polylinePoints = computed<string>(() =>
    this.chartPoints()
      .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ')
  );

  readonly polygonAreaPoints = computed<string>(() => {
    const pts = this.chartPoints();
    if (pts.length === 0) return '';
    const bottomY = this.svgHeight - this.paddingBottom;
    const firstX = pts[0].x.toFixed(1);
    const lastX = pts[pts.length - 1].x.toFixed(1);
    const linePart = pts
      .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');
    return `${firstX},${bottomY} ${linePart} ${lastX},${bottomY}`;
  });

  readonly lastPoint = computed<ChartPointSvg | null>(() => {
    const pts = this.chartPoints();
    return pts.length > 0 ? pts[pts.length - 1] : null;
  });

  onTabChange(range: '7' | '30'): void {
    this.activeHoverPoint.set(null);
    this.rangeChange.emit(range);
  }

  onHoverPoint(point: ChartPointSvg): void {
    this.activeHoverPoint.set(point);
  }

  onLeaveChart(): void {
    this.activeHoverPoint.set(null);
  }
}
