import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportKpiCard } from '../../../../models/admin-reports.model';

@Component({
  selector: 'vic-reports-kpi',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports-kpi.component.html',
  styleUrl: './reports-kpi.component.scss',
})
export class ReportsKpiComponent {
  @Input() kpis: ReportKpiCard[] = [];
}
