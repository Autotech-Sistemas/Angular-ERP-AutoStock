import { Injectable, signal, computed } from '@angular/core';

export interface AppState {
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
  currentRoute: string;
}

@Injectable({ providedIn: 'root' })
export class AppStore {
  private _state = signal<AppState>({
    sidebarOpen: false,
    theme: 'dark',
    currentRoute: '/dashboard',
  });

  // Selectors
  readonly sidebarOpen = computed(() => this._state().sidebarOpen);
  readonly theme = computed(() => this._state().theme);
  readonly currentRoute = computed(() => this._state().currentRoute);

  // Actions
  toggleSidebar(): void {
    this._state.update((s) => ({ ...s, sidebarOpen: !s.sidebarOpen }));
  }

  setSidebar(open: boolean): void {
    this._state.update((s) => ({ ...s, sidebarOpen: open }));
  }

  setTheme(theme: 'dark' | 'light'): void {
    this._state.update((s) => ({ ...s, theme }));
  }

  setRoute(route: string): void {
    this._state.update((s) => ({ ...s, currentRoute: route }));
  }
}
