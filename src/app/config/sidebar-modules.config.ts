import { SidebarViewConfig } from '../models/sidebar.models';
import { CopilotBridgeService } from '../services/copilot-bridge.service';

export const DEFAULT_SIDEBAR_MODULES: SidebarViewConfig[] = [
  // 1. 3D Digital Twin Showroom Workspace View
  {
    id: 'view-3d-showroom',
    title: '3D Digital Twin',
    icon: '🏎️',
    description: 'WebGL scene visualizer, real-time vehicle customizer, and 3D digital twin simulation.',
    category: 'workspace',
    order: 10,
    route: '/3d-showroom',
    tools: ['scene_3d_action', 'take_screenshot'],
  },

  // 2. Enterprise BI Analytics Workspace View
  {
    id: 'view-enterprise-bi',
    title: 'Enterprise BI',
    icon: '📊',
    description: 'Real-time business intelligence dashboard with telemetry filtering and KPI summaries.',
    category: 'workspace',
    order: 20,
    route: '/enterprise-bi',
    tools: [
      'query_enterprise_metrics',
      'filter_business_data',
      'calculate_kpi_summary',
      'trigger_analytics_export',
      'query_inventory',
      'update_inventory_stock',
      'reorder_inventory_item',
      'filter_inventory_by_domain',
      'get_business_domain_summary',
    ],
  },

  // 3. Judge Guide Rubric Scorecard Workspace View
  {
    id: 'view-judge-guide',
    title: 'Judge Guide',
    icon: '📋',
    description: 'Evaluation rubric scorecard, hackathon criteria verification, and test harness.',
    category: 'workspace',
    order: 30,
    route: '/judge-guide',
    tools: ['judge_rubric_evaluation', 'verify_harness'],
  },

  // 4. WebMCP Inspector Telemetry View
  {
    id: 'view-inspector',
    title: 'WebMCP Inspector',
    icon: '🔍',
    description: 'Live WebMCP tool invocation logs, latency telemetry, and payload inspection.',
    category: 'telemetry',
    order: 40,
    route: '/inspector',
  },

  // 5. Copilot Assistant AI Trigger
  {
    id: 'view-copilot',
    title: 'Copilot AI',
    icon: '🤖',
    description: 'Multimodal AI Copilot assistant drawer with autonomous tool execution loop.',
    category: 'assistant',
    order: 50,
    onSelect: (injector) => {
      const copilot = injector.get(CopilotBridgeService, null);
      if (copilot) {
        copilot.openDrawer();
      }
    },
  },
];

