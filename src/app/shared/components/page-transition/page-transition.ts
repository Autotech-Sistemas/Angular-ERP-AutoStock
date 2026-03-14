import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageTransitionService, LoaderIcon } from '../../../core/services/page-transition.service';

@Component({
  selector: 'app-page-transition',
  imports: [CommonModule],
  templateUrl: './page-transition.html',
  styleUrl: './page-transition.css',
})
export class PageTransition {
  svc = inject(PageTransitionService);
}
