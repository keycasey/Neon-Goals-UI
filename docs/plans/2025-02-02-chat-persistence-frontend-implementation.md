# Frontend Implementation Plan: Chat Persistence & Specialist System

## Overview

This plan covers the frontend implementation for the Chat Persistence & Specialist System that was implemented on the backend. The backend is fully functional with all endpoints tested and working.

## Backend Status: ✅ Complete

All backend endpoints are implemented and tested:
- ✅ Overview chat (`/chats/overview`, `/ai/overview/chat`)
- ✅ Category specialist chats (`/chats/category/:id`, `/ai/specialist/category/:id/chat`)
- ✅ SSE streaming (`/ai/overview/chat/stream`, `/ai/specialist/category/:id/chat/stream`)
- ✅ Stream stop (`/ai/overview/chat/stop`, `/ai/specialist/category/:id/chat/stop`)
- ✅ Message editing (`PUT /chats/:id/messages/:messageId`)
- ✅ Goal modification commands (ADD_TASK, TOGGLE_TASK, UPDATE_TITLE, UPDATE_FILTERS, ARCHIVE_GOAL)

## Services Updated: ✅ Complete

The following service files have been updated:
- ✅ `src/services/chatsService.ts` - Added overview, category, and edit endpoints
- ✅ `src/services/apiClient.ts` - Added `postStream()` method for SSE
- ✅ `src/services/aiOverviewChatService.ts` - Added stopStream, confirmCommands, cancelCommands
- ✅ `src/services/aiSpecialistChatService.ts` - NEW - Specialist chat service

---

## Phase 1: Chat Routing & Navigation

### Tasks

#### 1.1 Add Chat Type Routing

**Files to update:**
- `src/App.tsx` or router configuration
- `src/components/layout/Sidebar.tsx`

**Changes:**
```typescript
// Add chat type routes
const chatRoutes = [
  { path: '/chat/overview', label: 'Overview', specialist: null },
  { path: '/chat/items', label: 'Items', specialist: 'items' },
  { path: '/chat/finances', label: 'Finances', specialist: 'finances' },
  { path: '/chat/actions', label: 'Actions', specialist: 'actions' },
];
```

#### 1.2 Update Sidebar Navigation

**File:** `src/components/layout/Sidebar.tsx`

Add navigation items for:
- Overview Chat
- Items Specialist
- Finances Specialist
- Actions Specialist

---

## Phase 2: Chat Components

### Tasks

#### 2.1 Create SpecialistChatPanel Component

**New file:** `src/components/chat/SpecialistChatPanel.tsx`

**Features:**
- Reusable component for all 3 specialist types
- Props: `categoryId`, `categoryName`, `categoryIcon`
- Streaming support
- Command preview/confirmation UI
- Message editing support

**Interface:**
```typescript
interface SpecialistChatPanelProps {
  categoryId: 'items' | 'finances' | 'actions';
  categoryName: string;
  categoryIcon: string;
}

export function SpecialistChatPanel({ categoryId, categoryName, categoryIcon }: SpecialistChatPanelProps) {
  // Implementation
}
```

#### 2.2 Update ChatPanel Component

**File:** `src/components/chat/ChatPanel.tsx`

**Add:**
- Message editing UI (double-click or edit button on messages)
- Stream stop button (visible only when streaming)
- Command confirmation modal/dialog

#### 2.3 Create CommandPreview Component

**New file:** `src/components/chat/CommandPreview.tsx`

**Features:**
- Display parsed commands in a preview format
- Show what will be changed (before/after)
- Confirm/Cancel buttons
- Support for each command type:
  - UPDATE_TITLE: Show old title → new title
  - ADD_TASK: Show task to be added
  - TOGGLE_TASK: Show task completion toggle
  - UPDATE_FILTERS: Show filter changes
  - ARCHIVE_GOAL: Show archive warning

#### 2.4 Create StreamingIndicator Component

**New file:** `src/components/chat/StreamingIndicator.tsx`

**Features:**
- Animated typing indicator during streaming
- Stop button to abort stream
- Auto-dismiss on stream completion

---

## Phase 3: State Management

### Tasks

#### 3.1 Extend Chat State

**File:** `src/store/useAppStore.ts` (or wherever chat state is managed)

**Add:**
```typescript
interface ChatState {
  // Current chats
  overviewChat: ChatState | null;
  categoryChats: {
    items: ChatState | null;
    finances: ChatState | null;
    actions: ChatState | null;
  };

  // Streaming state
  activeStreams: Set<string>; // Stream IDs that are currently active

  // Pending commands
  pendingCommands: {
    chatId: string;
    commands: ChatCommand[];
    timestamp: number;
  } | null;

  // Actions
  setActiveStream: (chatId: string, active: boolean) => void;
  setPendingCommands: (chatId: string, commands: ChatCommand[]) => void;
  clearPendingCommands: () => void;
}
```

---

## Phase 4: Integration

### Tasks

#### 4.1 Connect Overview Chat

**Route:** `/chat/overview`

**Service:** `aiOverviewChatService`

