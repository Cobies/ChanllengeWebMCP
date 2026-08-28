import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'bun:test';
import { of } from 'rxjs';
import { WebMcpService } from '@webmcp/angular';
import { CopilotBridgeService, DEFAULT_FALLBACK_MODELS } from '../../services/copilot-bridge.service';
import { SidebarModuleRegistryService } from '../../services/sidebar-module-registry.service';
import { DEFAULT_SIDEBAR_MODULES } from '../../config/sidebar-modules.config';
import { CopilotChatComponent } from './copilot-chat.component';

describe('CopilotChatComponent UI & Interactions', () => {
  let bridgeService: CopilotBridgeService;
  let webmcpService: WebMcpService;
  let registry: SidebarModuleRegistryService;
  let component: CopilotChatComponent;
  let sentPrompts: string[] = [];

  beforeEach(() => {
    webmcpService = new WebMcpService({
      enableEmulatorFallback: true,
      logExecutionToConsole: false,
    });

    registry = new SidebarModuleRegistryService(DEFAULT_SIDEBAR_MODULES, webmcpService);
    registry.setActiveRoute('/3d-showroom');

    const mockHttp = {
      get: () => of({ data: DEFAULT_FALLBACK_MODELS }),
      post: () => of({ choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'Echo' } }] }),
    };

    bridgeService = new CopilotBridgeService(mockHttp as any, webmcpService, registry);
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

    component = new CopilotChatComponent(bridgeService, registry);
  });

  it('should initialize with predefined quick prompt chips for 3D showroom', () => {
    const chips = component.promptChips();
    expect(chips.length).toBeGreaterThanOrEqual(4);
    expect(chips.some((c) => c.prompt.includes('screenshot') || c.prompt.includes('Snapshot'))).toBe(true);
    expect(chips.some((c) => c.prompt.includes('Orbit') || c.prompt.includes('orbit'))).toBe(true);
  });

  it('should reactively switch prompt chips when active route changes to /enterprise-bi', () => {
    registry.setActiveRoute('/enterprise-bi');

    const chips = component.promptChips();
    expect(chips.length).toBeGreaterThanOrEqual(3);
    expect(chips.some((c) => c.prompt.includes('enterprise metrics') || c.prompt.includes('telemetry'))).toBe(true);
    expect(chips.some((c) => c.prompt.includes('transactions') || c.prompt.includes('audit'))).toBe(true);
    expect(chips.some((c) => c.prompt.includes('inventory') || c.prompt.includes('Reorder'))).toBe(true);
  });

  it('should reactively switch prompt chips when active route changes to /judge-guide and /inspector', () => {
    registry.setActiveRoute('/judge-guide');
    expect(component.promptChips().some((c) => c.label.includes('Devpost') || c.prompt.includes('rubric') || c.prompt.includes('compliance'))).toBe(true);

    registry.setActiveRoute('/inspector');
    expect(component.promptChips().some((c) => c.label.includes('Telemetry') || c.prompt.includes('latency') || c.prompt.includes('logs'))).toBe(true);
  });

  it('should dispatch prompt when prompt chip is selected', async () => {
    const chip = component.promptChips()[0];
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

  it('should support messages with thinking and tool execution metadata', () => {
    bridgeService.messages.set([
      {
        id: 'msg-think-1',
        role: 'assistant',
        content: 'Action completed.',
        thinking: 'I need to rotate 45 degrees and then take screenshot.',
        timestamp: Date.now(),
      },
      {
        id: 'msg-tool-1',
        role: 'tool',
        name: 'take_screenshot',
        content: '{"success": true}',
        toolExecution: {
          toolName: 'take_screenshot',
          params: {},
          durationMs: 14.5,
          status: 'success',
        },
        timestamp: Date.now(),
      },
    ]);

    expect(bridgeService.messages().length).toBe(2);
    expect(bridgeService.messages()[0].thinking).toBe('I need to rotate 45 degrees and then take screenshot.');
    expect(bridgeService.messages()[1].toolExecution?.status).toBe('success');
    expect(bridgeService.messages()[1].toolExecution?.durationMs).toBe(14.5);
  });

  describe('formatMessageContent Markdown Parsing & XSS Sanitization', () => {
    it('should return empty string for null, undefined, or empty string', () => {
      expect(component.formatMessageContent(null)).toBe('');
      expect(component.formatMessageContent(undefined)).toBe('');
      expect(component.formatMessageContent('')).toBe('');
    });

    it('should sanitize raw HTML to prevent XSS vulnerabilities', () => {
      const input = '<script>alert("xss")</script><img src="x" onerror="steal()"/>';
      const output = component.formatMessageContent(input);

      expect(output).not.toContain('<script>');
      expect(output).not.toContain('<img');
      expect(output).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(output).toContain('&lt;img src=&quot;x&quot; onerror=&quot;steal()&quot;/&gt;');
    });

    it('should eliminate raw markdown hashes and convert headings to styled headers', () => {
      const input = '# Main Title\n## Sub Section\n### Detail Header\n#### Sub Detail';
      const output = component.formatMessageContent(input);

      expect(output).not.toContain('# Main Title');
      expect(output).not.toContain('## Sub Section');
      expect(output).not.toContain('### Detail Header');
      expect(output).not.toContain('#### Sub Detail');
      expect(output).toContain('<div class="font-bold text-slate-900 text-xs mt-2 mb-1">Main Title</div>');
      expect(output).toContain('<div class="font-bold text-slate-900 text-xs mt-2 mb-1">Sub Section</div>');
      expect(output).toContain('<div class="font-bold text-slate-900 text-xs mt-2 mb-1">Detail Header</div>');
      expect(output).toContain('<div class="font-bold text-slate-900 text-xs mt-2 mb-1">Sub Detail</div>');
    });

    it('should convert bold and italic markdown to strong and em tags', () => {
      const input = 'This is **bold text** and this is *italic text* with _alternative italic_.';
      const output = component.formatMessageContent(input);

      expect(output).toContain('<strong class="font-semibold text-slate-900">bold text</strong>');
      expect(output).toContain('<em>italic text</em>');
      expect(output).toContain('<em>alternative italic</em>');
    });

    it('should convert bullet lists and numbered lists into styled <ul> and <ol> elements', () => {
      const input = '- Item A\n- Item B\n* Item C\n\n1. First Step\n2. Second Step';
      const output = component.formatMessageContent(input);

      expect(output).toContain('<ul class="list-disc list-inside my-1 space-y-0.5 text-slate-800">');
      expect(output).toContain('<li class="ml-1">Item A</li>');
      expect(output).toContain('<li class="ml-1">Item B</li>');
      expect(output).toContain('<li class="ml-1">Item C</li>');
      expect(output).toContain('</ul>');

      expect(output).toContain('<ol class="list-decimal list-inside my-1 space-y-0.5 text-slate-800">');
      expect(output).toContain('<li class="ml-1">First Step</li>');
      expect(output).toContain('<li class="ml-1">Second Step</li>');
      expect(output).toContain('</ol>');
    });

    it('should convert inline code and fenced code blocks with styling', () => {
      const input = 'Use `cad_measure()` tool.\n\n```json\n{\n  "status": "ok"\n}\n```';
      const output = component.formatMessageContent(input);

      expect(output).toContain('<code class="px-1 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-cyan-800 border border-slate-200">cad_measure()</code>');
      expect(output).toContain('<pre class="my-2 p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto"><code>{\n  &quot;status&quot;: &quot;ok&quot;\n}</code></pre>');
    });

    it('should protect markdown characters inside code blocks from being parsed as formatting', () => {
      const input = '```markdown\n# Not A Header\n- Not A List\n**Not Bold**\n```';
      const output = component.formatMessageContent(input);

      expect(output).toContain('<pre class="my-2 p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto"><code># Not A Header\n- Not A List\n**Not Bold**</code></pre>');
      expect(output).not.toContain('<div class="font-bold text-slate-900 text-xs mt-2 mb-1">Not A Header</div>');
      expect(output).not.toContain('<li class="ml-1">Not A List</li>');
      expect(output).not.toContain('<strong');
    });

    it('should properly handle newlines and paragraph breaks', () => {
      const input = 'Line 1\nLine 2\n\nParagraph 2';
      const output = component.formatMessageContent(input);

      expect(output).toContain('Line 1<br/>Line 2');
      expect(output).toContain('<div class="my-1.5"></div>');
      expect(output).toContain('Paragraph 2');
    });
  });
});
