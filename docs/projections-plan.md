# Neon Goals Financial Projections

## Context

Neon Goals currently shows:

- current net worth
- account balances

Goal:

Show projected financial trajectory.

User motivation:

Savings can feel unrewarding without seeing future outcomes.

The landing page should reinforce positive financial behavior.

---

# Key Decisions

1. Improve account coverage before projections.
2. Integrate additional data providers if needed.

Known gaps:

- Schwab accounts pending Plaid approval
- Fidelity not supported via Plaid
- E-Trade RSU vesting data missing

Possible solution:

Add Finicity integration.

---

# Goals

1. Complete financial data ingestion
2. Detect recurring income/expenses
3. Generate future projections
4. Align projections with financial goals

---

# Backlog / Tasks

## Task Group: Data Completeness

### Task 1: Finalize Schwab Plaid OAuth

Confirm integration works.

---

### Task 2: Investigate Fidelity support

Options:

- Finicity
- manual account import

---

### Task 3: Support E-Trade RSU tracking

Determine if RSU vesting schedules can be imported.

If not:

Allow manual entry.

---

# Task Group: Recurring Transaction Detection

### Task 4: Analyze transaction patterns

Detect:

- salary
- rent
- subscriptions
- utilities

---

### Task 5: Classify spending categories

Use transaction categories to identify recurring expenses.

---

# Task Group: Projection Engine

### Task 6: Build baseline projection

Assume:

current income/spending patterns remain constant.

---

### Task 7: Goal-aware projection

Adjust trajectory based on:

- savings goals
- debt payoff
- major purchases

---

### Task 8: Scenario modeling

Examples:

- reduce dining out
- increase savings

---

### Task 9: Monte Carlo simulation (optional)

Model variability in:

- income
- expenses
- investment returns

---

# Landing Page Design

Landing page should show:

- projected net worth
- time to reach goals
- trajectory visualization

Core message:

"At your current pace you will reach X by Y."
