# Phase 1 Implementation Plan: Extract State Management Hooks

## Overview
Refactor `RestaurantFindings.tsx` (6,271 lines) by extracting state into 4 focused hooks. Each hook will be implemented and validated independently before moving to the next.

---

## Step 1: Extract Restaurant Data Hook

### Implementation Tasks
- [x] Create `src/hooks/useRestaurantData.ts`
- [x] Extract these state variables and their operations:
  - `restaurantData`, `setRestaurantData`
  - `kpiData`, `setKPIData`
  - `reggiDimensions`, `setReggiDimensions`
  - `toolsData`, `setToolsData`
  - `customKnowledge`, `setCustomKnowledge`
  - `loadingKPIs`, `loadingREGGI`, `loadingTools`, `loadingKnowledge`
- [x] Move related `useEffect` hooks for data loading
- [x] Move `loadRestaurantData`, `loadKPIs`, `loadREGGI`, `loadTools`, `loadCustomKnowledge` functions into hook
- [x] Update `RestaurantFindings.tsx` to use `const { restaurantData, kpiData, reggiDimensions, toolsData, customKnowledge, operations } = useRestaurantData(id)`

### Validation Checklist
- [x] Restaurant profile displays correctly on page load
- [x] KPI section displays existing data
- [x] REGGI dimensions display correctly
- [x] Tools section shows configured tools
- [x] Custom knowledge items appear in the list
- [x] No console errors on page load
- [x] No TypeScript errors

### Acceptance Criteria
✅ All restaurant profile data loads and displays identically  
✅ Editing KPIs still works (inline edit, save)  
✅ Editing REGGI codes still works  
✅ Adding/removing tools still works  
✅ Custom knowledge CRUD operations work  
✅ No performance degradation (check React DevTools Profiler)  

---

## Step 2: Extract Conversation State Hook (BROKEN INTO SUB-STEPS)

⚠️ **Due to RestaurantFindings.tsx being 6k+ lines, this step is broken into smaller, safer increments**

### Step 2a: Create Hook Skeleton & Extract State Declarations ✅
**Goal**: Create the hook file with all state variables, return them, but NO logic yet

- [x] Create `src/hooks/useConversationState.ts` with basic structure
- [x] Add these state declarations to the hook:
  - `currentConversationId`, `setCurrentConversationId`
  - `conversations`, `setConversations`
  - `messages`, `setMessages`
  - `currentParticipants`, `setCurrentParticipants`
  - `conversationState`, `setConversationState`
  - `currentConversationVisibility`, `setCurrentConversationVisibility`
  - `notionEnabled`, `setNotionEnabled`
  - `hardModeEnabled`, `setHardModeEnabled`
  - `messageFeedback`, `setMessageFeedback`
  - `lastMessagePreviews`, `setLastMessagePreviews`
