# Manager Log Synthesis Hub - Implementation Plan

## Overview
Transform the desktop Manager Log from a simple capture interface into a powerful synthesis hub that aggregates, reviews, and structures information captured via the PWA.

## Architecture Philosophy
- **Mobile/PWA**: Quick capture interface (voice memos, text entries)
- **Desktop**: Command center for review, synthesis, and structuring into shift narratives

---

## Phase 1: Foundation - Two-Panel Layout & Batch Transcription

### 1.1 Two-Panel Desktop Layout

**Goal**: Create a split-screen interface optimized for desktop workflows

**Components to Create**:
- `src/components/manager-log/DesktopLayout.tsx` - Main layout container
- `src/components/manager-log/MemoListPanel.tsx` - Left panel with memo list
- `src/components/manager-log/SynthesisPanel.tsx` - Right panel for synthesis work

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│  Manager Log - [Date] - [Shift]                │
├──────────────────┬──────────────────────────────┤
│                  │                              │
│  Memo List       │   Synthesis Panel            │
│  (Left Panel)    │   (Right Panel)              │
│                  │                              │
│  - Filter/Sort   │   - Selected memo details    │
│  - Bulk actions  │   - Edit transcription       │
│  - Status badges │   - Add to draft narrative   │
│  - Quick preview │   - AI synthesis tools       │
│                  │                              │
│  [Memo 1]        │   [Content area]             │
│  [Memo 2]        │                              │
│  [Memo 3]        │   [Actions]                  │
│                  │                              │
└──────────────────┴──────────────────────────────┘
```

**Features**:
- Resizable panels using `react-resizable-panels`
- Persistent panel sizes (localStorage)
- Responsive collapse on smaller screens (< 1024px)
- Keyboard shortcuts (Cmd/Ctrl + [ / ])

### 1.2 Batch Transcription Workflow

**Goal**: Enable efficient review and editing of multiple voice memos

**Components to Create**:
- `src/components/manager-log/BatchTranscriptionView.tsx` - Main batch interface
- `src/components/manager-log/MemoCard.tsx` - Individual memo card with inline editing
- `src/components/manager-log/TranscriptionBulkActions.tsx` - Bulk action toolbar

**Workflow States**:
1. **Pending Review** - New transcriptions awaiting review
2. **In Review** - Currently being edited/verified
3. **Approved** - Ready for synthesis
4. **Used in Draft** - Already incorporated into narrative

**Features**:
- Filter by transcription status
- Sort by time, duration, category
- Bulk status updates
- Inline transcription editing
- Audio playback in-place
- Category assignment (bulk or individual)
- Quick approve/reject actions
- Progress tracking (X of Y reviewed)

**Keyboard Shortcuts**:
- `Space` - Play/pause audio
- `E` - Edit transcription
- `A` - Approve current memo
- `Tab` - Next memo
- `Shift + Tab` - Previous memo
- `C` - Change category

### 1.3 Enhanced Memo List Panel

**Features**:
- **Filters**:
  - Status (pending, processing, completed, failed)
  - Category (kitchen, service, bar, etc.)
  - Used in draft (yes/no)
  - Date range
  
- **Sort Options**:
  - Time (newest/oldest)
  - Duration (longest/shortest)
  - Status
  - Category

- **Bulk Actions**:
  - Select multiple memos (checkbox)
  - Bulk category assignment
  - Bulk status update
  - Bulk delete
  - Export selected

- **Visual Indicators**:
  - Status badges (color-coded)
  - Duration pill
  - Category tag
  - "Used in draft" indicator
  - Unreviewed highlight

### 1.4 Synthesis Panel Enhancements

**Tabs/Modes**:
1. **Review** - Single memo review and editing
2. **Synthesize** - Multi-memo synthesis (Phase 2)
3. **Draft** - Build shift narrative (Phase 2)

**Review Mode Features** (Phase 1):
- Full transcription display
- Inline editing with auto-save
- Audio player with waveform visualization
- Category selector
- Add notes/context
- Mark as "used in draft"
- Quick actions:
  - Copy to clipboard
  - Add to draft
  - Regenerate transcription
  - Delete

---

## Phase 2: Smart Synthesis Tools

### 2.1 Multi-Memo Synthesis

**Component**: `src/components/manager-log/MultiMemoSynthesis.tsx`

**Features**:
- Select multiple memos to synthesize
- AI-powered narrative generation combining multiple memos
- Theme/topic extraction
- Suggested narrative structure
- Edit and refine AI-generated content

### 2.2 Pattern Detection

**Component**: `src/components/manager-log/PatternDetector.tsx`

**Features**:
- Identify recurring themes across memos
- Detect anomalies or unusual mentions
- Highlight correlations with Toast POS data
- Suggest tags and categories based on patterns

### 2.3 Draft Log Builder

**Component**: `src/components/manager-log/DraftLogBuilder.tsx`

**Features**:
- Drag-and-drop memo organization
- Section-based narrative structure:
  - Opening summary
  - Operations highlights
  - Issues/concerns
  - Action items
  - Closing notes
- AI-assisted writing
- Version history
- Collaboration comments

---

## Phase 3: Advanced Features

### 3.1 Timeline Visualization

**Component**: `src/components/manager-log/ShiftTimeline.tsx`

**Features**:
- Visual timeline of shift events
- Memos plotted chronologically
- Toast POS events overlay
- Click to view memo details
- Zoom and pan controls

### 3.2 Toast POS Integration

**Features**:
- Overlay sales data on timeline
- Correlate memos with sales spikes/drops
- Highlight mentioned menu items with sales data
- Staff performance metrics alongside memos

### 3.3 Team Collaboration

**Features**:
- Assign memos for review
- Add comments/notes to memos
- Share draft narratives
- Approval workflow

---

## Technical Implementation Details

### File Structure
```
src/components/manager-log/
├── DesktopLayout.tsx           # Phase 1
├── MemoListPanel.tsx           # Phase 1
├── SynthesisPanel.tsx          # Phase 1
├── BatchTranscriptionView.tsx  # Phase 1
├── MemoCard.tsx                # Phase 1
├── TranscriptionBulkActions.tsx # Phase 1
├── MultiMemoSynthesis.tsx      # Phase 2
├── PatternDetector.tsx         # Phase 2
├── DraftLogBuilder.tsx         # Phase 2
├── ShiftTimeline.tsx           # Phase 3
└── [existing components]
```

### Data Flow
1. **Capture** (PWA): Voice memos → Supabase storage → Transcription
2. **Review** (Desktop): Load memos → Display in list → Select for review
3. **Synthesize** (Desktop): Select multiple → AI synthesis → Draft narrative
4. **Publish** (Desktop): Finalize draft → Save to shift_summaries

### State Management
- Use existing `useConversationState` hook patterns
- Create new hooks:
  - `useMemoSelection.ts` - Track selected memos for bulk actions
  - `useTranscriptionBatch.ts` - Manage batch review state
  - `useDraftBuilder.ts` - Handle draft narrative state

### Database Schema Updates
```sql
-- Add new columns to voice_memos table
ALTER TABLE voice_memos ADD COLUMN review_status TEXT DEFAULT 'pending';
ALTER TABLE voice_memos ADD COLUMN reviewer_notes TEXT;
ALTER TABLE voice_memos ADD COLUMN used_in_draft BOOLEAN DEFAULT false;
ALTER TABLE voice_memos ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE voice_memos ADD COLUMN reviewed_by UUID REFERENCES auth.users(id);

