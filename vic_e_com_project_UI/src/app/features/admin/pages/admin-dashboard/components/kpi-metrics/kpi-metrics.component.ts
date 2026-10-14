import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCard } from '../../../../models/admin-dashboard.model';

@Component({
  selector: 'vic-kpi-metrics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-metrics.component.html',
  styleUrl: './kpi-metrics.component.scss',
})
export class KpiMetricsComponent {
  @Input() kpis: KpiCard[] = [];
}
