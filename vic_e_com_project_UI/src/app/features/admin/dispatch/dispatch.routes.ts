import { Routes } from '@angular/router';

export const DISPATCH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dispatch-page/dispatch-page.component').then(
        (m) => m.DispatchPageComponent
      ),
    title: 'Gán shipper & vận đơn — VIC MART Admin',
  },
];
