import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminTopbarComponent } from './components/admin-topbar/admin-topbar.component';
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';
import { ToastComponent } from '../../../../shared/ui/toast/toast.component';

@Component({
  selector: 'vic-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminTopbarComponent, AdminSidebarComponent, ToastComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {}
