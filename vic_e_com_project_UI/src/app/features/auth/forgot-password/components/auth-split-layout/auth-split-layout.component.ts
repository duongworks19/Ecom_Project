import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-split-layout',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './auth-split-layout.component.html',
  styleUrl: './auth-split-layout.component.scss',
})
export class AuthSplitLayoutComponent {
  @Input() currentStep: 1 | 2 | 3 = 1;
  @Input() backRoute = '/login';
  @Input() backLabel = 'Quay lại đăng nhập';
}
