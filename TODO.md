# TODO - Neon Goals UI

---

## Agent Redirect & Handoff UI

### High Priority — ✅ Complete

- [x] Implement redirect command parser
- [x] Create Redirect Card component (inline in chat)
- [x] Update Chat View to handle redirects
- [x] Implement toast notification system (post-navigation)

### Medium Priority

- [x] Add breadcrumb navigation (GoalBreadcrumb integrated in GoalDetailView)
- [ ] Unsaved draft warnings
- [x] Loading states during redirect (spinner + disabled buttons in RedirectCard)
- [ ] Manual navigation fallback

### Low Priority

- [ ] Redirect analytics

---

## Agent Message Components

### High Priority — ✅ Complete

- [x] Agent Message wrapper component (ChatPanel MessageBubble handles command parsing, proposals, redirects, extractions)
- [x] Proposal Button components (Confirm/Edit/Cancel + Accept/Decline with expand-on-hover)
- [ ] Streaming text display
  - [ ] Wire streaming APIs (chatStream) into useChatStore instead of non-streaming chat()
  - [ ] Replace Send button with Stop button while agent is responding
  - [ ] Render streamed text character-by-character using StreamingIndicator component (exists but unused)
  - [ ] Show typing indicator at end of stream

---

## Chat UX Improvements

### Medium Priority

- [x] Message actions (hover menu on each message)
  - [x] Copy message text to clipboard
  - [x] Like/dislike buttons for feedback
  - [ ] Quote/reply to message
  - [ ] Report incorrect response
  - [ ] Delete own messages

- [ ] Quick actions in chat header (toolbar at top of chat)
- [ ] Input enhancements (suggested questions, slash commands)

---

## Error Handling & Edge Cases

### High Priority

- [ ] Fix swipe-in-scanner logout bug (Demo Mode)

### Medium Priority

- [ ] Network error handling (retry logic)
- [ ] Agent timeout handling
- [ ] Concurrent request handling
- [ ] Goal deletion after redirect (404 graceful handling)

---

## Performance

### Low Priority

- [ ] Chat message virtualization
- [ ] Optimistic UI updates
- [ ] Caching strategies

---

## Documentation

- [ ] Update AGENTS.md with redirect UI patterns
- [ ] Create component storybook
