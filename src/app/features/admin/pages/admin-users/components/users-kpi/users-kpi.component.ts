import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerKpiCard } from '../../../../models/admin-users.model';

@Component({
  selector: 'vic-users-kpi',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-kpi.component.html',
  styleUrl: './users-kpi.component.scss',
})
export class UsersKpiComponent {
  @Input() kpis: CustomerKpiCard[] = [];
}
