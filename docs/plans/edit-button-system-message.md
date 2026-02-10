# Edit Button System Message Feature

## Overview

When users click the **Edit** button on an AI proposal and send a modification request, the AI currently has no context that they're editing a previous proposal. This causes confusion and incorrect responses.

**Solution:** Send a system message before the user's edit request that contains the original proposal details.

---

## Current Problem

### User Flow (Broken)

1. AI creates a proposal:
   ```
   CREATE_GOAL: {"type":"action","title":"Bench 225x1",...}
   Does this look good?
   ```

2. User clicks **Edit**, types: "Make deadline last day of December 2026"

3. AI receives only the user's message, no context about what they're editing:
   ```
   User: "Make deadline last day of December 2026"
   ```

4. AI gets confused, tries wrong commands like `UPDATE_FILTERS`

---

## Solution

### User Flow (Fixed)

1. AI creates a proposal

2. User clicks **Edit**, types: "Make deadline last day of December 2026"

3. Frontend sends a system message BEFORE the user's message:
   ```
   System: User is editing the previous proposal. Original proposal:
   {
     "type": "action",
     "title": "Bench 225x1",
     "deadline": "2027-01-31T23:59:59",
     "tasks": [{"title": "Measure 1RM bench"}]
   }

   User's modification request follows:
   ```

4. User's message is sent:
   ```
   User: "Make deadline last day of December 2026"
   ```

5. AI has full context and responds correctly:
   ```
   UPDATE_TITLE: {"goalId":"<id>","title":"Bench 225x1",...}
   ```

---

## Implementation Plan

### Phase 1: Backend Changes

#### 1.1 Update System Prompts

**Files to modify:**
- `/home/trill/Development/neon-goals-service/src/modules/ai/openai.service.ts`
- `/home/trill/Development/neon-goals-service/src/modules/ai/specialist-prompts.ts`

**Add to system prompts:**

```typescript
## Edit Context

When you receive a system message indicating the user is editing a previous proposal:

1. **Parse the original proposal** from the system message
2. **Apply the user's changes** to create a modified proposal
3. **Output a NEW proposal command** with the changes applied
4. **Keep all required fields** including `proposalType` and `awaitingConfirmation`

**Example System Message:**
```
System: User is editing the previous proposal. Original proposal:
{"type":"action","title":"Bench 225x1","deadline":"2027-01-31T23:59:59","tasks":[...]}

User's modification request follows:
```

**Example User Message:**
```
User: "Make deadline last day of December 2026"
```

**Example AI Response:**
```
I'll update the deadline to December 31, 2026.

UPDATE_TITLE: {"goalId":"<id>","title":"Bench 225x1","deadline":"2026-12-31T23:59:59","tasks":[{"title":"Measure 1RM bench"}],"proposalType":"confirm_edit_cancel","awaitingConfirmation":true}
Does this look good?
```

**Important:**
- The goalId in the original proposal may be a placeholder like `"123"` or `"<goal-id>"` - preserve it or use the actual goalId from context
- If the original proposal has `"<id>"` placeholders, replace them with the actual values from the conversation context
- All other fields from the original proposal should be preserved unless explicitly changed by the user
```

---

### Phase 2: Frontend Changes

#### 2.1 Identify Proposal Components

**Files to examine:**
- `/home/trill/Development/neon-goals-ui/src/components/ai/ProposalActions.tsx` (or similar)
- Any components handling proposal display and actions (Confirm/Edit/Cancel buttons)

**Find:**
- Where the Edit button is rendered
- Where Edit clicks are handled
- Where messages are sent to the AI

---

#### 2.2 Store Pending Proposal State

**Location:** Likely in a Redux slice or context provider (e.g., `chatSlice.ts`)

**Add state:**
```typescript
pendingProposal: {
  proposalType: string | null;
  proposalData: any | null;  // The full proposal object
}
```

**When a proposal is created:**
- Store the proposal data when the AI sends a message with `proposalType`
- This is the most recent pending proposal awaiting user action

---

#### 2.3 Detect Edit Button Click

**In the component that handles the Edit button:**

```typescript
const handleEdit = (proposalData: any) => {
  // 1. Store that we're in edit mode
  // 2. Store the original proposal
  // 3. Enable input field for user to type their modification

  dispatch(setEditMode({
    isActive: true,
    originalProposal: proposalData
  }));
};
```

---

#### 2.4 Send System Message with Proposal

**When user sends their edit request:**

