import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'vic-admin-topbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-topbar.component.html',
  styleUrl: './admin-topbar.component.scss',
})
export class AdminTopbarComponent { }
