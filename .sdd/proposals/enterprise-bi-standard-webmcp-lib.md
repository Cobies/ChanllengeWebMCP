# Proposal: Enterprise BI Standard WebMCP Library

## Intent

Enterprise applications lack a standardized, reusable Business Intelligence (BI) tool architecture for WebMCP in Angular 22. This proposal establishes a generic multi-domain BI library providing 4 canonical universal tools backed by a pluggable domain adapter pattern (`BiDomainAdapter`) across 4 key business verticals.

## Scope

### In Scope
- Generic `BiDomainAdapter<TMetric, TFilter, TSummary>` interface and registry.
- 4 Canonical WebMCP Universal Tools: `query_enterprise_metrics`, `filter_business_data`, `calculate_kpi_summary`, and `trigger_analytics_export`.
- 4 Enterprise Domain Adapter Implementations:
  - **Supply Chain**: Stockout risk, OTIF (On-Time In-Full), inventory turnover.
  - **Financial Risk & AML**: Fraud score, anomaly detection, transaction velocity.
  - **Customer Retention & Churn**: NRR (Net Retention Rate), health score, churn risk.
  - **Cloud FinOps**: Unit cost economics, unallocated spend, MTTR / incident cost.
- Angular 22 signals and standalone-ready DI provider (`provideEnterpriseBi()`).

### Out of Scope
- Direct backend database connectors (data retrieved via Angular HTTP services or mock providers).
- Chart rendering / visualization UI components (pure headless BI WebMCP tool layer).

## Capabilities

### New Capabilities
- `enterprise-bi-core`: Generic WebMCP BI domain adapter contract, registry, and execution pipeline.
- `enterprise-bi-universal-tools`: The 4 canonical WebMCP tools (`query_enterprise_metrics`, `filter_business_data`, `calculate_kpi_summary`, `trigger_analytics_export`).
- `enterprise-bi-domain-adapters`: Concrete adapters for Supply Chain, Financial Risk/AML, Customer Retention/Churn, and Cloud FinOps.

### Modified Capabilities
None

## Approach

Implement a modular headless architecture in Angular 22:
1. Define typed domain contracts and `BiDomainAdapter` abstraction.
2. Implement the 4 canonical WebMCP tools dispatching dynamically via active adapter context.
3. Deliver domain adapters with deterministic KPI calculation formulas and export formatters (CSV, JSON, Parquet-schema).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/core/bi/` | New | Generic contracts, `BiDomainAdapter`, tool registry, and Angular DI providers |
| `src/app/core/bi/tools/` | New | 4 Universal WebMCP tool implementations |
| `src/app/core/bi/adapters/` | New | 4 Domain-specific adapter implementations |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Schema mismatch between domains | Low | Strict generic typing on adapter interfaces and schema validation |
| Complex calculation latency | Low | In-memory aggregations using typed array pipelines and web worker offloading if needed |

## Rollback Plan

Remove the `src/app/core/bi/` module and unregister BI tools from the WebMCP tool registry.

## Dependencies

- Angular 22 Standalone / Signals
- WebMCP SDK Core

## Success Criteria

- [ ] All 4 canonical WebMCP tools execute successfully across all 4 enterprise domains.
- [ ] Domain adapters correctly compute OTIF, Fraud Score, NRR, and FinOps unit cost metrics.
- [ ] Unit tests pass with 100% coverage on core adapter contracts and tool invocations.
