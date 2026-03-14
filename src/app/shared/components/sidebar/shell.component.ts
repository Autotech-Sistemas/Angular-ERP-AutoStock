import { Component, inject, signal, OnInit, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { ToastComponent } from '../toast/toast.component';
import { PageTransitionComponent } from '../page-transition/page-transition.component';
import { AuthService } from '../../../authentication/services/auth.service';
import { PageTransitionService } from '../../../core/services/page-transition.service';
import { NavItem } from '../../interfaces/models.interface';
import Swal from 'sweetalert2';

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard',       label: 'Dashboard',       icon: 'dashboard', section: 'Principal'  },
  { path: '/veiculos',        label: 'Veículos',         icon: 'car',       section: 'Vendas'     },
  { path: '/estoque',         label: 'Estoque',          icon: 'box',       section: 'Vendas'     },
  { path: '/vendas',          label: 'Vendas',           icon: 'sale',      section: 'Vendas'     },
  { path: '/contratos',       label: 'Contratos',        icon: 'contract',  section: 'Vendas'     },
  { path: '/clientes',        label: 'Clientes',         icon: 'customers', section: 'Cadastros'  },
  { path: '/vendedores',      label: 'Vendedores',       icon: 'seller',    section: 'Cadastros'  },
  { path: '/filiais',         label: 'Filiais',          icon: 'branch',    section: 'Cadastros'  },
  { path: '/agendamentos',    label: 'Agendamentos',     icon: 'calendar',  section: 'Sistema'    },
  { path: '/administradores', label: 'Administradores',  icon: 'shield',    section: 'Sistema'    },
  { path: '/arquivos',        label: 'Arquivos',         icon: 'upload',    section: 'Sistema'    },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    ThemeToggleComponent, ToastComponent, PageTransitionComponent,
  ],
  template: `
    <!-- Page transition overlay -->
    <app-page-transition/>

    <!-- Toast notifications -->
    <app-toast/>

    <!-- Mobile overlay -->
    @if (sidebarOpen() && isMobile()) {
      <div class="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
           (click)="sidebarOpen.set(false)" aria-hidden="true"></div>
    }

    <!-- Sidebar -->
    <aside class="sidebar" [class.open]="sidebarOpen()"
           role="navigation" aria-label="Menu principal">
      <!-- Logo -->
      <div class="px-4 py-5 border-b flex items-center gap-3" style="border-color: var(--surface-border)">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
             style="background: linear-gradient(135deg, var(--brand), var(--brand-dark))">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true">
            <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m-4 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
        </div>
        <div>
          <span class="font-heading font-black text-base tracking-tight"
                style="color: var(--text-primary)">Auto<span style="color: var(--brand)">Stock</span></span>
          <div class="text-xs" style="color: var(--text-muted); font-family: 'DM Sans', sans-serif">ERP Concessionária</div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto py-3" aria-label="Seções do sistema">
        @for (section of sections; track section) {
          <div class="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] font-heading"
               style="color: var(--text-muted)">{{ section }}</div>
          @for (item of navBySection(section); track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active"
               class="nav-item" (click)="onNavClick(item.label)"
               [attr.aria-label]="item.label">
              <span class="nav-icon w-4 h-4 flex-shrink-0" aria-hidden="true"
                    [innerHTML]="getIcon(item.icon)"></span>
              <span>{{ item.label }}</span>
            </a>
          }
        }
      </nav>

      <!-- User -->
      <div class="p-4 border-t" style="border-color: var(--surface-border)">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
               style="background: linear-gradient(135deg, var(--brand), var(--brand-dark))"
               aria-hidden="true">
            {{ userInitial() }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold truncate" style="color: var(--text-primary); font-family: 'Syne', sans-serif">
              {{ auth.currentUser()?.name ?? 'Admin' }}
            </div>
            <div class="text-xs truncate" style="color: var(--text-muted)">
              {{ auth.currentUser()?.email }}
            </div>
          </div>
          <button (click)="confirmLogout()"
                  class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style="color: var(--text-muted)"
                  title="Sair" aria-label="Sair do sistema">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="main-content" [class.expanded]="isMobile()">
      <!-- Topbar -->
      <header class="topbar" role="banner">
        <div class="flex items-center gap-3">
          <button class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                  style="background: var(--surface-tertiary); border: 1px solid var(--surface-border); color: var(--text-secondary)"
                  (click)="sidebarOpen.update(v => !v)"
                  aria-label="Alternar menu lateral">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div>
            <h1 class="font-heading font-semibold text-sm" style="color: var(--text-primary)">{{ currentLabel() }}</h1>
            <div class="text-xs" style="color: var(--text-muted)">{{ todayDate }}</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <!-- Online indicator -->
          <div class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
               style="background: rgba(22,163,74,0.1); color: var(--success); border: 1px solid rgba(22,163,74,0.2)">
            <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" aria-hidden="true"></span>
            API Online
          </div>
          <app-theme-toggle/>
        </div>
      </header>

      <!-- Page content -->
      <main id="main-content" tabindex="-1">
        <router-outlet/>
      </main>
    </div>
  `,
})
export class ShellComponent implements OnInit {
  auth        = inject(AuthService);
  transition  = inject(PageTransitionService);
  private router = inject(Router);