- [x] Return all state variables from hook
- [x] Import hook in `RestaurantFindings.tsx` (but don't remove old state yet)
- [x] Verify no TypeScript errors

**Validation**: Page still works, no build errors

---

### Step 2b: Move Data Loading Functions ✅
**Goal**: Move `loadConversations`, `loadCurrentConversationParticipants` into hook

- [x] Move `loadConversations` function into hook
- [x] Move `loadCurrentConversationParticipants` function into hook
- [x] Add `restaurantId` and `userId` as hook parameters
- [x] Return these functions from hook
- [x] Update calls in `RestaurantFindings.tsx` to use hook functions
- [x] Remove old function definitions from `RestaurantFindings.tsx`

**Validation**: Conversation list still loads, participants display

---

### Step 2c: Move Conversation CRUD Operations ✅
**Goal**: Move create, delete, visibility toggle functions

- [x] Move `handleNewConversation` into hook
- [x] Move `handleDeleteConversation` into hook
- [x] Move `handleToggleVisibility` into hook
- [x] Move `handleLoadConversation` into hook
- [x] Return these functions from hook
- [x] Update calls in `RestaurantFindings.tsx` to use hook functions
- [x] Remove old function definitions from `RestaurantFindings.tsx`

**Validation**: Creating, deleting, loading conversations still works

---

### Step 2d: Move Realtime Subscriptions ✅
**Goal**: Move useEffect hooks for realtime subscriptions

- [x] Move message realtime subscription useEffect into hook
- [x] Ensure subscriptions clean up properly
- [x] Remove old useEffect blocks from `RestaurantFindings.tsx`

**Validation**: Realtime updates still work (test sending message in another tab)

---

### Step 2e: Final Cleanup & State Removal ✅
**Goal**: Remove duplicate state declarations from RestaurantFindings.tsx

- [x] Remove all conversation state `useState` declarations from `RestaurantFindings.tsx`
- [x] Verify all references now use hook state
- [x] Run full TypeScript check
- [x] Test entire conversation flow end-to-end

**Validation**: No duplicate declarations, all features work

---

### Overall Validation Checklist (After All Sub-Steps)
- [ ] Conversation list loads on sidebar
- [ ] Clicking a conversation loads its messages
- [ ] Creating new conversation works
- [ ] Messages appear in chat interface
- [ ] Participants display correctly
- [ ] Realtime updates still work (test with another user if possible)
- [ ] Conversation visibility toggle works
- [ ] No console errors
- [ ] No TypeScript errors

### Acceptance Criteria
✅ All existing conversations load in sidebar  
✅ Switching between conversations works  
✅ Creating new conversation works  
✅ Messages load and display correctly  
✅ Sending new message works  
✅ Participants list is accurate  
✅ Realtime message updates work  
✅ Conversation settings (visibility, title) work

---

## Step 3: Extract File Management Hook

### Implementation Tasks
- [ ] Create `src/hooks/useFileManagement.ts`
- [ ] Extract these state variables and their operations:
  - `files`, `setFiles`
  - `permanentFiles`, `setPermanentFiles`
  - `uploadingFiles`, `setUploadingFiles`
  - `fileSearchQuery`, `setFileSearchQuery`
  - `selectedTags`, `setSelectedTags`
- [ ] Move `loadConversationFiles`, `loadPermanentFiles`, `uploadFile`, `deleteFile`, `moveToKnowledgeBase` functions into hook
- [ ] Move file-related `useEffect` hooks
- [ ] Update `RestaurantFindings.tsx` to use `const { files, permanentFiles, uploadingFiles, operations } = useFileManagement(id, currentConversationId)`

### Validation Checklist
- [ ] Conversation files panel shows files
- [ ] Knowledge base tab shows permanent files
- [ ] File upload (drag-drop and click) works
- [ ] File download works
- [ ] File deletion works
- [ ] Moving file to knowledge base works
- [ ] File search/filter works
- [ ] File tags display correctly
- [ ] No console errors
- [ ] No TypeScript errors

### Acceptance Criteria
✅ Files load in conversation file panel  
✅ Permanent files load in knowledge base  
✅ File upload works (both methods)  
✅ File operations (download, delete, move) work  
✅ File search and filtering work  
✅ File tags display and can be edited  
✅ Upload progress indicators work  

---

## Step 4: Extract Onboarding State Hook

### Implementation Tasks
- [ ] Create `src/hooks/useOnboarding.ts`
- [ ] Extract these state variables and their operations:
  - `showQuickWin`, `setShowQuickWin`
  - `quickWinPhase`, `setQuickWinPhase`
  - `currentREGGIDimension`, `setCurrentREGGIDimension`
  - `reggiProgress`, `setReggiProgress`
  - `showOnboarding`, `setShowOnboarding`
  - `showKPIInput`, `setShowKPIInput`
  - `showTuning`, `setShowTuning`
- [ ] Move `handleQuickWinComplete`, `handleREGGIDimensionComplete`, `checkOnboardingStatus` functions into hook
- [ ] Move onboarding-related `useEffect` hooks
- [ ] Update `RestaurantFindings.tsx` to use `const { onboardingState, operations } = useOnboarding(id, restaurantData)`

### Validation Checklist
- [ ] Quick Win onboarding appears for new restaurants
- [ ] REGGI dimension flow progresses correctly
- [ ] KPI input phase works
- [ ] Tuning phase works
- [ ] Onboarding can be completed
- [ ] Onboarding doesn't show for completed restaurants
- [ ] No console errors
- [ ] No TypeScript errors

### Acceptance Criteria
✅ Quick Win onboarding triggers correctly for new users  
✅ REGGI dimension progression works (all 6 dimensions)  
✅ KPI collection phase completes  
✅ Tuning profile setup completes  
✅ Onboarding completion persists  
✅ Returning users don't see onboarding  
✅ Can exit/re-enter onboarding safely  

---

## Step 5: Final Integration & Testing

### Implementation Tasks
- [ ] Review `RestaurantFindings.tsx` for any remaining duplicated logic
- [ ] Ensure all state is now managed by hooks
- [ ] Verify TypeScript types are correct across all hooks
- [ ] Add JSDoc comments to hooks for documentation
- [ ] Run through full user flow manually

### Validation Checklist
- [ ] Complete end-to-end flow: Login → Select restaurant → Onboarding → Chat → Upload file → Adjust settings
- [ ] Test mobile responsive layout
- [ ] Test desktop layout with all panels
- [ ] Test with multiple conversations
- [ ] Test with large message history (50+ messages)
- [ ] Test with multiple files uploaded
- [ ] Test all settings panels (KPIs, REGGI, Tools, Team, etc.)
- [ ] No console errors anywhere
- [ ] No TypeScript errors
- [ ] Performance is maintained (check load times, interaction responsiveness)

### Acceptance Criteria
✅ All features work identically to before refactor  
✅ No regressions in any workflow  
✅ Code is more maintainable (state is organized)  
✅ `RestaurantFindings.tsx` is ~40% smaller  
✅ TypeScript builds without errors  
✅ No new console warnings or errors  
✅ Performance is equal or better  

---

## Risk Mitigation Strategy

### Before Starting
1. **Create a backup branch**: `git checkout -b backup/before-phase1-refactor`
2. **Document current state**: Take screenshots of all major UI sections
3. **Note current performance**: Record initial load time, interaction times

### During Implementation
1. **One step at a time**: Complete and validate each step before moving to next
2. **Commit after each step**: Small, focused commits for easy rollback
3. **Test immediately**: Don't accumulate untested changes

### If Something Breaks
1. **Identify the step**: Which specific change caused the issue?
2. **Isolate the problem**: Is it state, logic, or TypeScript types?
3. **Fix forward or rollback**: Fix the issue if quick, otherwise rollback the step
4. **Re-validate**: Run through acceptance criteria again

---

## Success Metrics

### Code Quality
- ✅ `RestaurantFindings.tsx` reduced from 6,271 lines to ~4,000 lines
- ✅ State variables reduced from 70+ to ~30
- ✅ 4 new reusable hooks created
- ✅ No duplicated state logic

### Functionality
- ✅ Zero breaking changes
- ✅ All features work identically
- ✅ No new bugs introduced

### Developer Experience
- ✅ Easier to find restaurant-related state (in `useRestaurantData`)
- ✅ Easier to debug conversation issues (in `useConversationState`)
- ✅ Clear separation of concerns

---

## Progress Tracking

### Current Status: Step 1 Complete ✅

| Step | Status | Date Completed | Notes |
|------|--------|----------------|-------|
| Step 1: Restaurant Data Hook | ✅ Complete | 2025-11-06 | Successfully extracted restaurant data management |
| Step 2a: Create Hook Skeleton | ✅ Complete | 2025-11-06 | Hook structure and state declarations |
| Step 2b: Move Data Loading Functions | ✅ Complete | 2025-11-06 | Conversation and participant loading |
| Step 2c: Move Conversation CRUD Operations | ✅ Complete | 2025-11-06 | Successfully moved conversation management functions |
| Step 2d: Move Realtime Subscriptions | ✅ Complete | 2025-11-06 | Message realtime subscription moved to hook |
| Step 2e: Final Cleanup & State Removal | ✅ Complete | 2025-11-06 | Removed duplicate state declarations |
| Step 3: File Management Hook | ⏳ Not Started | - | - |
| Step 4: Onboarding Hook | ⏳ Not Started | - | - |
| Step 5: Final Integration | ⏳ Not Started | - | - |

---

## Next Steps

**Proceeding with Step 2: Extract Conversation State Hook (Broken into Sub-Steps)**

Due to the large size of RestaurantFindings.tsx (6k+ lines), Step 2 will be implemented in smaller, safer increments.
