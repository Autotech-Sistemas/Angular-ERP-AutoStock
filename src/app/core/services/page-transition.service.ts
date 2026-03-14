import { Injectable, signal } from '@angular/core';

export type LoaderIcon = 'gear' | 'car' | 'motorcycle' | 'wrench' | 'box';

const ICONS: LoaderIcon[] = ['gear', 'car', 'motorcycle', 'wrench', 'box'];
let iconIndex = 0;

@Injectable({ providedIn: 'root' })
export class PageTransitionService {
  isTransitioning = signal(false);
  currentIcon     = signal<LoaderIcon>('gear');
  currentLabel    = signal('Carregando...');

  start(label = 'Carregando...'): void {
    this.currentIcon.set(ICONS[iconIndex % ICONS.length]);
    iconIndex++;
    this.currentLabel.set(label);
    this.isTransitioning.set(true);
  }

  end(): void {
    this.isTransitioning.set(false);
  }
}