  sidebarOpen = signal(false);
  currentLabel = signal('Dashboard');
  isMobile    = signal(false);

  readonly sections = ['Principal', 'Vendas', 'Cadastros', 'Sistema'];

  readonly todayDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  private readonly labelMap: Record<string, string> = {
    '/dashboard': 'Dashboard', '/veiculos': 'Veículos', '/estoque': 'Estoque',
    '/vendas': 'Vendas', '/contratos': 'Contratos', '/clientes': 'Clientes',
    '/vendedores': 'Vendedores', '/filiais': 'Filiais',
    '/agendamentos': 'Agendamentos', '/administradores': 'Administradores',
    '/arquivos': 'Arquivos',
  };

  private readonly loaderLabels: Record<string, string> = {
    '/dashboard': 'Carregando dashboard...', '/veiculos': 'Buscando veículos...',
    '/estoque': 'Verificando estoque...', '/vendas': 'Carregando vendas...',
    '/contratos': 'Abrindo contratos...', '/clientes': 'Buscando clientes...',
    '/vendedores': 'Carregando equipe...', '/filiais': 'Buscando filiais...',
    '/agendamentos': 'Verificando agenda...', '/administradores': 'Acessando administradores...',
    '/arquivos': 'Carregando arquivos...',
  };

  ngOnInit(): void {
    this.checkMobile();
    this.router.events.subscribe(ev => {
      if (ev instanceof NavigationStart) {
        const label = this.loaderLabels[ev.url] ?? 'Carregando...';
        this.transition.start(label);
      }
      if (ev instanceof NavigationEnd || ev instanceof NavigationCancel || ev instanceof NavigationError) {
        setTimeout(() => this.transition.end(), 350);
        this.currentLabel.set(this.labelMap[ev.url] ?? 'AutoStock');
      }
    });
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile.set(window.innerWidth < 768);
    if (!this.isMobile()) this.sidebarOpen.set(false);
  }

  onNavClick(label: string): void {
    this.currentLabel.set(label);
    if (this.isMobile()) this.sidebarOpen.set(false);
  }

  navBySection(section: string): NavItem[] {
    return NAV_ITEMS.filter(n => n.section === section);
  }

  userInitial(): string {
    return (this.auth.currentUser()?.name ?? 'A')[0].toUpperCase();
  }

  async confirmLogout(): Promise<void> {
    const r = await Swal.fire({
      title: 'Sair do sistema?',
      text: 'Você será redirecionado para o login.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, sair',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ea580c',
    });
    if (r.isConfirmed) this.auth.logout();
  }

  getIcon(icon: string): string {
    const icons: Record<string, string> = {
      dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
      car:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m-4 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>`,
      box:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`,
      sale:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>`,
      contract:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
      customers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
      seller:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      branch:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      calendar:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      shield:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
      upload:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
    };
    return icons[icon] ?? icons['dashboard'];
  }
}
