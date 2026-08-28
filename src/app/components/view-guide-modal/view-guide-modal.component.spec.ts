import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'bun:test';
import { ViewGuideService } from '../../services/view-guide.service';

describe('ViewGuideService & ViewGuideModal Logic', () => {
  let guideService: ViewGuideService;

  beforeEach(() => {
    guideService = new ViewGuideService();
  });

  it('should initialize with closed modal state and default 3d-showroom tab', () => {
    expect(guideService.isOpen()).toBe(false);
    expect(guideService.activeTab()).toBe('3d-showroom');
  });

  it('should open guide with specified tab', () => {
    guideService.openGuide('enterprise-bi');
    expect(guideService.isOpen()).toBe(true);
    expect(guideService.activeTab()).toBe('enterprise-bi');
  });

  it('should close guide cleanly', () => {
    guideService.openGuide('inspector');
    expect(guideService.isOpen()).toBe(true);
    guideService.closeGuide();
    expect(guideService.isOpen()).toBe(false);
  });

  it('should toggle guide state', () => {
    guideService.toggleGuide('judge-guide');
    expect(guideService.isOpen()).toBe(true);
    expect(guideService.activeTab()).toBe('judge-guide');

    guideService.toggleGuide();
    expect(guideService.isOpen()).toBe(false);
  });
});
