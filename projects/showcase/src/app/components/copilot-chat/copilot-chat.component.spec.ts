import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'bun:test';
import { of } from 'rxjs';
import { WebMcpService } from '@webmcp/angular';
import { CopilotBridgeService, DEFAULT_FALLBACK_MODELS } from '../../services/copilot-bridge.service';
import { CopilotChatComponent } from './copilot-chat.component';

describe('CopilotChatComponent UI & Interactions', () => {
  let bridgeService: CopilotBridgeService;
  let webmcpService: WebMcpService;
  let component: CopilotChatComponent;
  let sentPrompts: string[] = [];

  beforeEach(() => {
    webmcpService = new WebMcpService({
      enableEmulatorFallback: true,
      logExecutionToConsole: false,
    });

    const mockHttp = {
      get: () => of({ data: DEFAULT_FALLBACK_MODELS }),
      post: () => of({ choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'Echo' } }] }),
    };

    bridgeService = new CopilotBridgeService(mockHttp as any, webmcpService);
    sentPrompts = [];

    // Spy on sendMessage
    bridgeService.sendMessage = async (prompt: string) => {
      sentPrompts.push(prompt);
      bridgeService.messages.update((prev) => [
        ...prev,
        { id: 'user-1', role: 'user', content: prompt, timestamp: Date.now() },
        { id: 'ast-1', role: 'assistant', content: 'Response to ' + prompt, timestamp: Date.now() },
      ]);
    };

    component = new CopilotChatComponent(bridgeService);
  });

  it('should initialize with predefined quick prompt chips', () => {
    expect(component.promptChips.length).toBeGreaterThanOrEqual(4);
    expect(component.promptChips.some((c) => c.prompt.includes('screenshot'))).toBe(true);
    expect(component.promptChips.some((c) => c.prompt.includes('Orbit') || c.prompt.includes('orbit'))).toBe(true);
  });

  it('should dispatch prompt when prompt chip is selected', async () => {
    const chip = component.promptChips[0];
    await component.selectPromptChip(chip);

    expect(sentPrompts.length).toBe(1);
    expect(sentPrompts[0]).toBe(chip.prompt);
  });

  it('should submit message and clear current input text', async () => {
    component.inputText = 'Change vehicle color to Crimson';
    await component.submitMessage();

    expect(sentPrompts.length).toBe(1);
    expect(sentPrompts[0]).toBe('Change vehicle color to Crimson');
    expect(component.inputText).toBe('');
  });

  it('should not submit message when input is empty or whitespace', async () => {
    component.inputText = '   ';
    await component.submitMessage();
    expect(sentPrompts.length).toBe(0);
  });

  it('should toggle drawer open, minimized, and closed states', () => {
    expect(bridgeService.isOpen()).toBe(false);

    component.openDrawer();
    expect(bridgeService.isOpen()).toBe(true);

    component.toggleMinimize();
    expect(bridgeService.isMinimized()).toBe(true);

    component.closeDrawer();
    expect(bridgeService.isOpen()).toBe(false);
  });

  it('should handle model selection change', () => {
    component.onModelChange('gemini-2.5-pro');
    expect(bridgeService.selectedModel()).toBe('gemini-2.5-pro');
  });

  it('should open and close image modal lightbox', () => {
    expect(component.previewImageUrl()).toBeNull();

    const sampleUrl = 'data:image/png;base64,SAMPLE';
    component.openImageModal(sampleUrl);
    expect(component.previewImageUrl()).toBe(sampleUrl);

    component.closeImageModal();
    expect(component.previewImageUrl()).toBeNull();
  });

  it('should clear conversation history', () => {
    bridgeService.messages.set([
      { id: '1', role: 'user', content: 'Test', timestamp: Date.now() },
    ]);
    expect(bridgeService.messages().length).toBe(1);

    component.clearChat();
    expect(bridgeService.messages().length).toBe(0);
  });
});