-- Create draft_narratives table
CREATE TABLE draft_narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id TEXT NOT NULL,
  shift_date DATE NOT NULL,
  shift_type TEXT NOT NULL,
  content TEXT,
  source_memo_ids UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

---

## Phase 1 Implementation Checklist

### Step 1: Desktop Detection & Layout
- [ ] Add desktop detection utility (min-width: 1024px)
- [ ] Create `DesktopLayout.tsx` with two-panel structure
- [ ] Implement resizable panels
- [ ] Add panel collapse/expand functionality
- [ ] Update `ManagerLog.tsx` to use desktop layout on large screens

### Step 2: Memo List Panel
- [ ] Create `MemoListPanel.tsx`
- [ ] Implement filter controls (status, category, date)
- [ ] Add sort controls (time, duration, status)
- [ ] Build memo list with cards/items
- [ ] Add bulk selection (checkboxes)
- [ ] Implement bulk actions toolbar
- [ ] Add status badges and visual indicators

### Step 3: Synthesis Panel
- [ ] Create `SynthesisPanel.tsx`
- [ ] Build review mode interface
- [ ] Add transcription editor with auto-save
- [ ] Implement audio player integration
- [ ] Add category selector
- [ ] Create quick action buttons
- [ ] Add "mark as used" functionality

### Step 4: Batch Transcription
- [ ] Create `BatchTranscriptionView.tsx`
- [ ] Implement keyboard shortcuts
- [ ] Add progress tracking
- [ ] Build inline editing for transcriptions
- [ ] Add bulk approve/reject
- [ ] Implement category assignment (bulk & individual)

### Step 5: Database Updates
- [ ] Run migration to add review_status, reviewer_notes, used_in_draft columns
- [ ] Create draft_narratives table
- [ ] Update RLS policies
- [ ] Add indexes for performance

### Step 6: Testing & Polish
- [ ] Test desktop layout responsiveness
- [ ] Verify keyboard shortcuts work
- [ ] Test bulk actions
- [ ] Validate transcription editing and auto-save
- [ ] Check audio playback in both panels
- [ ] Mobile fallback (should show existing mobile view)

---

## Success Metrics

**Phase 1**:
- Reduce time to review 10 memos from ~15min to ~5min
- Enable bulk actions on multiple memos simultaneously
- Provide split-screen workflow for efficiency

**Phase 2**:
- AI synthesis reduces draft writing time by 60%
- Pattern detection surfaces insights automatically

**Phase 3**:
- Timeline view provides at-a-glance shift overview
- Toast integration connects data with narrative

---

## Next Steps

1. **Review and approve this plan**
2. **Start Phase 1, Step 1**: Desktop detection and layout structure
3. **Iterate**: Build, test, refine each step
4. **Move to Phase 2**: After Phase 1 is complete and tested
