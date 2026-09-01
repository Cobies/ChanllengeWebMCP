// @ts-nocheck
import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'bun:test';
import { JudgeGuideComponent } from './judge-guide.component';

describe('JudgeGuideComponent', () => {
  let component: JudgeGuideComponent;
  let mockRouter: any;
  let mockWebMcp: any;
  let mockCopilot: any;

  beforeEach(() => {
    mockRouter = {
      navigateByUrl: (url: string) => {
        mockRouter.lastNavigated = url;
        return Promise.resolve(true);
      },
      lastNavigated: '',
    };

    mockWebMcp = {
      getTools: () => [
        { name: 'scene_3d_action', description: '3D tool' },
        { name: 'query_enterprise_metrics', description: 'Metrics tool' },
      ],
    };

    mockCopilot = {
      isOpen: {
        value: false,
        set: (v: boolean) => {
          mockCopilot.isOpen.value = v;
        },
      },
      isMinimized: {
        value: false,
        set: (v: boolean) => {
          mockCopilot.isMinimized.value = v;
        },
      },
      lastSentMessage: '',
      sendMessage: (msg: string) => {
        mockCopilot.lastSentMessage = msg;
      },
    };

    component = new JudgeGuideComponent(mockRouter, mockWebMcp, mockCopilot);
  });

  it('should initialize and default to rubric tab', () => {
    expect(component).toBeTruthy();
    expect(component.activeTab()).toBe('rubric');
  });

  it('should compute active registered tools count correctly', () => {
    expect(component.registeredToolsCount()).toBe(2);
  });

  it('should navigate to routes on demand', () => {
    component.navigateTo('/3d-showroom');
    expect(mockRouter.lastNavigated).toBe('/3d-showroom');
  });

  it('should open copilot and dispatch prompt', () => {
    const prompt = 'Test evaluation prompt';
    component.openCopilotWithPrompt(prompt);
    expect(mockCopilot.isOpen.value).toBe(true);
    expect(mockCopilot.isMinimized.value).toBe(false);
    expect(mockCopilot.lastSentMessage).toBe(prompt);
  });

  it('should switch tabs reactively', () => {
    component.activeTab.set('copilot');
    expect(component.activeTab()).toBe('copilot');

    component.activeTab.set('enterprise');
    expect(component.activeTab()).toBe('enterprise');
  });
});
