import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './authentication/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    canMatch: [guestGuard],
    loadComponent: () => import('./authentication/pages/login/login').then((m) => m.Login),
    title: 'Entrar \u2014 AutoStock',
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/sidebar/sidebar').then((m) => m.Sidebar),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
        title: 'Dashboard \u2014 AutoStock',
        data: { icon: 'dashboard', label: 'Dashboard' },
      },
      {
        path: 'veiculos',
        loadComponent: () => import('./pages/vehicles/vehicles').then((m) => m.Vehicles),
        title: 'Ve\u00EDculos \u2014 AutoStock',
        data: { icon: 'car', label: 'Ve\u00EDculos' },
      },
      {
        path: 'estoque',
        loadComponent: () => import('./pages/inventory/inventory').then((m) => m.Inventory),
        title: 'Estoque \u2014 AutoStock',
        data: { icon: 'box', label: 'Estoque' },
      },
      {
        path: 'vendas',
        loadComponent: () => import('./pages/sales/sales').then((m) => m.Sales),
        title: 'Vendas \u2014 AutoStock',
        data: { icon: 'sale', label: 'Vendas' },
      },
      {
        path: 'contratos',
        loadComponent: () => import('./pages/contracts/contracts').then((m) => m.Contracts),
        title: 'Contratos \u2014 AutoStock',
        data: { icon: 'contract', label: 'Contratos' },
      },
      {
        path: 'clientes',
        loadComponent: () => import('./pages/customers/customers').then((m) => m.Customers),
        title: 'Clientes \u2014 AutoStock',
        data: { icon: 'customers', label: 'Clientes' },
      },
      {
        path: 'vendedores',
        loadComponent: () => import('./pages/sellers/sellers').then((m) => m.Sellers),
        title: 'Vendedores \u2014 AutoStock',
        data: { icon: 'seller', label: 'Vendedores' },
      },
      {
        path: 'filiais',
        loadComponent: () => import('./pages/branches/branches').then((m) => m.Branches),
        title: 'Filiais \u2014 AutoStock',
        data: { icon: 'branch', label: 'Filiais' },
      },
      {
        path: 'agendamentos',
        loadComponent: () =>
          import('./pages/appointments/appointments').then((m) => m.Appointments),
        title: 'Agendamentos \u2014 AutoStock',
        data: { icon: 'calendar', label: 'Agendamentos' },
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
