# Financial Projections UI Design

**Date:** 2026-03-14
**Status:** Draft

## Overview

This document is for the frontend implementation of financial projections in `neon-goals-ui`.

It translates the app-level `docs/projections-plan.md` into UI work that matches the backend design in `../neon-goals-service/docs/plans/2026-03-14-financial-projections-service-design.md`.

The UI should not compute projections itself. The UI should:

- fetch projection data from the service
- explain assumptions clearly
- let users inspect recurring cashflow
- let users try lightweight scenarios
- provide fallback/manual entry flows when account coverage is incomplete

## Current Frontend Baseline

### Existing entry points

- `src/pages/Index.tsx`
- `src/components/goals/FinancialSummary.tsx`
- `src/services/plaidService.ts`
- `src/store/useFinanceStore.ts`
- `src/types/goals.ts`

### Current behavior

The landing page already shows a `FinancialSummary` card with:

- net worth from linked Plaid accounts
- total assets
- total debt
- finance goal progress
- collapsible Plaid account detail

That makes `FinancialSummary` the right place to evolve first. Do not create a disconnected second finance dashboard unless the existing card becomes too constrained.

## UX Goal

The landing page should answer one question immediately:

**"At your current pace, where are you headed?"**

That means the first screen should emphasize:

1. projected net worth
2. projected time to key goals
3. why the model thinks that
4. what the user can change

## Recommended UI Architecture

## Section 1: Extend Financial Summary into a Projection Surface

### Keep

- account totals
- linked account affordances
- finance goal progress

### Add

- a projection hero row
- a trajectory chart
- a recurring cashflow summary
- a scenario panel
- a coverage/inputs panel for manual financial data

### Proposed composition

```text
FinancialSummary
├── ProjectionHero
├── ProjectionChartCard
├── RecurringCashflowCard
├── GoalForecastCard
├── ScenarioControls
└── AccountCoverageCard
```

Recommendation: keep `FinancialSummary` as the container for v1, but split new pieces into dedicated child components.

## Section 2: Projection Hero

### Purpose

Show the core payoff before any detail.

### Content

- current net worth
- projected net worth at 12 months
- monthly net cashflow
- headline sentence:
  `At your current pace, you could reach $X by Month YYYY.`

### Interaction

- horizon toggle: `3m`, `6m`, `12m`
- loading skeleton on first fetch
- subdued empty state if projections are unavailable

### Notes

Do not show fake precision. Use rounded values and short assumption labels.

## Section 3: Projection Chart

### Purpose

Visualize momentum, not portfolio analytics.

### v1 chart series

- baseline projected net worth
- optional current-point marker
- optional goal milestone markers

### Avoid in v1

- too many overlays
- candlestick/investment-style visuals
- Monte Carlo fan charts

### Interaction

- hover/tap for month and value
- click goal marker to highlight corresponding forecast row

## Section 4: Goal Forecast Card

### Purpose

Connect projection data to the goals system users already understand.

### Content per active finance goal

- goal title
- current balance
- target balance
- projected completion date
- monthly allocation assumption

### Behavior

- if the backend returns low-confidence or insufficient data, show `Needs more data` instead of a fake date
- if there are multiple finance goals, show that allocations are estimated

## Section 5: Recurring Cashflow Card

### Purpose

Explain where the projection comes from.

### Two-column layout

- recurring income
- recurring expenses

### Row content

- label
- cadence
- average amount
- confidence badge
- source badge: `Linked account` or `Manual`

### Expansion

Collapsed by default on mobile, open by default on desktop.

## Section 6: Scenario Controls

### Purpose

Let users see actionable alternatives without editing permanent data.

### v1 controls

- monthly savings increase
- dining/subscriptions reduction
- manual income adjustment
- exclude one goal from allocation

### UX rules

- controls should immediately request a scenario projection from the backend
- show the delta from baseline, not only the new total
- provide a one-click `Reset to baseline`

### Anti-pattern to avoid

Do not hide scenario controls inside chat first. This belongs in the core finance UI.

## Section 7: Account Coverage and Manual Inputs

### Purpose

Handle the real-world gaps called out in the product plan.

### Content

- linked accounts summary
- missing coverage warning when projection confidence is low
- CTA to add manual account
- CTA to add manual recurring income/expense

### Manual inputs needed for v1

- manual financial account
- manual recurring cashflow

### UX framing

Position manual inputs as coverage improvements, not as secondary settings buried elsewhere.

