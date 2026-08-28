# Specification: Enterprise BI Multi-Domain & Inventory Sub-Navigation

## Purpose
Define the complete technical specification for extending the Enterprise BI operational workspace with multi-domain inventory management (Retail, Hardware, Logistics, Pharma), reactive 3-tab sub-navigation, and 5 specialized WebMCP tools for autonomous AI agent operations.

---

## 1. Domain Types & Data Contracts

All models SHALL be defined in `src/app/models/enterprise-bi.types.ts`.

### 1.1 Type Definitions

```typescript
export type BusinessDomain = 'retail' | 'hardware' | 'logistics' | 'pharma' | 'all';
export type InventoryStockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'reordered';
export type EnterpriseBiTab = 'analytics' | 'transactions' | 'inventory';
export type ReorderPriority = 'standard' | 'expedited' | 'critical';

export interface InventorySupplier {
  id: string;
  name: string;
  leadTimeDays: number;
  rating: number; // 1.0 to 5.0
  contactEmail: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  domain: BusinessDomain;
  stockLevel: number;
  minThreshold: number;
  maxCapacity: number;
  unitPrice: number;
  currency: string;
  status: InventoryStockStatus;
  supplier: InventorySupplier;
  lastRestocked: string;
  location: string;
}

export interface InventoryFilterState {
  domain: BusinessDomain;
  status: InventoryStockStatus | 'all';
  searchTerm: string;
  lowStockOnly: boolean;
}

export interface DomainSummaryResult {
  domain: BusinessDomain;
  totalSkus: number;
  totalValuation: number;
  lowStockCount: number;
  outOfStockCount: number;
  healthScore: number; // 0 to 100
}

export interface ReorderReceipt {
  reorderId: string;
  sku: string;
  quantity: number;
  priority: ReorderPriority;
  supplier: InventorySupplier;
  estimatedArrival: string;
  totalCost: number;
  orderedAt: string;
}
```

---

## 2. Service Signals & Multi-Domain State Management

`EnterpriseDataService` in `src/app/services/enterprise-data.service.ts` MUST manage multi-domain inventory state alongside existing telemetry and transactions.

### 2.1 Reactive Signals & Computeds

| Signal / Computed | Type | Description |
|---|---|---|
| `inventory` | `WritableSignal<InventoryItem[]>` | In-memory deterministic catalog of at least 16 SKUs across all 4 domains |
| `inventoryFilter` | `WritableSignal<InventoryFilterState>` | Current filter settings (`domain`, `status`, `searchTerm`, `lowStockOnly`) |
| `reorderLog` | `WritableSignal<ReorderReceipt[]>` | Audit trail of placed replenishment orders |
| `filteredInventory` | `Signal<InventoryItem[]>` | `computed()` list matching active `inventoryFilter` criteria |
| `domainSummaries` | `Signal<Record<BusinessDomain, DomainSummaryResult>>` | `computed()` health scores, valuations, and SKU counts per domain |
| `totalInventoryValuation` | `Signal<number>` | `computed()` sum of `stockLevel * unitPrice` for all filtered items |
| `lowStockAlerts` | `Signal<InventoryItem[]>` | `computed()` items where `stockLevel <= minThreshold` |

### 2.2 Service Methods

```typescript
// Filtering & Querying
queryInventory(params: { domain?: BusinessDomain; status?: InventoryStockStatus | 'all'; searchTerm?: string; lowStockOnly?: boolean }): InventoryItem[];
updateInventoryFilter(partial: Partial<InventoryFilterState>): void;
resetInventoryFilter(): void;

// Stock Mutations & Replenishment
updateStockLevel(skuOrId: string, quantityDelta: number, reason?: string): { success: boolean; item?: InventoryItem; message: string };
reorderItem(skuOrId: string, quantity?: number, priority?: ReorderPriority): { success: boolean; receipt?: ReorderReceipt; item?: InventoryItem; message: string };

// Domain Summaries
getDomainSummary(domain?: BusinessDomain): DomainSummaryResult | Record<BusinessDomain, DomainSummaryResult>;
```

---

## 3. WebMCP Tools Specification

`EnterpriseBiComponent` MUST register 5 specialized inventory tools alongside existing 4 BI telemetry tools (total 9 tools).

### 3.1 Tool 1: `query_inventory`
Queries inventory catalog filtered by business domain, stock status, search keyword, or low-stock flag.

#### JSON Schema
```json
{
  "name": "query_inventory",
  "description": "Query enterprise inventory items filtered by business domain, stock status, or search term.",
  "parameters": {
    "type": "object",
    "properties": {
      "domain": {
        "type": "string",
        "enum": ["retail", "hardware", "logistics", "pharma", "all"],
        "description": "Business sector domain filter"
      },
      "status": {
        "type": "string",
        "enum": ["in_stock", "low_stock", "out_of_stock", "reordered", "all"],
        "description": "Stock status filter"
      },
      "searchTerm": {
        "type": "string",
        "description": "Search by SKU, product name, or location"
      },
      "lowStockOnly": {
        "type": "boolean",
        "description": "Filter strictly for items at or below minimum threshold"
      }
    }
  }
}
```

