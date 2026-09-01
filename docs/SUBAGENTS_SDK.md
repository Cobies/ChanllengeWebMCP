# Dynamic SubAgents SDK (`@cobies/webmcp-angular`) 🤖

The **Dynamic SubAgents SDK** is an Inversion-of-Control (IoC) multi-agent orchestration toolkit embedded directly into Angular 22 and W3C WebMCP. It allows parent orchestrator agents (such as the in-app AI Copilot or browser-native AI models) to delegate complex, multi-step subtasks to specialized domain worker agents in isolated execution loops.

---

## 🌟 Why SubAgents for WebMCP?

In complex enterprise web applications with dozens of registered WebMCP tools:
1. **Context Window Saturation**: Passing 20+ tool definitions and intermediate operational steps to a single LLM session rapidly consumes token budgets and degrades reasoning fidelity.
2. **Namespace & Responsibility Collisions**: A 3D CAD designer agent shouldn't have access to financial risk exports, and an inventory auditor shouldn't accidentally alter camera matrix transforms.
3. **Token & Latency Conservation**: SubAgents run **ephemeral internal loops** (< 4 turns) with **strictly scoped tools**, returning only an executive summary receipt (`SubAgentResult`) back to the parent orchestrator, saving up to **85% of context window tokens**.

---

## 🏛️ SDK Architecture & Components

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              PARENT ORCHESTRATOR AGENT                                 │
│  (Sees only high-level tools + dynamic 'delegate_to_subagent' meta-tool)               │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ Function Call: delegate_to_subagent
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               SubAgentRegistryService                                  │
│  - Reactive Signals: subagents(), activeTasks(), activeSubagents(), executionHistory() │
│  - Dynamic Delegation Tool Synthesis (Dynamic schema reflection)                       │
│  - IoC Execution Dispatcher                                                            │
└───────────────┬───────────────────────────┬───────────────────────────┬────────────────┘
                │                           │                           │
                ▼                           ▼                           ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐ ┌──────────────────────────────┐
│  '3d-specialist' SubAgent    │ │ 'analytics-specialist' Agent │ │   'audit-specialist' Agent   │
│  Scoped: [/^cad_/, /^scene_/]│ │ Scoped: [/^bi_/, 'query_..'] │ │ Scoped: ['get_logs', ...]    │
│  Max Turns: 4                │ │ Max Turns: 4                 │ │ Max Turns: 4                 │
│  Ephemeral Loop: Three.js    │ │ Ephemeral Loop: BI Datasets  │ │ Ephemeral Loop: DOM Telemetry│
└───────────────┬──────────────┘ └──────────────┬───────────────┘ └──────────────┬───────────────┘
                │                               │                                │
                └───────────────────────────────┼────────────────────────────────┘
                                                │ Executive Summary Receipt
                                                ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                 SubAgentResult: { status: 'success', summary: '...', tokens: 420 }     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Pure Multi-Strategy Tool Scoper (`filterToolsForSubAgent`)

The tool scoper provides functional, zero-side-effect filtering of global WebMCP tools for each subagent instance.

### Scoping Capabilities
- **Exact String Matching**: `'take_screenshot'`, `'query_enterprise_metrics'`
- **Regular Expressions**: `/^cad_/`, `/^scene_3d_/`, `/^studio_/`
- **Dynamic Predicates**: `(tool) => tool.name.startsWith('bi_') && !tool.name.includes('export')`
- **Denylist Precedence**: If a tool matches a deny rule within any filter group, it is strictly rejected regardless of allow rules.
- **Local Tool Overrides**: Subagent-local tools override global WebMCP tools of the same name.

