# Wishlist, Today, and Ambient Goals

## Product principle

Neon Goals should help a vague want become a deliberate commitment without forcing that commitment early. Capture, planning, research, funding, and execution are separate stages.

## Information architecture

- **Today** is the default dashboard. It shows scheduled and overdue next actions, completed work, and a pulse of larger active goals.
- **Goals** remain the source of truth for outcomes, target dates, and action plans.
- **Wishlist** holds low-commitment purchase ideas. Creating an item never starts product research.
- **Product Research** retains the existing candidate-search workflow for committed item goals.
- **Finance** remains responsible for accounts, forecasts, and funded goals.

## Shipped foundation

### Wishlist

- Fast capture requires only a title.
- Notes, target budget, and priority are optional.
- Lifecycle: Idea, Researching, Saving, Ready to buy, Purchased, or Dropped.
- Wishlist persistence is user-scoped and separate from scraper-backed item goals.

### Today

- Shows incomplete actions scheduled for today plus overdue actions.
- Every action links back to its larger goal.
- Shows goals that need a next action and upcoming target dates.
- The guided planner sets a goal target date and schedules one concrete action.

## Next iterations

### Weekly planning

1. Ask what “done” means and confirm a target date.
2. Propose milestones backward from the target date.
3. Let the user accept, edit, or discard each milestone.
4. Suggest a weekly focus and a small number of daily actions.
5. Replan explicitly when work slips; never silently flood the calendar.

### Wishlist research

1. Promote a wishlist item to Researching only on explicit request.
2. Collect constraints such as dimensions, required features, and budget.
3. Produce a small comparable candidate set with sources and tradeoffs.
4. Let the user shortlist a candidate, create a savings goal, or return the item to Idea.
5. Never purchase automatically.

### Desktop surface

Build a dedicated compact Today route first, then wrap it with Tauri. The native shell should be frameless, launch at login, remember position, stay out of the taskbar, and offer an optional always-on-top mode. Keep the widget limited to the top actions, completion controls, quick capture, and one goal-attention signal.
