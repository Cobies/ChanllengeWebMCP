import { Component, inject, computed, signal, Optional, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { WebMcpService } from '@webmcp/angular';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CopilotChatComponent } from './components/copilot-chat/copilot-chat.component';
import { ViewGuideModalComponent } from './components/view-guide-modal/view-guide-modal.component';
import { SidebarModuleRegistryService } from './services/sidebar-module-registry.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    CopilotChatComponent,
    ViewGuideModalComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly webmcp: WebMcpService;
  readonly sidebarRegistry: SidebarModuleRegistryService;
  readonly router?: Router;

  readonly currentUrl = signal<string>('/');

  readonly isFullBleedRoute = computed(() => {
    const url = this.currentUrl();
    const rawPath = url.split('?')[0].split('#')[0];
    const path = rawPath.replace(/\/+$/, '') || '/';
    return path === '/3d-showroom' || path === '/';
  });

  readonly mainMarginClass = computed(() => {
    const mode = this.sidebarRegistry?.dockMode?.() || 'expanded';
    if (mode === 'expanded') {
      return 'lg:pl-72';
    } else if (mode === 'rail') {
      return 'lg:pl-16';
    }
    return 'lg:pl-0';
  });

  constructor(
    @Optional() router?: Router,
    @Optional() sidebarRegistry?: SidebarModuleRegistryService,
    @Optional() webmcp?: WebMcpService,
    @Optional() destroyRef?: DestroyRef
  ) {
    if (router) {
      this.router = router;
    } else {
      try {
        this.router = inject(Router, { optional: true }) || undefined;
      } catch {
        this.router = undefined;
      }
    }

    if (sidebarRegistry) {
      this.sidebarRegistry = sidebarRegistry;
    } else {
      try {
        this.sidebarRegistry = inject(SidebarModuleRegistryService, { optional: true }) || new SidebarModuleRegistryService();
      } catch {
        this.sidebarRegistry = new SidebarModuleRegistryService();
      }
    }

    if (webmcp) {
      this.webmcp = webmcp;
    } else {
      try {
        this.webmcp = inject(WebMcpService, { optional: true }) || new WebMcpService();
      } catch {
        this.webmcp = new WebMcpService();
      }
    }

    let destroyRefResolved = destroyRef;
    if (!destroyRefResolved) {
      try {
        destroyRefResolved = inject(DestroyRef, { optional: true }) || undefined;
      } catch {
        destroyRefResolved = undefined;
      }
    }

    if (this.router) {
      if (this.router.url) {
        this.currentUrl.set(this.router.url);
      }
      if (this.router.events) {
        const events$ = this.router.events.pipe(
          filter((event): event is NavigationEnd => event instanceof NavigationEnd)
        );

        if (destroyRefResolved) {
          events$.pipe(takeUntilDestroyed(destroyRefResolved)).subscribe((event) => {
            this.currentUrl.set(event.urlAfterRedirects || event.url);
          });
        } else {
          try {
            events$.pipe(takeUntilDestroyed()).subscribe((event) => {
              this.currentUrl.set(event.urlAfterRedirects || event.url);
            });
          } catch {
            events$.subscribe((event) => {
              this.currentUrl.set(event.urlAfterRedirects || event.url);
            });
          }
        }
      }
    }
  }
}

