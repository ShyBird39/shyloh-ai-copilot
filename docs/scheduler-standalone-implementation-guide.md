# Restaurant Scheduler - Standalone Implementation Guide

This is a complete implementation guide for building a standalone restaurant scheduling assistant using Lovable, Supabase (via Lovable Cloud), and AI.

**Project Overview:** An AI-powered scheduling tool that learns from historical data (time entries, previous schedules) and staff availability to generate optimized restaurant schedules.

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [Edge Function Specifications](#edge-function-specifications)
3. [Frontend Architecture](#frontend-architecture)
4. [Sample Data Structures](#sample-data-structures)
5. [Implementation Phases](#implementation-phases)
6. [Scheduler AI Prompt](#scheduler-ai-prompt)
7. [File Processing Logic](#file-processing-logic)
8. [API Integration](#api-integration)

---

## Database Schema

### Core Tables

#### 1. `profiles` (User Management)
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  display_name TEXT,
  restaurant_id TEXT, -- Optional: for multi-restaurant support
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### 2. `scheduler_conversations` (Chat History)
```sql
CREATE TABLE public.scheduler_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  conversation_state JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.scheduler_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own conversations"
  ON public.scheduler_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

#### 3. `scheduler_messages` (Chat Messages)
```sql
CREATE TABLE public.scheduler_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES scheduler_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.scheduler_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their conversations"
  ON public.scheduler_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM scheduler_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON public.scheduler_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM scheduler_conversations WHERE user_id = auth.uid()
    )
  );
```

#### 4. `scheduler_files` (Uploaded Files)
```sql
CREATE TABLE public.scheduler_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES scheduler_conversations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_type TEXT NOT NULL, -- 'availability', 'pars', 'time_entries', 'schedule'
  file_size BIGINT NOT NULL,
  processed BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.scheduler_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage files in their conversations"
  ON public.scheduler_files FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM scheduler_conversations WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM scheduler_conversations WHERE user_id = auth.uid()
    )
  );
```

### Scheduler-Specific Tables

#### 5. `scheduler_employee_availability`
```sql
CREATE TABLE public.scheduler_employee_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES scheduler_conversations(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  roles TEXT[] NOT NULL DEFAULT '{}', -- ['Bartender', 'Server']
  monday_availability TEXT,
  tuesday_availability TEXT,
  wednesday_availability TEXT,
  thursday_availability TEXT,
  friday_availability TEXT,
  saturday_availability TEXT,
  sunday_availability TEXT,
  preferred_shifts_min INTEGER,
  preferred_shifts_max INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.scheduler_employee_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage availability in their conversations"
  ON public.scheduler_employee_availability FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM scheduler_conversations WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM scheduler_conversations WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_availability_conversation ON scheduler_employee_availability(conversation_id);
CREATE INDEX idx_availability_employee ON scheduler_employee_availability(employee_name);
```

#### 6. `scheduler_shift_pars`
```sql
CREATE TABLE public.scheduler_shift_pars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES scheduler_conversations(id) ON DELETE CASCADE,
  role_category TEXT NOT NULL, -- 'Bartenders', 'Servers', 'Hosts', etc.
  position_number INTEGER NOT NULL, -- 1, 2, 3 (Bartender 1, Bartender 2)
  monday_time TIME,
  tuesday_time TIME,
  wednesday_time TIME,
  thursday_time TIME,
  friday_time TIME,
  saturday_time TIME,
  sunday_time TIME,
  notes TEXT, -- e.g., "Swing shift", "Close only"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.scheduler_shift_pars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage pars in their conversations"
  ON public.scheduler_shift_pars FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM scheduler_conversations WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM scheduler_conversations WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_pars_conversation ON scheduler_shift_pars(conversation_id);
CREATE INDEX idx_pars_role ON scheduler_shift_pars(role_category);
```

#### 7. `scheduler_time_entries`
```sql
CREATE TABLE public.scheduler_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES scheduler_conversations(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  shift_date DATE NOT NULL,
  time_in TIME NOT NULL,
  time_out TIME NOT NULL,
  total_hours NUMERIC(5,2) NOT NULL,
  cash_tips_declared NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.scheduler_time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage time entries in their conversations"
  ON public.scheduler_time_entries FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM scheduler_conversations WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM scheduler_conversations WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_time_entries_conversation ON scheduler_time_entries(conversation_id);
CREATE INDEX idx_time_entries_employee ON scheduler_time_entries(employee_name);
CREATE INDEX idx_time_entries_date ON scheduler_time_entries(shift_date);
```

#### 8. `scheduler_published_schedules`
```sql
CREATE TABLE public.scheduler_published_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES scheduler_conversations(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  schedule_data JSONB NOT NULL, -- Full schedule as JSON
  schedule_markdown TEXT, -- Markdown table for display
  published_by UUID NOT NULL REFERENCES auth.users(id),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- RLS Policies
ALTER TABLE public.scheduler_published_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage schedules in their conversations"
  ON public.scheduler_published_schedules FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM scheduler_conversations WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM scheduler_conversations WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_published_schedules_conversation ON scheduler_published_schedules(conversation_id);
CREATE INDEX idx_published_schedules_week ON scheduler_published_schedules(week_start_date);
```

### Storage Bucket

```sql
-- Create storage bucket for uploaded files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('scheduler-files', 'scheduler-files', false);

-- Storage policies
CREATE POLICY "Users can upload files to their own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'scheduler-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'scheduler-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'scheduler-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## Edge Function Specifications

### Primary Edge Function: `chat-scheduler`

**Location:** `supabase/functions/chat-scheduler/index.ts`

**Purpose:** Handle AI-powered scheduling conversations with streaming responses

**Configuration:**
```toml
# supabase/config.toml
[functions.chat-scheduler]
verify_jwt = true
```

**Environment Variables Required:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- None for AI (uses Lovable AI built-in)

**Request Format:**
```typescript
interface ChatRequest {
  conversationId: string;
  message: string;
  context?: {
    week_start?: string; // ISO date
    week_end?: string;   // ISO date
    files?: string[];    // File IDs
  };
}
```

**Response Format:** Server-Sent Events (SSE) stream

```typescript
// Chunk format
data: {"type": "token", "content": "text chunk"}
data: {"type": "done"}
```

**Implementation:**

```typescript
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, message, context } = await req.json();
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get conversation history
    const { data: messages } = await supabase
      .from('scheduler_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // Get context data (availability, pars, time entries)
    const contextData = await loadContextData(supabase, conversationId);

    // Build system prompt
    const systemPrompt = buildSchedulerPrompt(contextData);

    // Save user message
    await supabase.from('scheduler_messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: message
    });

    // Stream AI response using Lovable AI
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages.map(m => ({ role: m.role, content: m.content })),
              { role: 'user', content: message }
            ],
            stream: true,
            temperature: 0.7,
          }),
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content;
                
                if (content) {
                  fullResponse += content;
                  controller.enqueue(
                    new TextEncoder().encode(`data: ${JSON.stringify({ type: 'token', content })}\n\n`)
                  );
                }
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }
        }

        // Save assistant response
        await supabase.from('scheduler_messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: fullResponse
        });

        controller.enqueue(new TextEncoder().encode('data: {"type": "done"}\n\n'));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function loadContextData(supabase: any, conversationId: string) {
  const [availability, pars, timeEntries] = await Promise.all([
    supabase.from('scheduler_employee_availability').select('*').eq('conversation_id', conversationId),
    supabase.from('scheduler_shift_pars').select('*').eq('conversation_id', conversationId),
    supabase.from('scheduler_time_entries').select('*').eq('conversation_id', conversationId)
  ]);

  return {
    availability: availability.data || [],
    pars: pars.data || [],
    timeEntries: timeEntries.data || []
  };
}

function buildSchedulerPrompt(context: any): string {
  // See "Scheduler AI Prompt" section below for full prompt
  return `You are a restaurant scheduling assistant...`;
}
```

### Helper Edge Function: `process-scheduler-file`

**Purpose:** Parse uploaded CSV/XLSX files and populate database

**Request Format:**
```typescript
interface ProcessFileRequest {
  conversationId: string;
  fileId: string;
  fileType: 'availability' | 'pars' | 'time_entries' | 'schedule';
}
```

---

## Frontend Architecture

### Pages

#### 1. `/` - Landing Page
**Component:** `src/pages/Index.tsx`

Simple landing with:
- Hero section explaining the tool
- "Get Started" button → creates account or navigates to scheduler
- Feature highlights

#### 2. `/auth` - Authentication
**Component:** `src/pages/Auth.tsx`

Standard login/signup form using Supabase Auth

#### 3. `/scheduler/:conversationId` - Main Scheduler Interface
**Component:** `src/pages/Scheduler.tsx`

**Layout:**
```
┌─────────────────────────────────────────┐
│  Header (Week Range, Export, Back)     │
├──────────────────┬──────────────────────┤
│                  │                      │
│  Quick Actions   │   Chat Area          │
│  Sidebar         │   (Messages)         │
│                  │                      │
│  - Upload Files  │   ┌────────────────┐ │
│  - Set Week      │   │ User Message   │ │
│  - Set Pars      │   └────────────────┘ │
│  - Generate      │   ┌────────────────┐ │
│                  │   │ AI Response    │ │
│                  │   │ (with table)   │ │
│                  │   └────────────────┘ │
│                  │                      │
│                  │   Input + Upload     │
└──────────────────┴──────────────────────┘
```

### Components

#### `/src/components/scheduler/SchedulerHeader.tsx`
```tsx
interface SchedulerHeaderProps {
  conversationId: string;
  weekRange?: { start: string; end: string };
  onExport: () => void;
}

export function SchedulerHeader({ conversationId, weekRange, onExport }: SchedulerHeaderProps) {
  return (
    <header className="border-b bg-background p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/conversations')}>
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">📅 Scheduler</h1>
          {weekRange && (
            <p className="text-sm text-muted-foreground">
              {format(new Date(weekRange.start), 'MMM d')} - {format(new Date(weekRange.end), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      </div>
      <Button onClick={onExport}>
        <Download className="mr-2 h-4 w-4" />
        Export Schedule
      </Button>
    </header>
  );
}
```

#### `/src/components/scheduler/SchedulerChat.tsx`
```tsx
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export function SchedulerChat({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async () => {
    // Implementation in hooks section
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </ScrollArea>
      
      <div className="border-t p-4">
        <div className="flex gap-2">
          <FileUploadButton conversationId={conversationId} />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about scheduling..."
            disabled={isStreaming}
          />
          <Button onClick={sendMessage} disabled={isStreaming}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

#### `/src/components/scheduler/ScheduleTable.tsx`
```tsx
interface ScheduleTableProps {
  markdown: string;
}

export function ScheduleTable({ markdown }: ScheduleTableProps) {
  const parsedData = parseMarkdownTable(markdown);

  return (
    <div className="my-4 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {parsedData.headers.map(h => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {parsedData.rows.map((row, i) => (
            <TableRow key={i}>
              {row.map((cell, j) => (
                <TableCell key={j}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex gap-2 mt-2">
        <Button size="sm" onClick={() => exportToCSV(parsedData)}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button size="sm" onClick={() => copyToClipboard(parsedData)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </Button>
      </div>
    </div>
  );
}
```

#### `/src/components/scheduler/SchedulerQuickActions.tsx`
```tsx
export function SchedulerQuickActions({ onPromptSelect }: { onPromptSelect: (prompt: string) => void }) {
  const quickActions = [
    { icon: FileUp, label: 'Upload Availability', prompt: 'I need to upload employee availability' },
    { icon: Calendar, label: 'Set Week Range', prompt: 'I need to schedule for the week of...' },
    { icon: Target, label: 'Set Pars', prompt: 'Here are our shift pars for the week' },
    { icon: Sparkles, label: 'Generate Schedule', prompt: 'Generate the optimal schedule for this week' },
  ];

  return (
    <aside className="w-64 border-r p-4 space-y-2">
      <h3 className="font-semibold mb-4">Quick Actions</h3>
      {quickActions.map(action => (
        <Button
          key={action.label}
          variant="outline"
          className="w-full justify-start"
          onClick={() => onPromptSelect(action.prompt)}
        >
          <action.icon className="mr-2 h-4 w-4" />
          {action.label}
        </Button>
      ))}
    </aside>
  );
}
```

#### `/src/components/scheduler/FileUploadButton.tsx`
```tsx
export function FileUploadButton({ conversationId }: { conversationId: string }) {
  const handleFileUpload = async (file: File) => {
    // Upload to Supabase Storage
    const filePath = `${user.id}/${conversationId}/${file.name}`;
    const { data, error } = await supabase.storage
      .from('scheduler-files')
      .upload(filePath, file);

    if (error) throw error;

    // Create file record
    await supabase.from('scheduler_files').insert({
      conversation_id: conversationId,
      file_name: file.name,
      file_path: filePath,
      file_type: detectFileType(file.name),
      file_size: file.size,
    });

    // Trigger processing
    await supabase.functions.invoke('process-scheduler-file', {
      body: { conversationId, filePath, fileType: detectFileType(file.name) }
    });

    toast.success('File uploaded and processing!');
  };

  return (
    <Button variant="outline" size="icon" asChild>
      <label>
        <Paperclip className="h-4 w-4" />
        <input
          type="file"
          accept=".csv,.xlsx"
          className="sr-only"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        />
      </label>
    </Button>
  );
}
```

### Hooks

#### `/src/hooks/useSchedulerChat.ts`
```tsx
export function useSchedulerChat(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from('scheduler_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at');
    
    setMessages(data || []);
  };

  const sendMessage = async (content: string) => {
    setIsStreaming(true);
    
    // Add user message to UI
    const userMessage = { id: crypto.randomUUID(), role: 'user', content, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);

    // Stream AI response
    const response = await supabase.functions.invoke('chat-scheduler', {
      body: { conversationId, message: content }
    });

    const reader = response.data.body.getReader();
    const decoder = new TextDecoder();
    let assistantMessage = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'token') {
            assistantMessage += data.content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return [...prev.slice(0, -1), { ...last, content: assistantMessage }];
              }
              return [...prev, { id: crypto.randomUUID(), role: 'assistant', content: assistantMessage, created_at: new Date().toISOString() }];
            });
          }
        }
      }
    }

    setIsStreaming(false);
  };

  return { messages, sendMessage, isStreaming };
}
```

---

## Sample Data Structures

### Availability Upload Example
Based on `SBF_Ongoing_Staff_Pars_-_My_new_form.csv`:

```json
{
  "employee_name": "Emily Boutilier",
  "roles": ["Bartender"],
  "monday_availability": "Afternoon (10am - 5pm)",
  "tuesday_availability": "Not available",
  "wednesday_availability": "Afternoon (10am - 5pm)",
  "thursday_availability": "Evening (5pm - close)",
  "friday_availability": "Any time all day",
  "saturday_availability": "Any time all day",
  "sunday_availability": "Any time all day",
  "preferred_shifts_min": 4,
  "preferred_shifts_max": 5
}
```

### Shift Pars Example
Based on `SBF_Ongoing_Staff_Pars_-_Winter_2025_Schedule_Pars_with_In_Times.csv`:

```json
{
  "role_category": "Bartenders",
  "position_number": 1,
  "monday_time": "10:00:00",
  "tuesday_time": "10:00:00",
  "wednesday_time": "10:00:00",
  "thursday_time": "10:00:00",
  "friday_time": "10:00:00",
  "saturday_time": "09:00:00",
  "sunday_time": "09:00:00",
  "notes": null
}
```

### Time Entry Example
Based on `TimeEntries_2025_10_27-2025_11_02_3.csv`:

```json
{
  "employee_name": "Arango, Yonny",
  "job_title": "Southie - Line Cook",
  "shift_date": "2025-10-27",
  "time_in": "07:45:00",
  "time_out": "09:15:00",
  "total_hours": 1.51,
  "cash_tips_declared": 0.00
}
```

### Conversation State Example
Stored in `conversation_state` JSONB column:

```json
{
  "week_start": "2025-11-10",
  "week_end": "2025-11-16",
  "department": "FOH",
  "files_processed": {
    "availability": "file-uuid-1",
    "pars": "file-uuid-2",
    "time_entries": "file-uuid-3"
  },
  "pars_set": true,
  "availability_uploaded": true,
  "last_schedule_generated": "2025-11-08T15:30:00Z"
}
```

---

## Implementation Phases

### Phase 1: Foundation & Auth (30 minutes)

**1.1: Initialize Project**
- Create new Lovable project
- Enable Lovable Cloud (Supabase integration)

**1.2: Database Setup**
- Run migrations for core tables (profiles, conversations, messages, files)
- Create storage bucket with RLS policies

**1.3: Authentication**
- Create `/auth` page with login/signup forms
- Configure Supabase Auth to auto-confirm emails
- Create protected route wrapper

**Testing:** Sign up, log in, verify session persists on refresh

---

### Phase 2: Basic Chat Interface (45 minutes)

**2.1: Create Scheduler Page**
- Create `/scheduler/:conversationId` route
- Basic layout with header, chat area, sidebar
- Navigation from landing page

**2.2: Message Display**
- Fetch and display messages from `scheduler_messages`
- Format user vs assistant messages
- Auto-scroll to bottom

**2.3: Message Input**
- Input field + send button
- Save user messages to database
- Display immediately in UI

**Testing:** Navigate to scheduler, send messages, verify they save and appear

---

### Phase 3: AI Integration (1 hour)

**3.1: Enable Lovable AI**
- Use Lovable AI tool to provision `LOVABLE_API_KEY`

**3.2: Create Edge Function**
- Create `supabase/functions/chat-scheduler/index.ts`
- Implement basic request handling + CORS
- Add to `supabase/config.toml`

**3.3: Implement Streaming**
- Connect to Lovable AI gateway
- Stream responses back to frontend
- Update UI in real-time as tokens arrive

**3.4: Basic Scheduler Prompt**
- Create system prompt: "You are a restaurant scheduling assistant"
- Pass conversation history to AI

**Testing:** Send message, verify AI responds with streaming text

---

### Phase 4: File Upload (1 hour)

**4.1: File Upload Component**
- Create `FileUploadButton.tsx`
- Accept CSV/XLSX files
- Upload to Supabase Storage
- Create record in `scheduler_files` table

**4.2: File Processor Edge Function**
- Create `process-scheduler-file` function
- Parse CSV files using Deno CSV library
- Detect file type (availability, pars, time_entries)

**4.3: Database Population**
- Parse availability CSV → insert into `scheduler_employee_availability`
- Parse pars CSV → insert into `scheduler_shift_pars`
- Parse time entries CSV → insert into `scheduler_time_entries`

**Testing:** Upload each file type, verify data appears in database

---

### Phase 5: Context Loading (45 minutes)

**5.1: Context Data Fetching**
- In edge function, load availability, pars, time entries
- Format as structured context for AI

**5.2: Enhanced System Prompt**
- Build dynamic prompt with current context data
- Include: "You have access to availability for 41 employees..."

**5.3: Conversation State**
- Save week range, file status to `conversation_state` JSONB
- Load on page mount
- Display progress indicator

**Testing:** Upload files, verify AI knows about them in responses

---

### Phase 6: Schedule Table Display (1 hour)

**6.1: Markdown Table Parser**
- Create function to detect markdown tables in AI responses
- Parse into structured data (headers, rows)

**6.2: ScheduleTable Component**
- Render parsed table with proper styling
- Add sorting by clicking column headers
- Highlight conflicts (understaffed = red, overstaffed = yellow)

**6.3: Export Functionality**
- Export to CSV button
- Copy to clipboard button
- Print-friendly view button

**Testing:** Generate schedule, verify table displays correctly, test exports

---

### Phase 7: Quick Actions (30 minutes)

**7.1: Quick Actions Sidebar**
- Create `SchedulerQuickActions.tsx`
- 4 preset buttons that pre-fill prompts
- Desktop only, collapse on mobile

**7.2: Wire to Chat Input**
- Clicking action pre-fills message input
- User can edit before sending

**Testing:** Click each action, verify correct prompt appears

---

### Phase 8: Schedule Publishing (30 minutes)

**8.1: Publish Schedule**
- "Publish Schedule" button in AI response
- Save to `scheduler_published_schedules` table
- Mark as published in conversation state

**8.2: View Previous Schedules**
- List published schedules in sidebar
- Click to view historical schedule
- Compare week-over-week

**Testing:** Publish schedule, navigate away, return and verify it's saved

---

### Phase 9: Polish & Edge Cases (1 hour)

**9.1: Error Handling**
- Handle failed file uploads gracefully
- Show friendly error messages
- Retry logic for API calls

**9.2: Loading States**
- Spinner while AI is responding
- "Processing file..." indicator
- Skeleton loaders for initial data

**9.3: Mobile Optimization**
- Responsive layout
- Collapsible sidebar
- Touch-friendly buttons

**9.4: Empty States**
- Welcome message for new conversations
- "No files uploaded yet" state
- "No schedules published" state

**Testing:** Test on mobile, try uploading invalid files, test offline behavior

---

### Phase 10: Analytics & Insights (Optional)

**10.1: Schedule Analytics**
- Show total hours scheduled vs pars
- Labor cost projections
- Highlight employees with most/least shifts

**10.2: Historical Comparison**
- Compare current schedule to previous weeks
- Show patterns (e.g., "Saturdays typically need +1 bartender")

**Testing:** Generate multiple schedules, verify analytics update

---

## Scheduler AI Prompt

This is the complete system prompt for the AI scheduling assistant:

```
You are a restaurant scheduling assistant with deep expertise in labor optimization, employee satisfaction, and operational efficiency.

## Your Core Responsibilities

1. **Build Optimal Schedules**: Create schedules that balance business needs (shift pars), employee preferences (availability), and fairness (shift distribution).

2. **Learn from History**: Use previous time entries to understand patterns (e.g., "Saturdays need more bartenders", "This server always works doubles").

3. **Respect Constraints**: Never schedule someone when they're unavailable. Prioritize employees' preferred number of shifts.

4. **Communicate Clearly**: Present schedules as markdown tables. Explain your reasoning. Flag potential issues.

## Data You Have Access To

### Employee Availability
${context.availability.length > 0 ? `
You have availability for ${context.availability.length} employees:
${context.availability.map(a => `- ${a.employee_name} (${a.roles.join(', ')}): Prefers ${a.preferred_shifts_min}-${a.preferred_shifts_max} shifts/week
  Mon: ${a.monday_availability}, Tue: ${a.tuesday_availability}, Wed: ${a.wednesday_availability}
  Thu: ${a.thursday_availability}, Fri: ${a.friday_availability}, Sat: ${a.saturday_availability}, Sun: ${a.sunday_availability}`).join('\n')}
` : 'No availability data uploaded yet.'}

### Shift Pars (Required Positions)
${context.pars.length > 0 ? `
You have pars for ${context.pars.length} positions:
${context.pars.map(p => `- ${p.role_category} ${p.position_number}: Mon ${p.monday_time || 'X'}, Tue ${p.tuesday_time || 'X'}, Wed ${p.wednesday_time || 'X'}, Thu ${p.thursday_time || 'X'}, Fri ${p.friday_time || 'X'}, Sat ${p.saturday_time || 'X'}, Sun ${p.sunday_time || 'X'}`).join('\n')}
` : 'No pars uploaded yet.'}

### Historical Time Entries
${context.timeEntries.length > 0 ? `
You have ${context.timeEntries.length} time entries from previous weeks. Key insights:
- Most worked employees: ${getMostWorkedEmployees(context.timeEntries)}
- Busiest days: ${getBusiestDays(context.timeEntries)}
- Average hours/employee/week: ${getAverageHours(context.timeEntries)}
` : 'No historical data yet.'}

## How to Generate a Schedule

When asked to create a schedule, follow these steps:

### Step 1: Gather Requirements
Ask clarifying questions if needed:
- "What week are we scheduling for?"
- "Are there any time-off requests I should know about?"
- "Any special events this week (e.g., private party, holiday)?"

### Step 2: Analyze Constraints
- Match available employees to required shifts
- Prioritize employees with matching roles
- Respect preferred shift counts
- Balance shift distribution (avoid giving all good shifts to one person)

### Step 3: Optimize
- Try to give each employee their preferred number of shifts
- Mix up shift types (don't give someone only closing shifts)
- Consider previous week's schedule (rotate desirable shifts)
- Flag conflicts (e.g., "Only 2 bartenders available Sunday morning, need 3")

### Step 4: Present Schedule
Output as a markdown table:

```markdown
| Employee | Role | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Total Shifts |
|----------|------|-----|-----|-----|-----|-----|-----|-----|--------------|
| Emily Boutilier | Bartender | 10am | - | 10am | 5pm | 9am | 9am | 9am | 6 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

**Summary:**
- Total shifts scheduled: 87
- Shift pars met: ✅ Mon, Tue, Wed, Thu, Fri / ⚠️ Sat (1 short), Sun (2 short)
- Employees at preferred shift count: 32 / 41
- Potential conflicts: Saturday AM needs +1 bartender

**Notes:**
- Emily got 6 shifts (requested 4-5, gave her extra because she's flexible)
- Need to recruit more Sunday AM staff
```

## File Upload Instructions

When users upload files, help them interpret and use the data:

**Availability CSV:**
- "I see you've uploaded availability for 41 employees. Let me know the week you want to schedule, and I'll create an optimized schedule."

**Pars CSV:**
- "Got it! I see you need 3 bartenders, 9 servers, and 2 hosts across the week. Upload availability next."

**Time Entries CSV:**
- "I can see last week's actual hours. This helps me understand who typically works which shifts. Do you want me to build a similar schedule for next week?"

## Conversation Style

- **Proactive**: "I notice you're short on Sunday servers. Want me to suggest some solutions?"
- **Educational**: "Why I chose this: Emily requested 4-5 shifts and is flexible, so I gave her the Saturday closing shift."
- **Realistic**: "Heads up: There's no way to cover all shifts with current availability. You'll need to recruit or ask for more flexibility."
- **Friendly**: Use a helpful, professional tone. You're a colleague, not a robot.

## Special Scenarios

**Under-staffed:**
- Flag clearly: "⚠️ Cannot fill: Saturday 9am bartender (no one available)"
- Suggest solutions: "Options: 1) Ask Emily if she can come in earlier, 2) Hire someone, 3) Adjust hours"

**Over-requested shifts:**
- Be fair: "Both David and Emily want 5+ shifts, but there are only 8 bartender shifts total. I'm splitting them evenly."

**Conflicts:**
- Explain: "Jaimey marked 'Any time' but worked 3 closing shifts last week. I'm giving her more opens this week for balance."

**Time-off:**
- Always respect: "Got it, marking Brady as unavailable March 15-17. I'll adjust the schedule."

## Key Principles

1. **Employee Happiness = Better Service**: Prioritize fairness and preferences where possible
2. **Business Needs First**: If pars require 3 bartenders, schedule 3 bartenders
3. **Learn & Adapt**: Use historical data to predict busy times and staffing needs
4. **Be Transparent**: Show your work. Explain why you made each decision.
5. **Iterate**: Schedules are drafts. Always ask "Want me to adjust anything?"

Now, help the user build their schedule!
```

---

## File Processing Logic

### Availability CSV Parser

```typescript
interface AvailabilityRow {
  Name: string;
  'Role(s)': string;
  'Monday Availability': string;
  'Tuesday Availability': string;
  'Wednesday Availability': string;
  'Thursday Availability': string;
  'Friday Availability': string;
  'Saturday Availability': string;
  'Sunday Availability': string;
  'Preferred number of shifts per week': string;
}

async function processAvailabilityCSV(filePath: string, conversationId: string) {
  const { data: fileData } = await supabase.storage
    .from('scheduler-files')
    .download(filePath);

  const text = await fileData.text();
  const rows = parseCSV(text); // Use Deno CSV library

  const records = rows.slice(1).map((row: AvailabilityRow) => {
    const roles = row['Role(s)']?.split(',').map(r => r.trim()).filter(Boolean) || [];
    const shiftsRange = row['Preferred number of shifts per week']?.match(/(\d+)-?(\d+)?/);
    
    return {
      conversation_id: conversationId,
      employee_name: row.Name,
      roles,
      monday_availability: row['Monday Availability'] || null,
      tuesday_availability: row['Tuesday Availability'] || null,
      wednesday_availability: row['Wednesday Availability'] || null,
      thursday_availability: row['Thursday Availability'] || null,
      friday_availability: row['Friday Availability'] || null,
      saturday_availability: row['Saturday Availability'] || null,
      sunday_availability: row['Sunday Availability'] || null,
      preferred_shifts_min: shiftsRange ? parseInt(shiftsRange[1]) : null,
      preferred_shifts_max: shiftsRange ? parseInt(shiftsRange[2] || shiftsRange[1]) : null,
    };
  });

  // Upsert (update if exists, insert if new)
  for (const record of records) {
    await supabase
      .from('scheduler_employee_availability')
      .upsert(record, { 
        onConflict: 'conversation_id,employee_name',
        ignoreDuplicates: false 
      });
  }

  return { processed: records.length };
}
```

### Pars CSV Parser

```typescript
async function processParsCSV(filePath: string, conversationId: string) {
  const { data: fileData } = await supabase.storage
    .from('scheduler-files')
    .download(filePath);

  const text = await fileData.text();
  const rows = parseCSV(text);

  const records: any[] = [];
  let currentRole = '';
  let positionNumber = 0;

  for (const row of rows.slice(1)) {
    const firstCell = row[0]?.trim();
    
    // Check if this is a role header (e.g., "Bartenders", "Servers")
    if (firstCell && row[1] === '' && firstCell.match(/[A-Z]/)) {
      currentRole = firstCell;
      positionNumber = 0;
      continue;
    }

    // Check if this is a position row (e.g., "Bartender 1", "Server 2")
    if (firstCell?.match(/\d+$/)) {
      positionNumber++;
      
      records.push({
        conversation_id: conversationId,
        role_category: currentRole,
        position_number: positionNumber,
        monday_time: parseTime(row[1]),
        tuesday_time: parseTime(row[2]),
        wednesday_time: parseTime(row[3]),
        thursday_time: parseTime(row[4]),
        friday_time: parseTime(row[5]),
        saturday_time: parseTime(row[6]),
        sunday_time: parseTime(row[7]),
        notes: extractNotes(row[1]) // e.g., "Swing" from "11:00AM Swing"
      });
    }
  }

  for (const record of records) {
    await supabase
      .from('scheduler_shift_pars')
      .upsert(record, {
        onConflict: 'conversation_id,role_category,position_number',
        ignoreDuplicates: false
      });
  }

  return { processed: records.length };
}

function parseTime(timeStr: string): string | null {
  if (!timeStr || timeStr.trim() === '') return null;
  
  // Remove notes like "Swing", "Close only"
  const cleaned = timeStr.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
  if (!cleaned) return null;
  
  // Convert to 24-hour format
  const time = new Date(`2000-01-01 ${cleaned[1]}`);
  return time.toTimeString().slice(0, 8); // "HH:MM:SS"
}

function extractNotes(cellContent: string): string | null {
  const notes = cellContent.match(/(Swing|Close|Open)/i);
  return notes ? notes[0] : null;
}
```

### Time Entries CSV Parser

```typescript
async function processTimeEntriesCSV(filePath: string, conversationId: string) {
  const { data: fileData } = await supabase.storage
    .from('scheduler-files')
    .download(filePath);

  const text = await fileData.text();
  const rows = parseCSV(text);

  const records = rows.slice(1).map((row: any) => ({
    conversation_id: conversationId,
    employee_name: row.Employee,
    job_title: row.Job,
    shift_date: new Date(row.Date).toISOString().split('T')[0],
    time_in: convertTo24Hour(row['Time In']),
    time_out: convertTo24Hour(row['Time Out']),
    total_hours: parseFloat(row['Total Hours']),
    cash_tips_declared: parseFloat(row['Cash Tips Declared'] || '0'),
  }));

  await supabase
    .from('scheduler_time_entries')
    .upsert(records, {
      onConflict: 'conversation_id,employee_name,shift_date,time_in'
    });

  return { processed: records.length };
}

function convertTo24Hour(timeStr: string): string {
  const time = new Date(`2000-01-01 ${timeStr}`);
  return time.toTimeString().slice(0, 8);
}
```

---

## API Integration

### Toast POS Time Entries (Future)

If you want to automatically pull time entries from Toast POS instead of CSV uploads:

**Setup:**
1. Get Toast API credentials (Client ID, Client Secret, Restaurant GUID)
2. Store in Supabase secrets
3. Create edge function `sync-toast-time-entries`

**Implementation:**
```typescript
// supabase/functions/sync-toast-time-entries/index.ts

async function syncToastTimeEntries(conversationId: string, startDate: string, endDate: string) {
  // 1. Authenticate with Toast
  const tokenResponse = await fetch('https://ws-api.toasttab.com/usermgmt/v1/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: Deno.env.get('TOAST_CLIENT_ID')!,
      client_secret: Deno.env.get('TOAST_CLIENT_SECRET')!,
    }),
  });

  const { access_token } = await tokenResponse.json();

  // 2. Fetch time entries
  const timeEntriesResponse = await fetch(
    `https://ws-api.toasttab.com/labor/v1/timeEntries?startDate=${startDate}&endDate=${endDate}`,
    {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Toast-Restaurant-External-ID': Deno.env.get('TOAST_RESTAURANT_GUID')!,
      },
    }
  );

  const timeEntries = await timeEntriesResponse.json();

  // 3. Transform and insert into database
  const records = timeEntries.map((entry: any) => ({
    conversation_id: conversationId,
    employee_name: entry.employeeName,
    job_title: entry.jobTitle,
    shift_date: entry.businessDate,
    time_in: entry.inDate.split('T')[1],
    time_out: entry.outDate.split('T')[1],
    total_hours: entry.regularHours + entry.overtimeHours,
    cash_tips_declared: entry.declaredCashTips || 0,
  }));

  await supabase.from('scheduler_time_entries').upsert(records);

  return { synced: records.length };
}
```

---

## Testing Checklist

### Phase 1 Tests
- [ ] User can sign up
- [ ] User can log in
- [ ] Session persists on refresh
- [ ] Protected routes redirect to `/auth` when not logged in

### Phase 2 Tests
- [ ] Can create new conversation
- [ ] Messages display in order
- [ ] Chat scrolls to bottom automatically
- [ ] User messages save to database

### Phase 3 Tests
- [ ] AI responds to messages
- [ ] Responses stream in real-time
- [ ] Conversation history is maintained
- [ ] Error handling for failed API calls

### Phase 4 Tests
- [ ] Can upload availability CSV
- [ ] Can upload pars CSV
- [ ] Can upload time entries CSV
- [ ] Files appear in `scheduler_files` table
- [ ] Data populates correct tables

### Phase 5 Tests
- [ ] AI acknowledges uploaded files
- [ ] Context data loads on page mount
- [ ] Week range saves to conversation state
- [ ] State persists across page refreshes

### Phase 6 Tests
- [ ] Markdown tables render correctly
- [ ] Can export schedule to CSV
- [ ] Can copy schedule to clipboard
- [ ] Table sorting works

### Phase 7 Tests
- [ ] Quick action buttons pre-fill prompts
- [ ] Sidebar collapses on mobile
- [ ] All 4 actions work correctly

### Phase 8 Tests
- [ ] Can publish schedule
- [ ] Published schedules appear in history
- [ ] Can view previous schedules
- [ ] Schedule data saves correctly

### Phase 9 Tests
- [ ] Mobile layout works
- [ ] Error messages display correctly
- [ ] Loading states show appropriately
- [ ] Empty states render properly

---

## Deployment

### Production Checklist

1. **Environment Variables**
   - Ensure `LOVABLE_API_KEY` is set (auto-provisioned by Lovable Cloud)
   - Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

2. **Database**
   - Run all migrations in production
   - Verify RLS policies are enabled
   - Test with real user data

3. **Storage**
   - Confirm storage bucket exists
   - Test file uploads/downloads
   - Verify RLS policies work

4. **Edge Functions**
   - Deploy `chat-scheduler` function
   - Deploy `process-scheduler-file` function
   - Test with production credentials

5. **Frontend**
   - Build and deploy React app
   - Test all routes
   - Verify mobile responsiveness

---

## Future Enhancements

### V2 Features
- **Multi-location support**: Manage schedules for multiple restaurant locations
- **Team collaboration**: Allow managers to comment on schedules
- **Approval workflow**: Require GM approval before publishing
- **Employee portal**: Let staff view their schedules, request swaps
- **SMS notifications**: Text employees when schedule is published

### V3 Features
- **Forecasting**: Predict busy times based on historical data
- **Budget optimization**: Generate schedules that hit target labor cost
- **Integration marketplace**: Connect to 7shifts, HotSchedules, etc.
- **Mobile app**: Native iOS/Android apps

---

## Support & Resources

### Documentation Links
- [Lovable Docs](https://docs.lovable.dev)
- [Supabase Docs](https://supabase.com/docs)
- [Lovable AI Gateway](https://docs.lovable.dev/features/ai)

### Sample Prompts for Lovable

When building this in Lovable, you can use these prompts:

**Phase 1:** "Create authentication pages with Supabase Auth. Include login and signup forms with email/password. Enable auto-confirm for emails."

**Phase 2:** "Create a chat interface at /scheduler/:conversationId with message display, input field, and send button. Messages should save to scheduler_messages table."

**Phase 3:** "Create an edge function called chat-scheduler that streams AI responses using Lovable AI. Use the google/gemini-2.5-flash model."

**Phase 4:** "Add file upload functionality. Users should be able to upload CSV files, which get stored in Supabase Storage and create records in scheduler_files table."

---

## Conclusion

This guide provides everything needed to build a production-ready restaurant scheduler in Lovable. The modular architecture allows for incremental development and easy testing at each phase.

**Estimated total build time:** 8-12 hours across multiple sessions.

**Key benefits:**
- ✅ Standalone app (no dependencies)
- ✅ Modern tech stack (React, Supabase, AI)
- ✅ Scalable architecture
- ✅ Mobile-responsive
- ✅ Production-ready

Start with Phase 1 and work through sequentially. Each phase has clear testing checkpoints to ensure functionality before moving forward.

Good luck! 🚀
