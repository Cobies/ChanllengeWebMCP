import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'bun:test';
import { of } from 'rxjs';
import { WebMcpService } from '@webmcp/angular';
import {
  CopilotBridgeService,
  DEFAULT_FALLBACK_MODELS,
} from '../../services/copilot-bridge.service';
import { SidebarModuleRegistryService } from '../../services/sidebar-module-registry.service';
import { DEFAULT_SIDEBAR_MODULES } from '../../config/sidebar-modules.config';
import {
  CopilotChatComponent,
  DEFAULT_CHAT_WIDTH,
  DEFAULT_CHAT_HEIGHT,
  MIN_CHAT_WIDTH,
  MIN_CHAT_HEIGHT,
  PRESET_COMPACT_WIDTH,
  PRESET_COMPACT_HEIGHT,
  PRESET_WIDE_WIDTH,
  PRESET_WIDE_HEIGHT,
  STORAGE_KEY_WIDTH,
  STORAGE_KEY_HEIGHT,
} from './copilot-chat.component';

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
      post: () =>
        of({
          choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'Echo' } }],
        }),
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
    expect(
      chips.some((c) => c.prompt.includes('screenshot') || c.prompt.includes('Snapshot')),
    ).toBe(true);
    expect(chips.some((c) => c.prompt.includes('Orbit') || c.prompt.includes('orbit'))).toBe(true);
  });

  it('should reactively switch prompt chips when active route changes to /enterprise-bi', () => {
    registry.setActiveRoute('/enterprise-bi');

    const chips = component.promptChips();
    expect(chips.length).toBeGreaterThanOrEqual(3);
    expect(
      chips.some((c) => c.prompt.includes('enterprise metrics') || c.prompt.includes('telemetry')),
    ).toBe(true);
    expect(chips.some((c) => c.prompt.includes('transactions') || c.prompt.includes('audit'))).toBe(
      true,
    );
    expect(chips.some((c) => c.prompt.includes('inventory') || c.prompt.includes('Reorder'))).toBe(
      true,
    );
  });

  it('should reactively switch prompt chips when active route changes to /judge-guide and /inspector', () => {
    registry.setActiveRoute('/judge-guide');
    expect(
      component
        .promptChips()
        .some(
          (c) =>
            c.label.includes('Devpost') ||
            c.prompt.includes('rubric') ||
            c.prompt.includes('compliance'),
        ),
    ).toBe(true);

    registry.setActiveRoute('/inspector');
    expect(
      component
        .promptChips()
        .some(
          (c) =>
            c.label.includes('Telemetry') ||
            c.prompt.includes('latency') ||
            c.prompt.includes('logs'),
        ),
    ).toBe(true);
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
    bridgeService.messages.set([{ id: '1', role: 'user', content: 'Test', timestamp: Date.now() }]);
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
    expect(bridgeService.messages()[0].thinking).toBe(
      'I need to rotate 45 degrees and then take screenshot.',
    );
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
      expect(output).toContain(
        '<div class="font-bold text-slate-900 text-xs mt-2 mb-1">Main Title</div>',
      );
      expect(output).toContain(
        '<div class="font-bold text-slate-900 text-xs mt-2 mb-1">Sub Section</div>',
      );
      expect(output).toContain(
        '<div class="font-bold text-slate-900 text-xs mt-2 mb-1">Detail Header</div>',
      );
      expect(output).toContain(
        '<div class="font-bold text-slate-900 text-xs mt-2 mb-1">Sub Detail</div>',
      );
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

      expect(output).toContain(
        '<ul class="list-disc list-inside my-1 space-y-0.5 text-slate-800">',
      );
      expect(output).toContain('<li class="ml-1">Item A</li>');
      expect(output).toContain('<li class="ml-1">Item B</li>');
      expect(output).toContain('<li class="ml-1">Item C</li>');
      expect(output).toContain('</ul>');

      expect(output).toContain(
        '<ol class="list-decimal list-inside my-1 space-y-0.5 text-slate-800">',
      );
      expect(output).toContain('<li class="ml-1">First Step</li>');
      expect(output).toContain('<li class="ml-1">Second Step</li>');
      expect(output).toContain('</ol>');
    });

    it('should convert inline code and fenced code blocks with styling', () => {
      const input = 'Use `cad_measure()` tool.\n\n```json\n{\n  "status": "ok"\n}\n```';
      const output = component.formatMessageContent(input);

      expect(output).toContain(
        '<code class="px-1 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-cyan-800 border border-slate-200">cad_measure()</code>',
      );
      expect(output).toContain(
        '<pre class="my-2 p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto"><code>{\n  &quot;status&quot;: &quot;ok&quot;\n}</code></pre>',
      );
    });

    it('should protect markdown characters inside code blocks from being parsed as formatting', () => {
      const input = '```markdown\n# Not A Header\n- Not A List\n**Not Bold**\n```';
      const output = component.formatMessageContent(input);

      expect(output).toContain(
        '<pre class="my-2 p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto"><code># Not A Header\n- Not A List\n**Not Bold**</code></pre>',
      );
      expect(output).not.toContain(
        '<div class="font-bold text-slate-900 text-xs mt-2 mb-1">Not A Header</div>',
      );
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

  describe('Window Dimensions, Resizing & Maximize Mode', () => {
    it('should initialize with default width and height signals', () => {
      expect(component.width()).toBe(DEFAULT_CHAT_WIDTH);
      expect(component.height()).toBe(DEFAULT_CHAT_HEIGHT);
      expect(component.isMaximized()).toBe(false);
      expect(component.isExpanded()).toBe(false);
    });

    it('should toggle maximize/expand state using toggleExpand() and toggleMaximizeWindow()', () => {
      expect(component.isMaximized()).toBe(false);
      expect(component.isExpanded()).toBe(false);

      component.toggleExpand();
      expect(component.isMaximized()).toBe(true);
      expect(component.isExpanded()).toBe(true);

      component.toggleMaximizeWindow();
      expect(component.isMaximized()).toBe(false);
      expect(component.isExpanded()).toBe(false);
    });

    it('should clamp width and height within min and max boundaries', () => {
      // Clamping below minimum
      expect(component.clampWidth(100)).toBe(MIN_CHAT_WIDTH);
      expect(component.clampHeight(100)).toBe(MIN_CHAT_HEIGHT);

      // Valid range
      expect(component.clampWidth(600)).toBe(600);
      expect(component.clampHeight(750)).toBe(750);

      // Above maximum fallback (1920 / 1080 when window is undefined)
      expect(component.clampWidth(5000)).toBe(1920);
      expect(component.clampHeight(5000)).toBe(1080);
    });

    it('should restore saved dimensions from localStorage safely if present', () => {
      const mockStorage: Record<string, string> = {
        [STORAGE_KEY_WIDTH]: '650',
        [STORAGE_KEY_HEIGHT]: '780',
      };
      const originalLocalStorage = globalThis.localStorage;
      (globalThis as any).localStorage = {
        getItem: (key: string) => mockStorage[key] || null,
        setItem: (key: string, val: string) => {
          mockStorage[key] = val;
        },
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
        clear: () => {},
      };
      const originalWindow = globalThis.window;
      (globalThis as any).window = {
        innerWidth: 1920,
        innerHeight: 1080,
      };

      try {
        const restoredComponent = new CopilotChatComponent(bridgeService, registry);
        expect(restoredComponent.width()).toBe(650);
        expect(restoredComponent.height()).toBe(780);
      } finally {
        (globalThis as any).localStorage = originalLocalStorage;
        (globalThis as any).window = originalWindow;
      }
    });

    it('should handle corrupt or out-of-bounds localStorage dimensions safely with clamping', () => {
      const mockStorage: Record<string, string> = {
        [STORAGE_KEY_WIDTH]: 'invalid-number',
        [STORAGE_KEY_HEIGHT]: '10', // below min 400
      };
      const originalLocalStorage = globalThis.localStorage;
      (globalThis as any).localStorage = {
        getItem: (key: string) => mockStorage[key] || null,
        setItem: (key: string, val: string) => {
          mockStorage[key] = val;
        },
      };
      const originalWindow = globalThis.window;
      (globalThis as any).window = {
        innerWidth: 1920,
        innerHeight: 1080,
      };

      try {
        const fallbackComponent = new CopilotChatComponent(bridgeService, registry);
        expect(fallbackComponent.width()).toBe(DEFAULT_CHAT_WIDTH);
        expect(fallbackComponent.height()).toBe(MIN_CHAT_HEIGHT);
      } finally {
        (globalThis as any).localStorage = originalLocalStorage;
        (globalThis as any).window = originalWindow;
      }
    });

    it('should save dimensions to localStorage when saveDimensions is invoked', () => {
      const storageRecord: Record<string, string> = {};
      const originalLocalStorage = globalThis.localStorage;
      (globalThis as any).localStorage = {
        getItem: (key: string) => storageRecord[key] || null,
        setItem: (key: string, val: string) => {
          storageRecord[key] = val;
        },
      };

      try {
        component.saveDimensions(580, 720);
        expect(storageRecord[STORAGE_KEY_WIDTH]).toBe('580');
        expect(storageRecord[STORAGE_KEY_HEIGHT]).toBe('720');
      } finally {
        (globalThis as any).localStorage = originalLocalStorage;
      }
    });

    it('should reset dimensions to defaults and update localStorage when resetDimensions is called', () => {
      const storageRecord: Record<string, string> = {};
      const originalLocalStorage = globalThis.localStorage;
      (globalThis as any).localStorage = {
        getItem: (key: string) => storageRecord[key] || null,
        setItem: (key: string, val: string) => {
          storageRecord[key] = val;
        },
      };

      try {
        component.width.set(700);
        component.height.set(800);
        component.resetDimensions();

        expect(component.width()).toBe(DEFAULT_CHAT_WIDTH);
        expect(component.height()).toBe(DEFAULT_CHAT_HEIGHT);
        expect(storageRecord[STORAGE_KEY_WIDTH]).toBe(DEFAULT_CHAT_WIDTH.toString());
        expect(storageRecord[STORAGE_KEY_HEIGHT]).toBe(DEFAULT_CHAT_HEIGHT.toString());
      } finally {
        (globalThis as any).localStorage = originalLocalStorage;
      }
    });

    it('should execute startResize for top handle, updating height on pointermove and unregistering on pointerup', () => {
      const listeners: Record<string, (e: any) => void> = {};
      const originalWindow = globalThis.window;
      (globalThis as any).window = {
        innerWidth: 1920,
        innerHeight: 1080,
        addEventListener: (event: string, handler: (e: any) => void) => {
          listeners[event] = handler;
        },
        removeEventListener: (event: string, handler: (e: any) => void) => {
          if (listeners[event] === handler) {
            delete listeners[event];
          }
        },
      };

      try {
        const startEvent = {
          clientX: 500,
          clientY: 400,
          preventDefault: () => {},
          stopPropagation: () => {},
        } as unknown as PointerEvent;

        component.startResize(startEvent, 'top');
        expect(typeof listeners['pointermove']).toBe('function');
        expect(typeof listeners['pointerup']).toBe('function');

        // Dragging top edge upwards by 50px (clientY goes from 400 to 350) -> height increases by 50px
        listeners['pointermove']({
          clientX: 500,
          clientY: 350,
          preventDefault: () => {},
        } as unknown as PointerEvent);

        expect(component.height()).toBe(DEFAULT_CHAT_HEIGHT + 50);

        // Pointer up removes listeners
        listeners['pointerup']({} as unknown as PointerEvent);
        expect(listeners['pointermove']).toBeUndefined();
        expect(listeners['pointerup']).toBeUndefined();
      } finally {
        (globalThis as any).window = originalWindow;
      }
    });

    it('should execute startResize for left handle, updating width on pointermove', () => {
      const listeners: Record<string, (e: any) => void> = {};
      const originalWindow = globalThis.window;
      (globalThis as any).window = {
        innerWidth: 1920,
        innerHeight: 1080,
        addEventListener: (event: string, handler: (e: any) => void) => {
          listeners[event] = handler;
        },
        removeEventListener: (event: string, handler: (e: any) => void) => {
          if (listeners[event] === handler) {
            delete listeners[event];
          }
        },
      };

      try {
        const startEvent = {
          clientX: 800,
          clientY: 500,
          preventDefault: () => {},
          stopPropagation: () => {},
        } as unknown as PointerEvent;

        component.startResize(startEvent, 'left');

        // Drag left edge leftwards by 80px (clientX goes from 800 to 720) -> width increases by 80px
        listeners['pointermove']({
          clientX: 720,
          clientY: 500,
          preventDefault: () => {},
        } as unknown as PointerEvent);

        expect(component.width()).toBe(DEFAULT_CHAT_WIDTH + 80);

        listeners['pointerup']({} as unknown as PointerEvent);
      } finally {
        (globalThis as any).window = originalWindow;
      }
    });

    it('should execute startResize for top-left diagonal handle, updating both width and height', () => {
      const listeners: Record<string, (e: any) => void> = {};
      const originalWindow = globalThis.window;
      (globalThis as any).window = {
        innerWidth: 1920,
        innerHeight: 1080,
        addEventListener: (event: string, handler: (e: any) => void) => {
          listeners[event] = handler;
        },
        removeEventListener: (event: string, handler: (e: any) => void) => {
          if (listeners[event] === handler) {
            delete listeners[event];
          }
        },
      };

      try {
        const startEvent = {
          clientX: 800,
          clientY: 400,
          preventDefault: () => {},
          stopPropagation: () => {},
        } as unknown as PointerEvent;

        component.startResize(startEvent, 'top-left');

        // Drag top-left by (dx=60, dy=40)
        listeners['pointermove']({
          clientX: 740,
          clientY: 360,
          preventDefault: () => {},
        } as unknown as PointerEvent);

        expect(component.width()).toBe(DEFAULT_CHAT_WIDTH + 60);
        expect(component.height()).toBe(DEFAULT_CHAT_HEIGHT + 40);

        listeners['pointerup']({} as unknown as PointerEvent);
      } finally {
        (globalThis as any).window = originalWindow;
      }
    });

    it('should ignore startResize if window is currently maximized', () => {
      component.isMaximized.set(true);

      const listeners: Record<string, (e: any) => void> = {};
      const originalWindow = globalThis.window;
      (globalThis as any).window = {
        addEventListener: (event: string, handler: (e: any) => void) => {
          listeners[event] = handler;
        },
      };

      try {
        const startEvent = {
          clientX: 500,
          clientY: 400,
          preventDefault: () => {},
          stopPropagation: () => {},
        } as unknown as PointerEvent;

        component.startResize(startEvent, 'top-left');
        expect(Object.keys(listeners).length).toBe(0);
      } finally {
        (globalThis as any).window = originalWindow;
      }
    });

    it('should apply preset sizes (compact, default, wide) and persist to localStorage', () => {
      const storageRecord: Record<string, string> = {};
      const originalLocalStorage = globalThis.localStorage;
      (globalThis as any).localStorage = {
        getItem: (key: string) => storageRecord[key] || null,
        setItem: (key: string, val: string) => {
          storageRecord[key] = val;
        },
      };

      try {
        component.applyPresetSize('compact');
        expect(component.width()).toBe(PRESET_COMPACT_WIDTH);
        expect(component.height()).toBe(PRESET_COMPACT_HEIGHT);
        expect(storageRecord[STORAGE_KEY_WIDTH]).toBe(PRESET_COMPACT_WIDTH.toString());

        component.applyPresetSize('wide');
        expect(component.width()).toBe(PRESET_WIDE_WIDTH);
        expect(component.height()).toBe(PRESET_WIDE_HEIGHT);
        expect(storageRecord[STORAGE_KEY_WIDTH]).toBe(PRESET_WIDE_WIDTH.toString());

        component.applyPresetSize('default');
        expect(component.width()).toBe(DEFAULT_CHAT_WIDTH);
        expect(component.height()).toBe(DEFAULT_CHAT_HEIGHT);
        expect(storageRecord[STORAGE_KEY_WIDTH]).toBe(DEFAULT_CHAT_WIDTH.toString());
      } finally {
        (globalThis as any).localStorage = originalLocalStorage;
      }
    });
  });
});
