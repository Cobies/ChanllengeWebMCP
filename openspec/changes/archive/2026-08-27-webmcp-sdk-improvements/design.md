# Design: WebMCP SDK Improvements (Lifecycle Teardown & Interceptor Pipeline)

## Technical Approach

Enhance `@webmcp/angular` (`src/lib`) by implementing lifecycle-aware tool management in `toWebMcpTool` and an extensible onion-style middleware execution pipeline in `WebMcpService`.

1. **Lifecycle Teardown in `toWebMcpTool`**:
   - Integrates Angular's `DestroyRef` to automatically deregister reactive tools when components, directives, or injection scopes are destroyed.
   - Provides a 4-tier resolution cascade (`explicit param` → `options.destroyRef` → `inject(DestroyRef, { optional: true })` → `graceful fallback`).
   - Returns an imperative teardown function `() => Promise<boolean>` for manual unregistration.

2. **WebMCP Interceptor Pipeline in `WebMcpService`**:
   - Implements an onion-style middleware pipeline around `executeTool`.
   - Supports multi-provider dependency injection (`WEBMCP_INTERCEPTORS`) and programmatic runtime registration (`addInterceptor`).
   - Enables parameter mutation, authentication/guard short-circuiting, execution logging/metrics, and centralized error handling.
   - Maintains 100% backward compatibility with all existing APIs and directives.

---

## Architecture Decisions

### Decision: DestroyRef Resolution Fallback Strategy in `toWebMcpTool`

| Option | Tradeoffs | Decision |
|---|---|---|
| A. Require explicit `DestroyRef` argument | Breaks existing call sites; verbose and unnecessary within injection contexts | Rejected |
| B. Only call `inject(DestroyRef)` | Throws or fails if called outside constructor/injection context (e.g. in async methods or pure helpers) | Rejected |
| C. 4-tier Resolution Cascade: `param` → `options.destroyRef` → `inject(DestroyRef, { optional: true })` → `noop fallback` | Zero breaking changes; works automatically in injection contexts and gracefully outside | **Accepted** |

**Rationale**: Angular 16+ `inject(DestroyRef, { optional: true })` safely resolves inside constructor/field initialization. If called outside or in non-Angular test harnesses, falling back to manual unregistration prevents runtime errors while preserving full safety.

### Decision: Interceptor Pipeline Composition Model

| Option | Tradeoffs | Decision |
|---|---|---|
| A. Express-like `(req, res, next)` callback chain | Complex async error handling; inconsistent with modern Angular patterns | Rejected |
| B. RxJS Observable pipeline | Unnecessary stream overhead and bundling weight for single-call async promises | Rejected |
| C. Composable Promise-based Onion Middleware `(context, next) => Promise<unknown>` | Idiomatic `async/await`, supports pre/post processing, context mutation, short-circuiting, and error interception | **Accepted** |

**Rationale**: Matches standard modern middleware architectures (Angular `HttpInterceptorFn`, Koa, Fastify), enabling pre-processing before `next(context)` and post-processing or error catching after `next` resolves.

### Decision: Combined DI & Dynamic Interceptor Storage

| Option | Tradeoffs | Decision |
|---|---|---|
| A. DI-only interceptors via `WEBMCP_INTERCEPTORS` | Static; prevents dynamic attachment from feature components or devtools | Rejected |
| B. Programmatic-only interceptors via `WebMcpService` | Awkward integration with Angular application root providers | Rejected |
| C. Hybrid DI multi-provider + dynamic `addInterceptor()` linked array | Maximum flexibility: app-wide DI providers combined with dynamic runtime interceptors | **Accepted** |

**Rationale**: Applications can provide global logging/auth interceptors in `ApplicationConfig` while feature components or debugging tools can register/unregister dynamic interceptors at runtime with an unregister closure.

---

## Data Flow & Control Flow

### 1. `toWebMcpTool` Lifecycle & Teardown Flow

```
Caller (Component / Directive / Service)
  │
  ├─► toWebMcpTool(signal, options, webmcpService?, destroyRef?)
  │     │
  │     ├── 1. Resolve WebMcpService: param ?? inject(WebMcpService)
  │     │
  │     ├── 2. Resolve DestroyRef: param ?? options.destroyRef ?? inject(DestroyRef, { optional: true })
  │     │
  │     ├── 3. Register Tool with WebMcpService (tool handler sets targetSignal)
  │     │
  │     ├── 4. If DestroyRef is resolved:
  │     │       └── destroyRef.onDestroy(() => unregister())
  │     │
  │     └── 5. Return unregister closure: () => Promise<boolean>
```

### 2. `WebMcpService.executeTool` Interceptor Pipeline Execution Flow