### Filter Evaluation Example
```typescript
import { filterToolsForSubAgent, SubAgentToolFilter } from '@cobies/webmcp-angular';

const filters: SubAgentToolFilter[] = [
  // 1. Regex allowlist for all CAD tools
  /^cad_/,
  // 2. Exact match for visual inspection
  'take_screenshot',
  // 3. Structured group with denylist precedence
  {
    allow: [/^studio_/],
    deny: ['studio_export_gltf'], // Deny export tool for this worker
  },
  // 4. Custom dynamic predicate
  (tool) => tool.description.includes('geometry'),
];

const scopedTools = filterToolsForSubAgent(globalWebMcpTools, filters);
```

---

## ⚡ Reactive `SubAgentRegistryService`

The `SubAgentRegistryService` is an `@Injectable({ providedIn: 'root' })` service managing subagent lifecycles and exposing fine-grained Angular 22 Signals for real-time UI dashboard binding:

```typescript
@Injectable({ providedIn: 'root' })
export class SubAgentRegistryService {
  /** Array of all currently registered subagents */
  readonly subagents: Signal<SubAgentInstance[]>;

  /** Array of subagents currently in 'running' state */
  readonly activeSubagents: Signal<SubAgentInstance[]>;

  /** Active task requests being processed right now */
  readonly activeTasks: Signal<SubAgentTask[]>;

  /** History of the last 100 subagent execution receipts */
  readonly executionHistory: Signal<SubAgentResult[]>;

  /** Register a subagent instance */
  register(subagent: SubAgentInstance): void;

  /** Unregister a subagent instance */
  unregister(id: string): boolean;

  /** Dispatch task to a registered subagent */
  execute(subagentId: string, task: SubAgentTask): Promise<SubAgentResult>;

  /** Generate OpenAI Function Tool definition for parent agent */
  createDelegationTool(options?: DelegationToolOptions): WebMcpToolDefinition;
}
```

---

## 🛠️ `createSubAgent` Factory Helper

The `createSubAgent` factory function instantiates a reactive subagent with automatic lifecycle unregistration via Angular's `DestroyRef`:

```typescript
import { Component, DestroyRef, inject } from '@angular/core';
import { createSubAgent, SubAgentInstance } from '@cobies/webmcp-angular';

@Component({ ... })
export class CadStudioComponent {
  private readonly destroyRef = inject(DestroyRef);

  // Instantiates subagent and registers it in SubAgentRegistryService.
  // Automatically destroys & unregisters when this component is destroyed.
  readonly cadWorker: SubAgentInstance = createSubAgent(
    {
      id: 'cad-modeler',
      name: 'Parametric CAD Modeler',
      description: 'Specialist in 2D sketching, push-pull extrusion, and PBR architectural materials.',
      systemPrompt: `You are the Parametric CAD Modeler. Draw profiles, extrude solids, and apply requested materials. Return a concise executive summary of modified meshes.`,
      toolFilters: [
        /^cad_/,
        'take_screenshot',
      ],
      preferredModel: 'gemini-2.5-flash',
      maxTurns: 4,
    },
    { destroyRef: this.destroyRef }
  );
}
```

---

## 🪄 Dynamic Delegation Tool Synthesis (`createDelegationTool`)

When the orchestrator needs to delegate tasks, `createDelegationTool` dynamically synthesizes an OpenAI-compatible function schema reflecting all currently registered subagents:

```typescript
// Registered in parent agent toolset
const delegationTool = registry.createDelegationTool();
```

