import { Injectable, signal } from '@angular/core';

export type ViewGuideTab = '3d-showroom' | 'enterprise-bi' | 'inspector' | 'judge-guide' | 'copilot';

@Injectable({
  providedIn: 'root',
})
export class ViewGuideService {
  readonly isOpen = signal<boolean>(false);
  readonly activeTab = signal<ViewGuideTab>('3d-showroom');

  openGuide(tab?: ViewGuideTab): void {
    if (tab) {
      this.activeTab.set(tab);
    }
    this.isOpen.set(true);
  }

  closeGuide(): void {
    this.isOpen.set(false);
  }

  toggleGuide(tab?: ViewGuideTab): void {
    if (this.isOpen()) {
      this.closeGuide();
    } else {
      this.openGuide(tab);
    }
  }
}