```
executeTool(toolName, parameters, source)
  │
  ▼
Build WebMcpExecutionContext { toolName, parameters, source, metadata: {} }
  │
  ▼
Collect Interceptors: [...diInterceptors, ...dynamicInterceptors]
  │
  ▼
Execute Pipeline via dispatch(index, currentContext)
  │
  ├──► Interceptor 0 (e.g. AuthGuard)
  │      ├── [Pre-Execution / Auth Check]
  │      └── await next(context)
  │            │
  │            ├──► Interceptor 1 (e.g. Parameter Sanitize / Logger)
  │            │      ├── [Mutates context.parameters]
  │            │      └── await next(context)
  │            │            │
  │            │            └──► Target Handler: context.executeTool(toolName, parameters)
  │            │                   └── Resolves tool result or throws Error
  │            │
  │            └── [Post-Execution / Audit Logging]
  │
  ▼
Record Execution in WebMcpService._logs & return Result to Caller
```

---

## Interfaces / Contracts

### Core Interceptor Interfaces (`src/lib/core/webmcp.types.ts`)

```typescript
import { InjectionToken } from '@angular/core';

export interface WebMcpExecutionContext {
  toolName: string;
  parameters: Record<string, unknown>;
  source: 'native' | 'emulator' | 'ui';
  metadata?: Record<string, unknown>;
}

export type WebMcpHandler = (context: WebMcpExecutionContext) => Promise<unknown>;

export interface WebMcpInterceptor {
  intercept(context: WebMcpExecutionContext, next: WebMcpHandler): Promise<unknown>;
}

export const WEBMCP_INTERCEPTORS = new InjectionToken<WebMcpInterceptor[]>('WEBMCP_INTERCEPTORS');
```

### Signal Tool Options & Function Signature (`src/lib/directives/webmcp-signal.ts`)

```typescript
import { DestroyRef, WritableSignal } from '@angular/core';
import { WebMcpToolParameterSchema } from '../core/webmcp.types';
import { WebMcpService } from '../core/webmcp.service';

export interface SignalToolOptions<T> {
  name: string;
  description: string;
  parameters?: WebMcpToolParameterSchema;
  /**
   * Value transformer for converting agent parameters to signal value.
   */
  transform?: (params: Record<string, unknown>) => T;
  /**
   * Explicit DestroyRef to bind lifecycle teardown.
   * If omitted, DestroyRef is resolved via inject(DestroyRef, { optional: true }).
   */
  destroyRef?: DestroyRef;
}

/**
 * Connects a WritableSignal to a registered WebMCP tool.
 * Automatically handles lifecycle unregistration when DestroyRef fires.
 *
 * @returns An imperative unregister teardown callback: () => Promise<boolean>
 */
export function toWebMcpTool<T>(
  targetSignal: WritableSignal<T>,
  options: SignalToolOptions<T>,
  webmcpService?: WebMcpService,
  destroyRef?: DestroyRef
): () => Promise<boolean>;
```

---

## Component Internal Design

### 1. `toWebMcpTool` Internal Logic

```typescript
export function toWebMcpTool<T>(
  targetSignal: WritableSignal<T>,
  options: SignalToolOptions<T>,
  webmcpService?: WebMcpService,
  destroyRef?: DestroyRef
): () => Promise<boolean> {
  const service = webmcpService || inject(WebMcpService);

  // 4-tier DestroyRef resolution cascade
  let dRef: DestroyRef | null = destroyRef ?? options.destroyRef ?? null;
  if (!dRef) {
    try {
      dRef = inject(DestroyRef, { optional: true });
    } catch {
      dRef = null;
    }
  }

  const parameters: WebMcpToolParameterSchema = options.parameters || {
    type: 'object',
    properties: {
      value: {
        type: 'string',
        description: `New value for ${options.name}`,
      },
    },
    required: ['value'],
  };

  service.registerTool({
    name: options.name,
    description: options.description,
    parameters,
    handler: (params: Record<string, unknown>) => {
      const val = options.transform ? options.transform(params) : (params['value'] as T);
      targetSignal.set(val);
      return {
        success: true,
        tool: options.name,
        newValue: targetSignal(),
      };
    },
  });

  // Idempotent unregister teardown callback
  let isUnregistered = false;
  const unregister = async (): Promise<boolean> => {
    if (isUnregistered) {
      return true;
    }
    isUnregistered = true;
    return await service.unregisterTool(options.name);
  };

  // Bind teardown hook if DestroyRef was resolved
  if (dRef) {
    dRef.onDestroy(() => {
      void unregister();
    });
  }

  return unregister;
}
```

### 2. `WebMcpService` Internal Logic

