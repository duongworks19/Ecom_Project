import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminReportsService } from '../../services/admin-reports.service';
import { AdminReportsData } from '../../models/admin-reports.model';
import { ReportsFilterBarComponent } from './components/reports-filter-bar/reports-filter-bar.component';
import { ReportsKpiComponent } from './components/reports-kpi/reports-kpi.component';
import { RevenueLineChartComponent } from './components/revenue-line-chart/revenue-line-chart.component';
import { TopProductsCardComponent } from './components/top-products-card/top-products-card.component';
import { TopVendorsCardComponent } from './components/top-vendors-card/top-vendors-card.component';
import { ExportDataCardComponent } from './components/export-data-card/export-data-card.component';

@Component({
  selector: 'vic-admin-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReportsFilterBarComponent,
    ReportsKpiComponent,
    RevenueLineChartComponent,
    TopProductsCardComponent,
    TopVendorsCardComponent,
    ExportDataCardComponent,
  ],
  templateUrl: './admin-reports.component.html',
  styleUrl: './admin-reports.component.scss',
})
export class AdminReportsComponent implements OnInit {
  private reportsService = inject(AdminReportsService);
  readonly reportsData = signal<AdminReportsData | null>(null);
  readonly filters = signal<{ vendors: {id:number;name:string}[]; categories:{id:number;name:string}[] }>({ vendors: [], categories: [] });

  ngOnInit(): void {
    this.loadData('7days');
    this.reportsService.getFilters().subscribe(filters => this.filters.set(filters));
  }

  onPeriodChanged(period: string): void {
    this.loadData(period);
  }
  onFilterChanged(filter: { vendorId?: number; categoryId?: number }): void { this.loadData('7days', filter.vendorId); }

  private loadData(period: string, vendorId?: number): void {
    this.reportsService.getReportsData(period, vendorId).subscribe({
      next: (data) => this.reportsData.set(data),
    });
  }
}
