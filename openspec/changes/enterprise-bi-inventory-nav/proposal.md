# Proposal: Enterprise BI Multi-Domain & Inventory Sub-Navigation

## Intent
Expand `EnterpriseBiComponent` from single-view telemetry into a comprehensive enterprise operational hub featuring reactive sub-tab navigation, multi-domain inventory datasets (Retail, Hardware, Logistics, Pharma), and 5 specialized WebMCP tools for autonomous AI inventory management and Copilot bridge operations.

## Scope

### In Scope
- Reactive 3-tab navigation (`Analytics`, `Transactions`, `Inventory`) in `EnterpriseBiComponent` using Angular Signals.
- Multi-domain inventory data model (`InventoryItem`, `BusinessDomain`, `DomainSummary`) and reactive state in `EnterpriseDataService`.
- 5 new WebMCP tools: `query_inventory`, `update_inventory_stock`, `reorder_inventory_item`, `filter_inventory_by_domain`, `get_business_domain_summary`.
- Sidebar module configuration update in `sidebar-modules.config.ts` exposing all 9 BI tools.
- Copilot chat bridge integration with real-time UI feedback toasts.

### Out of Scope
- Backend database persistence (in-memory deterministic Angular Signals state only).
- Supplier EDI integration or external warehouse APIs.

## Capabilities

### New Capabilities
- `webmcp-enterprise-inventory`: Multi-domain inventory state management, stock level mutations, reorder pipelines, and sector summaries.

### Modified Capabilities
- `webmcp-enterprise-bi`: Add reactive 3-tab sub-navigation and multi-domain aggregation models.
- `webmcp-enterprise-tools`: Register 5 specialized inventory WebMCP tools alongside existing 4 BI telemetry tools.

## Approach
1. Extend `enterprise-bi.types.ts` with inventory models and `BusinessDomain` types.
2. Update `EnterpriseDataService` with deterministic inventory signals (`inventory`, `selectedDomain`, `domainSummaries`) and mutation methods.
3. Enhance `EnterpriseBiComponent` with `activeTab` signal, tab bar UI, and dedicated Inventory view with stock cards and action buttons.
4. Register 5 WebMCP inventory tools with parameter validation and UI feedback updates.
5. Update `sidebar-modules.config.ts` tool catalog.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/models/enterprise-bi.types.ts` | Modified | Add `InventoryItem`, `BusinessDomain`, `DomainSummary`, filter types |
| `src/app/services/enterprise-data.service.ts` | Modified | Add inventory state, signals, computed aggregations, and stock/reorder methods |
| `src/app/components/enterprise-bi/enterprise-bi.component.ts` | Modified | Implement sub-tab UI, Inventory panel, and register 5 new WebMCP tools |
| `src/app/config/sidebar-modules.config.ts` | Modified | Register all 9 tools under `view-enterprise-bi` |
| `src/app/components/enterprise-bi/enterprise-bi.component.spec.ts` | Modified | Unit tests for tabs, inventory state, and tool registrations |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tool namespace conflicts | Low | Prefix inventory tool names explicitly (`query_inventory`, etc.) |
| Tab state loss on navigation | Low | Retain state inside singleton `EnterpriseDataService` |
| Signal computation overhead | Low | Use granular `computed()` signals for domain filtering |

## Rollback Plan
Revert changes to `enterprise-bi.component.ts`, `enterprise-data.service.ts`, `enterprise-bi.types.ts`, and `sidebar-modules.config.ts` via Git checkout.

## Dependencies
- `@webmcp/angular` (WebMcpService)
- `CopilotBridgeService`

## Success Criteria
- [ ] Sub-tabs toggle between Analytics, Transactions, and Inventory reactively.
- [ ] 5 new WebMCP tools register and execute correctly via WebMCP and Copilot bridge.
- [ ] Stock update and reorder methods reactively update inventory signals and UI.
- [ ] All unit tests pass (`bun test`).