#### Response Format
```json
{
  "success": true,
  "count": 4,
  "totalValuation": 142500.0,
  "items": [
    {
      "id": "INV-RET-001",
      "sku": "SKU-RT-901",
      "name": "Omnichannel POS Smart Terminal",
      "domain": "retail",
      "stockLevel": 45,
      "minThreshold": 15,
      "maxCapacity": 120,
      "unitPrice": 420.0,
      "currency": "USD",
      "status": "in_stock",
      "supplier": { "id": "SUP-101", "name": "Apex Electronics", "leadTimeDays": 3, "rating": 4.8, "contactEmail": "orders@apexelectronics.com" },
      "lastRestocked": "2026-08-20T10:00:00Z",
      "location": "Warehouse-East-A1"
    }
  ]
}
```

---

### 3.2 Tool 2: `update_inventory_stock`
Mutates stock quantities for an item by SKU or ID, updating stock level and recalculating status reactively.

#### JSON Schema
```json
{
  "name": "update_inventory_stock",
  "description": "Mutate stock quantities for an inventory item by SKU or ID, updating reactive signals and threshold statuses.",
  "parameters": {
    "type": "object",
    "properties": {
      "skuOrId": {
        "type": "string",
        "description": "Inventory SKU (e.g., 'SKU-RT-901') or item ID ('INV-RET-001')"
      },
      "quantityDelta": {
        "type": "number",
        "description": "Quantity to add (positive) or deduct (negative)"
      },
      "reason": {
        "type": "string",
        "description": "Audit reason for stock level adjustment"
      }
    },
    "required": ["skuOrId", "quantityDelta"]
  }
}
```

#### Response Format
```json
{
  "success": true,
  "sku": "SKU-RT-901",
  "previousStock": 45,
  "newStock": 35,
  "status": "in_stock",
  "item": { "..." : "..." },
  "message": "Stock level for SKU-RT-901 updated from 45 to 35 (in_stock)"
}
```

---

### 3.3 Tool 3: `reorder_inventory_item`
Dispatches automated reorder replenishment pipeline for an item, transitioning status to `reordered` and generating audit receipt.

#### JSON Schema
```json
{
  "name": "reorder_inventory_item",
  "description": "Trigger automated replenishment reorder pipeline for low-stock or depleted inventory items.",
  "parameters": {
    "type": "object",
    "properties": {
      "skuOrId": {
        "type": "string",
        "description": "Inventory SKU or item ID to reorder"
      },
      "quantity": {
        "type": "number",
        "description": "Units to order. Defaults to (maxCapacity - stockLevel) if omitted"
      },
      "priority": {
        "type": "string",
        "enum": ["standard", "expedited", "critical"],
        "description": "Reorder priority and delivery urgency"
      }
    },
    "required": ["skuOrId"]
  }
}
```

#### Response Format
```json
{
  "success": true,
  "reorderId": "RO-2026-X89F",
  "sku": "SKU-HW-302",
  "quantity": 50,
  "priority": "expedited",
  "estimatedArrival": "2026-08-30T12:00:00Z",
  "totalCost": 12500.0,
  "supplier": { "id": "SUP-202", "name": "Silicon Global Foundry", "leadTimeDays": 2, "rating": 4.9, "contactEmail": "sales@siliconglobal.com" },
  "item": { "..." : "..." },
  "message": "Reorder RO-2026-X89F dispatched: 50 units of SKU-HW-302 with expedited priority."
}
```

---

### 3.4 Tool 4: `filter_inventory_by_domain`
Sets active business domain and syncs inventory UI filter.

#### JSON Schema
```json
{
  "name": "filter_inventory_by_domain",
  "description": "Switch active business domain filter to focus inventory views and telemetry on a specific industry sector.",
  "parameters": {
    "type": "object",
    "properties": {
      "domain": {
        "type": "string",
        "enum": ["retail", "hardware", "logistics", "pharma", "all"],
        "description": "Target business domain"
      }
    },
    "required": ["domain"]
  }
}
```

#### Response Format
```json
{
  "success": true,
  "domain": "hardware",
  "matchedCount": 5,
  "domainValuation": 389400.0,
  "items": [ { "..." : "..." } ]
}
```

---

### 3.5 Tool 5: `get_business_domain_summary`
Returns sector-level operational health score, stock counts, and valuation aggregations.

#### JSON Schema
```json
{
  "name": "get_business_domain_summary",
  "description": "Retrieve high-level operational health scorecard, stock risk ratios, and total valuations across business domains.",
  "parameters": {
    "type": "object",
    "properties": {
      "domain": {
        "type": "string",
        "enum": ["retail", "hardware", "logistics", "pharma", "all"],
        "description": "Specific business domain or 'all' for cross-domain matrix"
      }
    }
  }
}
```

