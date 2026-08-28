# Tasks: Enterprise BI Standard WebMCP Library

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~950 - 1300 lines |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Contracts & Core Engine) → PR 2 (Domain Adapters) → PR 3 (WebMCP Tools & UI) |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Core Contracts, Signal Store & Adapter Registry | PR 1 | `bun test src/app/core/bi/state.spec.ts src/app/core/bi/registry.spec.ts` | `bun test src/app/core/bi/` | `src/app/core/bi/` core engine files |
| 2 | 4 Business Domain Adapters Implementation | PR 2 | `bun test src/app/core/bi/adapters/*.spec.ts` | `bun test src/app/core/bi/adapters/` | `src/app/core/bi/adapters/` folder |
| 3 | 4 Canonical WebMCP Tools & Showcase UI Integration | PR 3 | `bun test src/app/core/bi/tools/*.spec.ts src/app/components/enterprise-bi/*.spec.ts` | `bun start` (Navigate `/enterprise-bi`) | `src/app/core/bi/tools/` & BI view components |

---

## Phase 1: Core Contracts & Adapter Architecture (TDD Foundation)

- [x] 1.1 **[RED]** Create contract unit tests in `src/app/core/bi/contracts.spec.ts` validating `BiDomainAdapter`, `BiFilterCriteria`, `BiQueryResult`, `BiKpiSummary`, and `BiExportResult` interface types and invariants.
- [x] 1.2 **[GREEN]** Implement core BI type definitions and domain adapter interface in `src/app/core/bi/bi.types.ts`.
- [x] 1.3 **[RED]** Create registry and token injection unit tests in `src/app/core/bi/registry.spec.ts` verifying multi-provider DI resolution and domain switching.
- [x] 1.4 **[GREEN]** Implement `BI_DOMAIN_ADAPTERS` injection token, `BiToolRegistry`, and `provideEnterpriseBi()` provider in `src/app/core/bi/registry.ts`.
- [x] 1.5 **[RED]** Create reactive state store tests in `src/app/core/bi/state.spec.ts` validating signal derivations, filter updates, and domain switching latency < 50ms.
- [x] 1.6 **[GREEN]** Implement `EnterpriseBiStateService` with fine-grained Angular signals (`activeDomain`, `records`, `filteredRecords`, `kpiSummary`, `isExecuting`) in `src/app/core/bi/enterprise-bi-state.service.ts`.

---

## Phase 2: Domain Adapters Implementation (Multi-Domain TDD)

- [x] 2.1 **[RED]** Create Supply Chain adapter tests in `src/app/core/bi/adapters/supply-chain.adapter.spec.ts` (OTIF % formula `(OTIF/Total)*100`, turnover rate, stockout risk index `[0.0, 1.0]`).
- [x] 2.2 **[GREEN]** Implement `SupplyChainAdapter` in `src/app/core/bi/adapters/supply-chain.adapter.ts`.
- [x] 2.3 **[RED]** Create Financial Risk/AML adapter tests in `src/app/core/bi/adapters/financial-risk.adapter.spec.ts` (FDR %, composite Anomaly Score `[0.0, 100.0]`, anomaly alert > 85.0).
- [x] 2.4 **[GREEN]** Implement `FinancialRiskAdapter` in `src/app/core/bi/adapters/financial-risk.adapter.ts`.
- [x] 2.5 **[RED]** Create Customer Retention/Churn adapter tests in `src/app/core/bi/adapters/customer-retention.adapter.spec.ts` (NRR % `((Start+Exp-Churn)/Start)*100`, churn risk, health score).
- [x] 2.6 **[GREEN]** Implement `CustomerRetentionAdapter` in `src/app/core/bi/adapters/customer-retention.adapter.ts`.
- [x] 2.7 **[RED]** Create Cloud FinOps adapter tests in `src/app/core/bi/adapters/cloud-finops.adapter.spec.ts` (unit economics $/req, MTTR outage costs, budget variance %).
- [x] 2.8 **[GREEN]** Implement `CloudFinOpsAdapter` in `src/app/core/bi/adapters/cloud-finops.adapter.ts`.

---

## Phase 3: Canonical WebMCP Tools & Tool Registry Dispatch

- [x] 3.1 **[RED]** Create threat-matrix and query validation tests in `src/app/core/bi/tools/query-enterprise-metrics.spec.ts` (UTC ISO format, 10,000 max record limit clamping, department filtering).
- [x] 3.2 **[GREEN]** Implement `query_enterprise_metrics` WebMCP tool handler and parameter schemas in `src/app/core/bi/tools/query-enterprise-metrics.tool.ts`.
- [x] 3.3 **[RED]** Create filter predicate and adversarial tests in `src/app/core/bi/tools/filter-business-data.spec.ts` (short-circuit AND evaluation, <4KB payload token capping).
- [x] 3.4 **[GREEN]** Implement `filter_business_data` WebMCP tool handler in `src/app/core/bi/tools/filter-business-data.tool.ts`.
- [x] 3.5 **[RED]** Create KPI aggregation and zero-division edge case tests in `src/app/core/bi/tools/calculate-kpi-summary.spec.ts` (healthScore clamping `[0, 100]`, empty dataset handling).
- [x] 3.6 **[GREEN]** Implement `calculate_kpi_summary` WebMCP tool handler in `src/app/core/bi/tools/calculate-kpi-summary.tool.ts`.
- [x] 3.7 **[RED]** Create analytics export and XSS sanitization tests in `src/app/core/bi/tools/trigger-analytics-export.spec.ts` (RFC 4180 CSV escaping, SHA256 checksum generation, `<script>` sanitization).
- [x] 3.8 **[GREEN]** Implement `trigger_analytics_export` WebMCP tool handler in `src/app/core/bi/tools/trigger-analytics-export.tool.ts`.

---

## Phase 4: UI Integration & Lifecycle Verification

- [x] 4.1 **[RED]** Create BI component lifecycle & dynamic tool binding tests in `src/app/components/enterprise-bi/enterprise-bi.component.spec.ts` (tool registration on `ngOnInit`, unregistration on `ngOnDestroy`, rapid route switching memory leak test).
- [x] 4.2 **[GREEN]** Wire `EnterpriseBiComponent` to `EnterpriseBiStateService` and `BiToolRegistry` in `src/app/components/enterprise-bi/enterprise-bi.component.ts` with dynamic domain switcher selector.
- [x] 4.3 **[GREEN]** Update `src/app/components/enterprise-bi/enterprise-bi.component.html` with domain KPI trend cards, SVG multi-series visualization, and filtered records data table.
- [x] 4.4 **[RED]** Create Copilot prompt bridge dynamic tool schema tests in `src/app/services/copilot-bridge.service.spec.ts` verifying domain-isolated tool schemas.
- [x] 4.5 **[GREEN]** Configure `provideEnterpriseBi` in `src/app/app.config.ts` registering all 4 domain adapters.
- [x] 4.6 **[VERIFY]** Run full test suite: `bun test` and build verification: `bun run build`.
