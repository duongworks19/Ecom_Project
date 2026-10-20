import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecentActivity } from '../../../../models/admin-dashboard.model';

@Component({
  selector: 'vic-recent-activities',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recent-activities.component.html',
  styleUrl: './recent-activities.component.scss',
})
export class RecentActivitiesComponent {
  @Input() activities: RecentActivity[] = [];
}
