import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationStatus } from '../../models/seller-onboarding.model';

@Component({
  selector: 'app-status-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-timeline.component.html',
  styleUrl: './status-timeline.component.scss',
})
export class StatusTimelineComponent {
  @Input({ required: true }) status!: ApplicationStatus;
  @Input() submittedAt?: string;

  get step1Done(): boolean {
    return this.status !== 'NOT_STARTED' && this.status !== 'DRAFT';
  }

  get step2Active(): boolean {
    return this.status === 'PENDING';
  }

  get step2Warning(): boolean {
    return this.status === 'REVISION_NEEDED';
  }

  get step2Error(): boolean {
    return this.status === 'REJECTED';
  }

  get step2Done(): boolean {
    return this.status === 'APPROVED';
  }

  get step3Done(): boolean {
    return this.status === 'APPROVED';
  }
}