```typescript
@Injectable({
  providedIn: 'root',
})
export class WebMcpService {
  private readonly diInterceptors: WebMcpInterceptor[];
  private readonly _dynamicInterceptors = signal<WebMcpInterceptor[]>([]);

  constructor(
    @Optional() @Inject(WEBMCP_CONFIG) config?: WebMcpConfig,
    @Optional() @Inject(WEBMCP_INTERCEPTORS) diInterceptors?: WebMcpInterceptor[] | WebMcpInterceptor[][]
  ) {
    this.config = { ...DEFAULT_CONFIG, ...(config || {}) };
    this.diInterceptors = diInterceptors ? (diInterceptors.flat() as WebMcpInterceptor[]) : [];
    this.context = this.resolveContext();
    this.initContextListeners();
    this._isReady.set(true);
  }

  /**
   * Programmatically register a runtime interceptor.
   * @returns Teardown function to remove the interceptor.
   */
  addInterceptor(interceptor: WebMcpInterceptor): () => void {
    this._dynamicInterceptors.update((list) => [...list, interceptor]);
    return () => {
      this._dynamicInterceptors.update((list) => list.filter((i) => i !== interceptor));
    };
  }

  /**
   * Execute a tool through the interceptor pipeline.
   */
  async executeTool<TResult = unknown>(
    toolName: string,
    parameters: Record<string, unknown> = {},
    source: 'native' | 'emulator' | 'ui' = 'ui'
  ): Promise<TResult> {
    const startTime = performance.now();
    const logId = 'log-' + Math.random().toString(36).substring(2, 9);
    const timestamp = Date.now();

    const context: WebMcpExecutionContext = {
      toolName,
      parameters: { ...parameters },
      source,
      metadata: {},
    };

    const interceptors = [...this.diInterceptors, ...this._dynamicInterceptors()];

    const dispatch = (index: number, currentContext: WebMcpExecutionContext): Promise<unknown> => {
      if (index < interceptors.length) {
        const interceptor = interceptors[index];
        return interceptor.intercept(currentContext, (nextContext) => dispatch(index + 1, nextContext));
      }
      return this.context.executeTool(currentContext.toolName, currentContext.parameters);
    };

    try {
      const result = (await dispatch(0, context)) as TResult;
      const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

      this.logExecutionSuccess(logId, toolName, context.parameters, result, timestamp, durationMs, source);
      return result;
    } catch (err: unknown) {
      const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
      const errorMessage = err instanceof Error ? err.message : String(err);

      this.logExecutionError(logId, toolName, context.parameters, errorMessage, timestamp, durationMs, source);
      throw err;
    }
  }
}
```

---

## Backward Compatibility Validation

1. **`toWebMcpTool` Existing Consumers**:
   - Calling `toWebMcpTool(signal, options)` without capturing the returned callback continues to work seamlessly.
   - Consumers in constructor/field declarations now benefit from automatic teardown on component destroy without changing any syntax.
2. **`WebMcpService.executeTool` Existing Callers**:
   - Public signature `executeTool(name, params?, source?)` is 100% preserved.
   - When no interceptors are registered, pipeline dispatch calls the underlying model context directly.
3. **Declarative Directives (`[webmcpTool]`, `[webmcpAction]`)**:
   - Directives continue registering and invoking tools with zero behavioral changes.

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/core/webmcp.types.ts` | Modify | Define `WebMcpExecutionContext`, `WebMcpHandler`, `WebMcpInterceptor`, and update `SignalToolOptions`. |
| `src/lib/core/webmcp.service.ts` | Modify | Inject `WEBMCP_INTERCEPTORS`, implement `addInterceptor`, and chain pipeline inside `executeTool`. |
| `src/lib/directives/webmcp-signal.ts` | Modify | Implement `DestroyRef` 4-tier fallback, `onDestroy` automatic unregistration, and return imperative unregister callback. |
| `src/lib/public-api.ts` | Modify | Re-export `WEBMCP_INTERCEPTORS`, `WebMcpInterceptor`, `WebMcpExecutionContext`, and `WebMcpHandler`. |
| `src/lib/directives/webmcp-signal.spec.ts` | Create / Modify | Add comprehensive unit test suite for signal tool lifecycle teardown, imperative unregistration, and fallback. |
| `src/lib/core/webmcp.service.spec.ts` | Modify | Add comprehensive unit test suite for interceptors DI, `addInterceptor`, onion ordering, short-circuiting, and error propagation. |

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| **Unit** (`webmcp-signal.spec.ts`) | Automatic unregistration on `DestroyRef.destroy()` | Provide mock `DestroyRef`, trigger destruction, verify `unregisterTool` called. |
| **Unit** (`webmcp-signal.spec.ts`) | Imperative deregistration via returned closure | Invoke returned `unregister()`, assert tool unregistered and subsequent calls are idempotent. |
| **Unit** (`webmcp-signal.spec.ts`) | Non-injection context graceful fallback | Call `toWebMcpTool` with null `DestroyRef` without throwing. |
| **Unit** (`webmcp.service.spec.ts`) | DI multi-provider interceptors | Inject multiple interceptors via `WEBMCP_INTERCEPTORS`, verify sequential execution. |
| **Unit** (`webmcp.service.spec.ts`) | Programmatic `addInterceptor` and removal | Dynamically attach interceptor, execute tool, invoke returned remove closure, execute again. |
| **Unit** (`webmcp.service.spec.ts`) | Context and parameter mutation | Interceptor modifies `context.parameters`, verify handler receives mutated data. |
| **Unit** (`webmcp.service.spec.ts`) | Interceptor short-circuiting | Interceptor returns value directly, assert downstream interceptors and handler skipped. |
| **Unit** (`webmcp.service.spec.ts`) | Error bubbling & execution logging | Handler throws error, verify interceptor handles/rethrows and log is saved. |

---

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

---

## Migration / Rollout

No migration required. All changes are backward-compatible and additive.

---

## Open Questions

None.
