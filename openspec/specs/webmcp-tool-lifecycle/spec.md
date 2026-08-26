# WebMCP Dynamic Tool Lifecycle Specification

## Purpose
Route-scoped dynamic tool lifecycle management, ensuring components register tools on mount and clean up on unmount.

## Requirements

### Requirement: Route-Scoped Dynamic Tool Lifecycle
Components MUST explicitly register their route-specific tools in `ngOnInit()` and unregister them in `ngOnDestroy()` using `WebMcpService`.

#### Lifecycle Binding Rules
| Component / View | Registered Tools on Init | Unregistered on Destroy |
|-------------------|--------------------------|-------------------------|
| `Showroom3dComponent` | `scene_3d_action`, `take_screenshot`, `form_action_runner` | `scene_3d_action`, `take_screenshot`, `form_action_runner` |
| `EnterpriseBiComponent` | `query_enterprise_metrics`, `filter_business_data`, `calculate_kpi_summary`, `trigger_analytics_export` | `query_enterprise_metrics`, `filter_business_data`, `calculate_kpi_summary`, `trigger_analytics_export` |
| `JudgeGuideComponent` | None (View only) | None |

#### Scenario: Route transition tool unregistration and registration
- **GIVEN** the user is on `/3d-showroom` with 3 3D tools registered (`scene_3d_action`, `take_screenshot`, `form_action_runner`)
- **WHEN** the user navigates to `/enterprise-bi`
- **THEN** `Showroom3dComponent.ngOnDestroy()` MUST call `unregisterTool()` for all 3 3D tools
- **AND** `EnterpriseBiComponent.ngOnInit()` MUST call `registerTool()` for the 4 enterprise tools
- **AND** `webmcp.registeredTools()` MUST reflect exactly the 4 enterprise tools.

#### Scenario: Dynamic Copilot tool adaptation
- **GIVEN** the Copilot drawer is open on `/enterprise-bi`
- **WHEN** a user sends a prompt to Gemini 3.7 Flash High
- **THEN** `CopilotBridgeService.getOpenAiTools()` MUST return the OpenAI schemas for the 4 active enterprise tools
- **AND** MUST NOT include unregistered 3D tools.