```typescript
const sendMessage = (userMessage: string) => {
  const messages = [];

  // If in edit mode, prepend system message with original proposal
  if (isEditMode && originalProposal) {
    messages.push({
      role: 'system',
      content: `User is editing the previous proposal. Original proposal:\n${JSON.stringify(originalProposal, null, 2)}\n\nUser's modification request follows:`
    });
  }

  // Add user's message
  messages.push({
    role: 'user',
    content: userMessage
  });

  // Clear edit mode
  dispatch(clearEditMode());

  // Send to API
  return apiClient.post(`/ai/${chatType}/chat`, { messages });
};
```

---

#### 2.5 Handle System Message Display

**Important:** System messages should be:
- **Not displayed** to the user in the chat UI
- **Only sent** to the backend for AI context
- **Filtered out** from the message history shown in the UI

**In the message display component:**

```typescript
// Filter out system messages from display
const visibleMessages = messages.filter(m => m.role !== 'system');
```

---

## Files to Modify

### Backend (2 files)

1. `/home/trill/Development/neon-goals-service/src/modules/ai/openai.service.ts`
   - Update `getOverviewSystemPrompt()` with edit context instructions
   - Update `getGoalViewSystemPrompt()` with edit context instructions

2. `/home/trill/Development/neon-goals-service/src/modules/ai/specialist-prompts.ts`
   - Add edit context instructions to all specialist prompts

---

### Frontend (3-5 files)

1. **Chat state management** (likely Redux slice):
   - `src/store/chatSlice.ts` or similar
   - Add `pendingProposal` and `isEditMode` state

2. **Proposal actions component**:
   - `src/components/ai/ProposalActions.tsx` or similar
   - Handle Edit button click
   - Store original proposal

3. **Chat input component**:
   - `src/components/ai/ChatInput.tsx` or similar
   - Check for edit mode before sending messages
   - Prepend system message if editing

4. **Message display component**:
   - `src/components/ai/MessageList.tsx` or similar
   - Filter out system messages from display

---

## Testing Strategy

### 1. Backend Unit Tests

Test that system prompts correctly handle edit context:

```typescript
describe('Edit Context Handling', () => {
  it('should parse original proposal from system message', async () => {
    const messages = [
      {
        role: 'system',
        content: 'User is editing the previous proposal. Original proposal:\n{"type":"action","title":"Bench 225x1","deadline":"2027-01-31T23:59:59"}'
      },
      {
        role: 'user',
        content: 'Make deadline last day of December 2026'
      }
    ];

    const response = await openaiService.chat(messages);

    expect(response).toContain('2026-12-31T23:59:59');
  });
});
```

---

### 2. Frontend Integration Tests

Test the edit flow:

```typescript
describe('Edit Button Flow', () => {
  it('should send system message when user edits proposal', async () => {
    // 1. Render chat with pending proposal
    // 2. Click Edit button
    // 3. Type modification
    // 4. Send message
    // 5. Verify system message was sent to API
    // 6. Verify system message is not displayed in UI
  });
});
```

---

### 3. Manual Testing Checklist

- [ ] Create a goal via AI chat
- [ ] Click Edit button
- [ ] Type a modification (e.g., "Change deadline to next week")
- [ ] Verify AI responds with updated proposal
- [ ] Verify original proposal fields are preserved
- [ ] Verify only changed fields are modified
- [ ] Verify system message doesn't appear in chat UI
- [ ] Test with different proposal types (CREATE_GOAL, UPDATE_TITLE, etc.)
- [ ] Test with specialist chats (items, finances, actions)

---

## Rollback Plan

If issues occur:

1. **Backend:** Remove edit context instructions from system prompts
2. **Frontend:** Remove system message sending logic
3. **Alternative:** Revert to Option 1 (conversation history detection only)

---

## Deployment

1. **Deploy backend first:**
   - Commit and push system prompt changes
   - Deploy to production: `ssh ec2 "cd /var/www/Neon-Goals-Service && git pull && npm run build && pm2 restart neon-goals-service"`

2. **Deploy frontend:**
   - Commit and push frontend changes
   - Deploy to production: `ssh ec2 "cd /var/www/Neon-Goals-UI && git pull && npm run build"`

3. **Test on production:**
   - Create a test goal
   - Edit the proposal
   - Verify correct AI response

---

## Timeline Estimate

- Backend system prompt updates: 30 minutes
- Frontend state and logic changes: 2-3 hours
- Testing and refinement: 1 hour
- Total: ~3-4 hours
