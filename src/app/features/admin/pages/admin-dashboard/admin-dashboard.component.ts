import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDashboardService } from '../../services/admin-dashboard.service';
import { AdminDashboardData } from '../../models/admin-dashboard.model';
import { KpiMetricsComponent } from './components/kpi-metrics/kpi-metrics.component';
import { OrderStatusChartComponent } from './components/order-status-chart/order-status-chart.component';
import { RevenueBarChartComponent } from './components/revenue-bar-chart/revenue-bar-chart.component';
import { RecentActivitiesComponent } from './components/recent-activities/recent-activities.component';

@Component({
  selector: 'vic-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    KpiMetricsComponent,
    OrderStatusChartComponent,
    RevenueBarChartComponent,
    RecentActivitiesComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private dashboardService = inject(AdminDashboardService);
  readonly dashboardData = signal<AdminDashboardData | null>(null);

  ngOnInit(): void {
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
      },
    });
  }
}