## Data Contracts

Assume the service will provide endpoints similar to:

```text
GET  /projections/overview
GET  /projections/cashflow
POST /projections/forecast
POST /projections/scenario

GET  /manual-financial-accounts
POST /manual-financial-accounts
PATCH /manual-financial-accounts/:id
DELETE /manual-financial-accounts/:id

GET  /manual-cashflows
POST /manual-cashflows
PATCH /manual-cashflows/:id
DELETE /manual-cashflows/:id
```

The UI should treat these responses as source of truth and avoid duplicating projection math in selectors or components.

## Frontend State Plan

### New service files

```text
src/services/projectionsService.ts
src/services/manualFinanceService.ts
```

### Store recommendation

Create a dedicated store slice instead of extending Plaid-only state:

```text
src/store/useProjectionStore.ts
```

### Suggested state

```ts
type ProjectionState = {
  overview: ProjectionOverview | null;
  cashflow: CashflowSummary | null;
  scenario: ProjectionScenarioResult | null;
  manualAccounts: ManualFinancialAccount[];
  manualCashflows: ManualCashflow[];
  selectedHorizon: 3 | 6 | 12;
  scenarioInputs: ScenarioInputs;
  isLoadingOverview: boolean;
  isLoadingScenario: boolean;
  error: string | null;
};
```

### Important store rule

Prefer direct Zustand subscriptions in components:

```ts
const overview = useProjectionStore(state => state.overview);
```

Avoid reading broad store objects and filtering in component render paths.

## Component Plan

### New components

```text
src/components/projections/ProjectionHero.tsx
src/components/projections/ProjectionChartCard.tsx
src/components/projections/RecurringCashflowCard.tsx
src/components/projections/GoalForecastCard.tsx
src/components/projections/ScenarioControls.tsx
src/components/projections/AccountCoverageCard.tsx
src/components/projections/ManualAccountDialog.tsx
src/components/projections/ManualCashflowDialog.tsx
```

### Existing components likely modified

- `src/components/goals/FinancialSummary.tsx`
- `src/pages/Index.tsx`
- `src/services/plaidService.ts`
- `src/store/useFinanceStore.ts`

## Visual Direction

Keep the current neon/miami visual system, but projections should feel more analytical and less like a static account widget.

### Design cues

- hero numbers should feel calm and legible, not casino-like
- use one primary chart accent for the baseline
- use a second accent only for scenario delta or goal markers
- assumptions should read like product language, not internal model output

### Mobile behavior

- projection hero first
- chart second
- scenario controls in a bottom sheet or collapsible card
- recurring cashflow collapsed by default

## Loading and Empty States

### Loading

- skeletons for hero metrics
- chart placeholder with fixed height
- scenario controls disabled while request is in flight

### Empty states

If there are no linked or manual accounts:

- explain that projections need financial inputs
- show CTA to link accounts
- show CTA to add manual account

If there are accounts but insufficient transaction history:

- show current net worth
- show `Projection needs more history`
- show CTA to add manual recurring cashflows

## Error Handling

### Errors to distinguish

- no coverage
- insufficient history
- scenario request failed
- manual input save failed

### UX rule

Do not collapse every failure into a generic toast. Inline explanation matters here because trust is part of the feature.

## Implementation Sequence

## Phase 1: API and State Wiring

1. Add `projectionsService.ts`.
2. Add `manualFinanceService.ts`.
3. Add `useProjectionStore.ts`.
4. Define frontend types for projection payloads.

## Phase 2: Landing Page Projection UI

1. Add `ProjectionHero`.
2. Add `ProjectionChartCard`.
3. Add `GoalForecastCard`.
4. Integrate them into `FinancialSummary`.

## Phase 3: Explainability and Controls

1. Add `RecurringCashflowCard`.
2. Add `ScenarioControls`.
3. Add optimistic baseline/scenario compare UX.

## Phase 4: Coverage Improvement Flows

1. Add `AccountCoverageCard`.
2. Add `ManualAccountDialog`.
3. Add `ManualCashflowDialog`.

## Hand-off Notes for UI Implementation

1. Reuse the current `FinancialSummary` location on the landing page. That keeps the feature discoverable and avoids a parallel finance surface.
2. Treat projection confidence and assumptions as first-class UI, not backend debug details.
3. Build the baseline projection path first. Scenario controls and manual inputs should layer on top cleanly.
4. Keep charting and state modular. This feature will likely expand once the service adds richer modeling.