### Generated Dynamic Tool Schema
```json
{
  "name": "delegate_to_subagent",
  "description": "Delegate a specialized sub-task to an active specialist subagent...\n\nAvailable Specialist Subagents:\n- \"3d-specialist\" (3D Scene & CAD Specialist): Expert in Three.js visualizer, mesh manipulation, and CAD actions.\n- \"analytics-specialist\" (Enterprise BI Analytics Specialist): Expert in multi-domain business intelligence and KPI calculations.\n- \"audit-specialist\" (System Inspector & Audit Specialist): Expert in WebMCP tool logs, telemetry, and triage.",
  "parameters": {
    "type": "object",
    "properties": {
      "target_subagent": {
        "type": "string",
        "description": "The identifier of the specialist subagent to delegate the task to.",
        "enum": ["3d-specialist", "analytics-specialist", "audit-specialist"]
      },
      "objective": {
        "type": "string",
        "description": "Clear, actionable prompt and detailed instruction of what the subagent should accomplish."
      },
      "parameters": {
        "type": "object",
        "description": "Optional dictionary of parameters, inputs, or configurations for the subagent."
      },
      "context_hint": {
        "type": "string",
        "description": "Optional background context, prior conversation snippet, or relevant tool outputs."
      }
    },
    "required": ["target_subagent", "objective"]
  }
}
```

---

## 🏆 Built-in Specialist Profiles

The application comes pre-packaged with 3 production-ready specialist profiles in `SubAgentRunnerService`:

| Profile ID | Role Name | Scoped WebMCP Tools | Model & Turns |
| :--- | :--- | :--- | :--- |
| `3d-specialist` | **3D Scene & CAD Specialist** | `scene_3d_action`, `take_screenshot`, `cad_draw_shape`, `cad_push_pull`, `cad_place_component`, `cad_apply_material`, `cad_measure`, `studio_*` | `gemini-2.5-flash`<br>Max 4 turns |
| `analytics-specialist` | **Enterprise BI Analytics Specialist** | `query_enterprise_metrics`, `calculate_kpi_summary`, `filter_business_data`, `trigger_analytics_export`, `query_inventory`, `update_inventory_stock` | `gemini-2.5-flash`<br>Max 4 turns |
| `audit-specialist` | **System Inspector & Audit Specialist** | `navigate_to_view`, `form_action_runner`, `judge_rubric_evaluation`, `verify_harness` | `gemini-2.5-flash`<br>Max 4 turns |

---

## 💻 Real-World Code Examples

### 1. Manual Task Dispatching
```typescript
import { inject } from '@angular/core';
import { SubAgentRegistryService } from '@cobies/webmcp-angular';

export class AnalyticsDashboard {
  private readonly subagentRegistry = inject(SubAgentRegistryService);

  async runAnomalyAudit(): Promise<void> {
    const result = await this.subagentRegistry.execute('analytics-specialist', {
      objective: 'Filter flagged transactions over $1,000 in Financial Risk, calculate KPI anomaly rates, and export CSV audit report.',
      contextHint: 'Focus on Q3 AML flags.',
      maxTurns: 3,
    });

    console.log(`SubAgent Status: ${result.status}`);
    console.log(`Executive Summary: ${result.summary}`);
    console.log(`Tools Invoked: ${result.toolsUsed.join(', ')}`);
    console.log(`Execution Duration: ${result.durationMs}ms`);
  }
}
```

### 2. Custom Custom-Domain Worker SubAgent
```typescript
const customFinanceWorker = createSubAgent({
  id: 'finops-advisor',
  name: 'FinOps Optimization Advisor',
  description: 'Specialist in cloud infrastructure unit economics and cost optimization.',
  systemPrompt: `You are the FinOps Advisor. Retrieve cloud cost metrics, compute budget variance, and formulate savings recommendations.`,
  toolFilters: [
    (tool) => tool.name === 'query_enterprise_metrics' || tool.name === 'calculate_kpi_summary',
  ],
  handler: async (task, context) => {
    // Custom execution handler with direct tool calling
    const metrics = await context.executeTool('query_enterprise_metrics', {
      domain: 'cloud_finops',
      category: 'infrastructure',
    });
    
    return {
      subagentId: 'finops-advisor',
      objective: task.objective,
      status: 'success',
      summary: 'Evaluated cloud infrastructure spend. Identified $12,400 monthly savings opportunities.',
      toolsUsed: ['query_enterprise_metrics'],
      totalTurns: 1,
      durationMs: 45,
    };
  }
});
```