#### Response Format
```json
{
  "success": true,
  "domain": "all",
  "overallValuation": 1285400.0,
  "criticalStockCount": 3,
  "summaries": {
    "retail": { "domain": "retail", "totalSkus": 4, "totalValuation": 184000.0, "lowStockCount": 1, "outOfStockCount": 0, "healthScore": 92 },
    "hardware": { "domain": "hardware", "totalSkus": 5, "totalValuation": 490000.0, "lowStockCount": 1, "outOfStockCount": 1, "healthScore": 78 },
    "logistics": { "domain": "logistics", "totalSkus": 4, "totalValuation": 221400.0, "lowStockCount": 0, "outOfStockCount": 0, "healthScore": 98 },
    "pharma": { "domain": "pharma", "totalSkus": 3, "totalValuation": 390000.0, "lowStockCount": 1, "outOfStockCount": 0, "healthScore": 86 }
  }
}
```

---

## 4. UI Specification: Sub-Tab Navigation in `EnterpriseBiComponent`

### 4.1 Sub-Navigation Tab Bar
The component MUST implement a 3-tab navigation bar powered by an `activeTab = signal<EnterpriseBiTab>('analytics')` state.

```html
<!-- Sub-Tabs Navigation Header -->
<div class="flex items-center gap-2 border-b border-slate-200/80 pb-3">
  <button (click)="activeTab.set('analytics')" [class.active]="activeTab() === 'analytics'">
    📊 Analytics & Telemetry
  </button>
  <button (click)="activeTab.set('transactions')" [class.active]="activeTab() === 'transactions'">
    💳 Transactions
  </button>
  <button (click)="activeTab.set('inventory')" [class.active]="activeTab() === 'inventory'">
    📦 Multi-Domain Inventory ({{ dataService.lowStockAlerts().length }})
  </button>
</div>
```

### 4.2 View Switching
- `@if (activeTab() === 'analytics')`: Displays KPI cards, 24h latency SVG chart, and department allocation.
- `@if (activeTab() === 'transactions')`: Displays status filters, department select, and transaction intelligence table.
- `@if (activeTab() === 'inventory')`: Displays domain selector pills (`Retail`, `Hardware`, `Logistics`, `Pharma`, `All`), summary scorecard cards per domain, inventory data table with stock level indicators, status badges, quick reorder action buttons, and replenishment receipts history.

---

## 5. Sidebar Module Configuration
`src/app/config/sidebar-modules.config.ts` SHALL list all 9 tools under `view-enterprise-bi`:
1. `query_enterprise_metrics`
2. `filter_business_data`
3. `calculate_kpi_summary`
4. `trigger_analytics_export`
5. `query_inventory`
6. `update_inventory_stock`
7. `reorder_inventory_item`
8. `filter_inventory_by_domain`
9. `get_business_domain_summary`

---

## 6. Testing & Quality Scenarios (TDD)

### Scenario 1: Tool Registration Lifecycle
- **GIVEN** `EnterpriseBiComponent` is initialized
- **WHEN** `ngOnInit()` executes
- **THEN** `WebMcpService.getTools()` MUST return all 9 enterprise tools
- **AND** on `ngOnDestroy()`, all 9 tools MUST be cleanly unregistered.

### Scenario 2: Sub-tab Switching
- **GIVEN** `EnterpriseBiComponent` loaded with default `activeTab() === 'analytics'`
- **WHEN** user or tool invokes `activeTab.set('inventory')`
- **THEN** UI MUST display the multi-domain inventory table and domain summary cards.

### Scenario 3: Inventory Stock Mutation
- **GIVEN** SKU `SKU-RT-901` has 45 units with `minThreshold = 15`
- **WHEN** `update_inventory_stock` executes with `quantityDelta = -35`
- **THEN** `stockLevel` MUST become `10`
- **AND** `status` MUST transition to `'low_stock'`
- **AND** `lowStockAlerts()` signal MUST include this SKU.

### Scenario 4: Autonomous Reorder Pipeline
- **GIVEN** SKU `SKU-HW-302` in `'low_stock'` status
- **WHEN** `reorder_inventory_item` is called
- **THEN** `reorderLog` signal MUST append a new `ReorderReceipt`
- **AND** SKU status MUST transition to `'reordered'`
- **AND** response MUST include valid estimated arrival and supplier details.

### Scenario 5: Multi-Domain Health Summaries
- **GIVEN** 16 SKUs distributed across Retail, Hardware, Logistics, and Pharma
- **WHEN** `get_business_domain_summary` is executed with `domain: 'all'`
- **THEN** it MUST return accurate summaries for all 4 domains with individual valuations and health scores.