**Features:**
- Display all active goals
- Support goal creation/modification commands
- Stream responses
- Confirm/cancel commands

#### 4.2 Connect Category Specialist Chats

**Routes:**
- `/chat/items` → Items Specialist
- `/chat/finances` → Finances Specialist
- `/chat/actions` → Actions Specialist

**Service:** `aiSpecialistChatService`

**Features:**
- Display category-specific goals only
- Support category-specific commands
- Specialist persona in responses
- Stream responses
- Confirm/cancel commands

#### 4.3 Update Goal Chat

**Route:** `/chat/goal/:goalId`

**Add:**
- Message editing capability
- Stream stop functionality

---

## Phase 5: UI/UX Enhancements

### Tasks

#### 5.1 Command Feedback

**When commands are detected:**
1. Show command preview in a modal/dialog
2. Display "Before" and "After" states
3. Highlight what will change
4. Provide "Confirm" and "Cancel" buttons

#### 5.2 Stream Control

**During streaming:**
1. Show streaming indicator
2. Display "Stop" button
3. On stop, preserve partial response
4. Allow user to continue conversation

#### 5.3 Message Editing

**When editing a message:**
1. Double-click or click edit button on message
2. Show inline edit form
3. On save:
   - Delete all messages after edited message
   - Resend conversation from that point
   - Update chat with new AI response

#### 5.4 Specialist Personas

**Visual differentiation per specialist:**
| Specialist | Color Theme | Icon |
|------------|-------------|------|
| Items | Blue/Shopping | 🛍️ |
| Finances | Green/Dollar | 💰 |
| Actions | Orange/Target | 🎯 |

---

## Phase 6: Testing Checklist

### Unit Tests

- [ ] ChatService methods return correct data
- [ ] SpecialistChatService handles all command types
- [ ] apiClient.postStream() returns ReadableStream
- [ ] Command preview renders all command types
- [ ] Message editing flow

### Integration Tests

- [ ] Overview chat fetches and displays messages
- [ ] Category specialist chats fetch correct goals
- [ ] Streaming receives and displays chunks
- [ ] Stream stop aborts active stream
- [ ] Message edit deletes subsequent messages
- [ ] Command confirmation executes correct API

### E2E Tests (Browser)

- [ ] Complete conversation flow in Overview chat
- [ ] Complete conversation flow in each Specialist chat
- [ ] Create goal via chat → Confirm → Verify goal created
- [ ] Add task via Actions chat → Confirm → Verify task added
- [ ] Update title via chat → Confirm → Verify title changed
- [ ] Toggle task completion → Verify task toggled
- [ ] Archive goal → Verify goal archived
- [ ] Edit message → Verify cascade delete and re-fetch
- [ ] Start stream → Stop → Verify abort

---

## Dependencies

### New Files to Create

1. `src/components/chat/SpecialistChatPanel.tsx`
2. `src/components/chat/CommandPreview.tsx`
3. `src/components/chat/StreamingIndicator.tsx`

### Files to Update

1. `src/services/chatsService.ts` ✅ Done
2. `src/services/apiClient.ts` ✅ Done
3. `src/services/aiOverviewChatService.ts` ✅ Done
4. `src/services/aiSpecialistChatService.ts` ✅ Done (new)
5. `src/App.tsx` - Add routes
6. `src/components/layout/Sidebar.tsx` - Add navigation
7. `src/components/chat/ChatPanel.tsx` - Add editing, streaming, commands
8. `src/store/useAppStore.ts` - Extend state

---

## Implementation Order

**Suggested sequence:**
1. Phase 3 (State Management) - Foundation for other features
2. Phase 2.1 (SpecialistChatPanel) - Core component
3. Phase 4.2 (Category Chats) - Connect to backend
4. Phase 2.3 (CommandPreview) - Enable command flow
5. Phase 4.1 (Overview Chat) - Connect overview
6. Phase 2.4 (StreamingIndicator) - Polish UX
7. Phase 5 (UI/UX) - Visual enhancements
8. Phase 6 (Testing) - Validate everything

**Can be done in parallel:**
- Phase 1 (Routing) - Independent
- Phase 2.2 (ChatPanel updates) - After panel created
- Phase 4.3 (Goal Chat) - Independent

---

## Open Questions

1. **Message persistence** - Should we store full message history locally or fetch from API each time?
2. **Command history** - Should we show past commands in a sidebar/drawer?
3. **Real-time updates** - Do we need WebSocket for goal updates across sessions?
4. **Offline support** - Should chats be available offline?

---

## Notes

- Backend API is fully functional and tested
- All services are properly typed with TypeScript
- SSE streaming is supported with `postStream()` method
- Command parsing is handled by backend, frontend just displays confirms
- Message editing uses cascade delete on backend
- Stream stop uses simple POST endpoint

---

## Related Documentation

- Backend Design: `../neon-goals-service/docs/plans/2025-02-02-chat-persistence-design.md`
- Backend Implementation Plan: `../neon-goals-service/docs/plans/2025-02-02-chat-persistence-implementation.md`
- API Endpoints: See backend controller files for full API reference
