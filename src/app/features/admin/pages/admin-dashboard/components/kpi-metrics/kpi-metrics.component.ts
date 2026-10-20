import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { KpiCard } from '../../../../models/admin-dashboard.model';

@Component({
  selector: 'vic-kpi-metrics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './kpi-metrics.component.html',
  styleUrl: './kpi-metrics.component.scss',
})
export class KpiMetricsComponent {
  @Input() kpis: KpiCard[] = [];

  getRouteForKpi(id: string): string | null {
    if (id === 'pending-vendors') return '/admin/vendors';
    if (id === 'ready-to-ship') return '/admin/shippers';
    return null;
  }
}
