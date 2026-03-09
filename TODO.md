# TODO - Neon Goals UI

---

## Agent Redirect & Handoff UI

### High Priority

- [x] Implement redirect command parser
  - [x] Parse `REDIRECT_TO_CATEGORY`, `REDIRECT_TO_GOAL`, `REDIRECT_TO_OVERVIEW`
  - [x] Extract target ID and redirect message
  - [x] Handle invalid command format gracefully

- [x] Create Redirect Card component (rendered INLINE in chat message)
  - [x] **Design pattern:** Same as current extract cards and proposal cards
  - [x] Display redirect message ("I'll help you compare those trucks...")
  - [x] Show "Go to [Target]" button (primary action)
  - [x] Show "Stay here" button (secondary action)
  - [x] Style with agent personality (consistent with extract/proposal cards)
  - [x] Use card background, border radius, shadow matching current UI
  - [x] Agent avatar or icon in card header

  **Visual Example (inline in chat):**
  ```
  [Agent Avatar] I'll help you compare those trucks side by side.
  ┌─────────────────────────────────────┐
  │ That comparison would work best in  │
  │ Items specialist view.              │
  │                                  │
  │ [Go to Items specialist] [Stay here] │
  └─────────────────────────────────────┘
  ```

- [x] Update Chat View to handle redirects
  - [x] Detect redirect commands in agent messages
  - [x] **Render Redirect Card inline within chat message flow** (not modal/overlay)
  - [x] Navigate to new chat on "Go" click
  - [x] Dismiss redirect card on "Stay" click

- [x] Implement toast notification system (for post-navigation confirmation)
  - [x] Show toast AFTER successful navigation: "Switched to Items specialist"
  - [x] Include "Go back" link in toast
  - [x] Add "Dismiss" action
  - [x] Auto-dismiss after 5 seconds
  - [x] **Note:** Toast is separate from Redirect Card (card is inline, toast is post-nav)

### Medium Priority

- [ ] Add breadcrumb navigation
  - [ ] Display: `Overview > Items specialist > Compare trucks`
  - [ ] Clickable breadcrumbs for easy navigation
  - [ ] Update breadcrumbs on chat switch

- [ ] Unsaved draft warnings
  - [ ] Detect unsaved input/draft in current chat
  - [ ] Show confirmation before redirecting
  - [ ] Allow user to cancel redirect

- [ ] Manual navigation fallback
  - [ ] Show navigation link if auto-redirect fails
  - [ ] Provide error message with manual option

- [ ] Loading states during redirect
  - [ ] Show spinner while navigating to new chat
  - [ ] Disable buttons during redirect
  - [ ] Handle timeout gracefully

### Low Priority

- [ ] Redirect analytics
  - [ ] Track "Go" vs "Stay" click rates
  - [ ] Monitor redirect acceptance by category
  - [ ] Identify patterns for optimization

---

## Agent Message Components

### High Priority

- [ ] Agent Message wrapper component
  - [ ] Parse agent commands from response text
  - [ ] Render appropriate UI based on command type
  - [ ] Support proposal buttons (Confirm/Edit/Cancel)
  - [ ] Support redirect cards

- [ ] Proposal Button components
  - [ ] Confirm button (primary action)
  - [ ] Edit button (secondary, opens modal)
  - [ ] Cancel button (tertiary)
  - [ ] Style based on proposal type

- [ ] Streaming text display
  - [ ] Render streaming character-by-character
  - [ ] Show typing indicator at end of stream
  - [ ] Stop streaming button for long responses

---

## Chat UX Improvements

### Medium Priority

- [ ] Quick actions in chat header (toolbar at top of chat)
  - [ ] Examples of common actions:
    - "Clear history" — wipe current chat messages
    - "Export chat" — download conversation as JSON/MD
    - "Switch agent" — dropdown to jump to other agent
    - "Go to goal" — quick link if discussing specific goal
    - "Settings" — agent preferences (temperature, response style)
  - [ ] Icon-based buttons with tooltips
  - [ ] Actions persist based on context (some hidden in overview, visible in goal view)

- [ ] Message actions (hover menu on each message)
  - [ ] Copy message text to clipboard
  - [ ] Quote/reply to message (pre-fills input with quoted text)
  - [ ] Report incorrect response (sends feedback for agent training)
  - [ ] **Like/dislike buttons** — quick feedback for:
    - Helpful responses (like) → reinforces good patterns
    - Incorrect/hallucinated responses (dislike) → flags for review
    - Used for GEPA optimization and agent improvement
  - [ ] Delete own messages (user only, with undo)

- [ ] Input enhancements
  - [ ] Suggested questions based on context
  - [ ] Voice input support
  - [ ] Message templates ("Create a goal to...")
  - [ ] Slash commands (`/create`, `/refresh`, etc.)

---

## Error Handling & Edge Cases

### High Priority

- [ ] Fix swipe-in-scanner logout bug (Demo Mode)
  - [ ] **Issue:** Swiping in scanner causes user to be logged out and redirected to overview
  - [ ] **Occurs in:** Demo Mode authentication flow
  - [ ] **Investigation needed:**
    - Check if swipe gesture is incorrectly triggering logout action
    - Verify scanner component event handlers (touch events vs. scroll events)
    - Review Demo Mode logout trigger conditions
  - [ ] **Implementation:**
    - Add gesture conflict detection between scanner swipe and app navigation
    - Prevent swipe from triggering logout during normal scanning
    - Test extensively in Demo Mode before deploying

### Medium Priority

- [ ] Network error handling
  - [ ] Retry failed requests (up to 3 times)
  - [ ] Show friendly error message
  - [ ] Allow manual retry button

- [ ] Agent timeout handling
  - [ ] Show timeout message after 30 seconds
  - [ ] Allow user to cancel and retry
  - [ ] Preserve unsaved draft

- [ ] Concurrent request handling
  - [ ] Prevent duplicate message submissions
  - [ ] Queue messages during redirect
  - [ ] Process messages in order

- [ ] Goal deletion after redirect (edge case handling)
  - [ ] **Scenario:** User gets redirected to a goal, but that goal was deleted before they arrived
  - [ ] **Not about:** Swipe-to-logout from scanner (that's auth, not goal deletion)
  - [ ] **Implementation:**
    - Catch 404 "Goal not found" error when navigating to goal chat
    - Show friendly message: "This goal was deleted. Let me take you back to overview."
    - Auto-redirect to Overview agent after 2 seconds
    - Or offer "Go back to overview" button
  - [ ] **Alternative:** If goal was deleted but still referenced elsewhere (e.g., subgoal parent), handle gracefully

---

## Performance

### Low Priority

- [ ] Chat message virtualization
  - [ ] Render only visible messages (20-30 at a time)
  - [ ] Lazy load older messages on scroll
  - [ ] Keep scroll position on load

- [ ] Optimistic UI updates
  - [ ] Show user message immediately
  - [ ] Update agent response as it streams
  - [ ] Rollback on error

- [ ] Caching strategies
  - [ ] Cache agent responses
  - [ ] Cache goal data
  - [ ] Invalidate cache on updates

---

## Documentation

- [ ] Update AGENTS.md with redirect UI patterns
  - [ ] Document Redirect Card component
  - [ ] Explain toast notification system
  - [ ] Add code examples for handling redirects

- [ ] Create component storybook
  - [ ] Redirect Card stories
  - [ ] Proposal Button stories
  - [ ] Chat View stories with all agent types
