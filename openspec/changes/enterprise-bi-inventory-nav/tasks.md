# Tasks: Enterprise BI Multi-Domain & Inventory Sub-Navigation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~480 lines |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR (atomic feature slice) |
| Delivery strategy | ask-on-risk |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Inventory Models & Service State | PR 1 | `bun test src/app/services/enterprise-data.service.spec.ts` | Unit test execution | `src/app/models/enterprise-bi.types.ts`, `src/app/services/enterprise-data.service*` |
| 2 | UI Sub-Tabs, 5 WebMCP Tools & Config | PR 2 | `bun test src/app/components/enterprise-bi/enterprise-bi.component.spec.ts` | Browser navigation to `/enterprise-bi` | `src/app/components/enterprise-bi/*`, `src/app/config/sidebar-modules.config.ts` |

## Phase 1: Foundation & Type Definitions

- [x] 1.1 Add `BusinessDomain`, `InventoryStockStatus`, `EnterpriseBiTab`, `ReorderPriority`, `InventoryItem`, `InventorySupplier`, `InventoryFilterState`, `DomainSummaryResult`, and `ReorderReceipt` to `src/app/models/enterprise-bi.types.ts`.

## Phase 2: Core State & Methods (EnterpriseDataService)

- [x] 2.1 [RED] Add unit tests in `src/app/services/enterprise-data.service.spec.ts` testing catalog seeding, stock delta mutation, low-stock threshold triggers, boundary guards (invalid SKU, negative delta clamp), reorder pipeline, and domain summaries.
- [x] 2.2 [GREEN] Initialize 16-SKU catalog across 4 domains (`retail`, `hardware`, `logistics`, `pharma`) and reactive signals (`inventory`, `inventoryFilter`, `reorderLog`) in `src/app/services/enterprise-data.service.ts`.
- [x] 2.3 [GREEN] Implement derived signals (`filteredInventory`, `domainSummaries`, `totalInventoryValuation`, `lowStockAlerts`) in `src/app/services/enterprise-data.service.ts`.
- [x] 2.4 [GREEN] Implement operational methods (`queryInventory`, `updateInventoryFilter`, `resetInventoryFilter`, `updateStockLevel`, `reorderItem`, `getDomainSummary`) with input validation in `src/app/services/enterprise-data.service.ts`.

## Phase 3: UI Sub-Navigation & WebMCP Tools (EnterpriseBiComponent)

- [x] 3.1 [RED] Add unit tests in `src/app/components/enterprise-bi/enterprise-bi.component.spec.ts` verifying 9 WebMCP tools registration on `ngOnInit`, cleanup on `ngOnDestroy`, and sub-tab state transitions.
- [x] 3.2 [GREEN] Add `activeTab` signal and 3-tab navigation header (`Analytics`, `Transactions`, `Inventory`) with low-stock badge in `src/app/components/enterprise-bi/enterprise-bi.component.ts`.
- [x] 3.3 [GREEN] Implement Inventory panel view (domain selector pills, domain scorecard, interactive stock table, quick reorder buttons, reorder receipts audit trail) in `src/app/components/enterprise-bi/enterprise-bi.component.ts`.
- [x] 3.4 [GREEN] Register 5 new WebMCP inventory tools (`query_inventory`, `update_inventory_stock`, `reorder_inventory_item`, `filter_inventory_by_domain`, `get_business_domain_summary`) and handle deregistration in `src/app/components/enterprise-bi/enterprise-bi.component.ts`.

## Phase 4: Module Configuration & Tool Catalog

- [x] 4.1 Update `src/app/config/sidebar-modules.config.ts` to register all 9 enterprise tools under the `view-enterprise-bi` sidebar module definition.

## Phase 5: Verification & Full Suite Validation

- [x] 5.1 Execute full test suite `bun test` to ensure 100% green assertions across all service and component unit tests.
