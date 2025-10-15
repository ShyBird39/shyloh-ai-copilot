-- Step 1: Create chat_conversation_participants table
CREATE TABLE IF NOT EXISTS public.chat_conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member', 'viewer')),
  added_by uuid REFERENCES auth.users(id),
  added_at timestamp with time zone DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Step 2: Add new columns to chat_conversations
ALTER TABLE public.chat_conversations 
  ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public')),
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Step 3: Add user_id to chat_messages for attribution
ALTER TABLE public.chat_messages 
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Step 4: Create security definer function to check if user is conversation participant
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_conversation_participants
    WHERE user_id = _user_id
      AND conversation_id = _conversation_id
  )
$$;

-- Step 5: Create security definer function to check if user can manage conversation
CREATE OR REPLACE FUNCTION public.can_manage_conversation(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_conversation_participants
    WHERE user_id = _user_id
      AND conversation_id = _conversation_id
      AND role = 'owner'
  )
  OR public.is_super_admin(_user_id)
$$;

-- Step 6: Enable RLS on chat_conversation_participants
ALTER TABLE public.chat_conversation_participants ENABLE ROW LEVEL SECURITY;

-- Step 7: RLS policies for chat_conversation_participants
CREATE POLICY "Users can view participants of accessible conversations"
ON public.chat_conversation_participants
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR public.is_conversation_participant(auth.uid(), conversation_id)
  OR EXISTS (
    SELECT 1 FROM public.chat_conversations cc
    WHERE cc.id = conversation_id
      AND cc.visibility = 'team'
      AND public.is_restaurant_member(auth.uid(), cc.restaurant_id)
  )
);

CREATE POLICY "Conversation owners can add participants"
ON public.chat_conversation_participants
FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.can_manage_conversation(auth.uid(), conversation_id)
);

CREATE POLICY "Conversation owners can remove participants"
ON public.chat_conversation_participants
FOR DELETE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_conversation(auth.uid(), conversation_id)
  OR user_id = auth.uid() -- Users can remove themselves
);

-- Step 8: Update RLS policies for chat_conversations
DROP POLICY IF EXISTS "Anyone can view conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can create conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can update conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can delete conversations" ON public.chat_conversations;

CREATE POLICY "Users can view accessible conversations"
ON public.chat_conversations
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR public.is_conversation_participant(auth.uid(), id)
  OR (visibility = 'team' AND public.is_restaurant_member(auth.uid(), restaurant_id))
  OR visibility = 'public'
);

CREATE POLICY "Authenticated users can create conversations"
ON public.chat_conversations
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.is_restaurant_member(auth.uid(), restaurant_id)
);

CREATE POLICY "Conversation owners can update conversations"
ON public.chat_conversations
FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_conversation(auth.uid(), id)
);

CREATE POLICY "Conversation owners can delete conversations"
ON public.chat_conversations
FOR DELETE
USING (
  public.is_super_admin(auth.uid())
  OR public.can_manage_conversation(auth.uid(), id)
);

-- Step 9: Update RLS policies for chat_messages
DROP POLICY IF EXISTS "Anyone can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can create messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can update messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can delete messages" ON public.chat_messages;

CREATE POLICY "Users can view messages from accessible conversations"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations cc
    WHERE cc.id = conversation_id
      AND (
        public.is_super_admin(auth.uid())
        OR public.is_conversation_participant(auth.uid(), cc.id)
        OR (cc.visibility = 'team' AND public.is_restaurant_member(auth.uid(), cc.restaurant_id))
        OR cc.visibility = 'public'
      )
  )
);

CREATE POLICY "Participants can create messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.chat_conversations cc
    WHERE cc.id = conversation_id
      AND (
        public.is_super_admin(auth.uid())
        OR public.is_conversation_participant(auth.uid(), cc.id)
        OR (cc.visibility = 'team' AND public.is_restaurant_member(auth.uid(), cc.restaurant_id))
      )
  )
);

CREATE POLICY "Users can update their own messages"
ON public.chat_messages
FOR UPDATE
USING (
  auth.uid() = user_id
  AND created_at > now() - interval '15 minutes' -- Can only edit within 15 minutes
);

CREATE POLICY "Users can delete their own messages"
ON public.chat_messages
FOR DELETE
USING (
  auth.uid() = user_id
  OR public.is_super_admin(auth.uid())
);

-- Step 10: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON public.chat_conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON public.chat_conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_visibility ON public.chat_conversations(visibility);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_by ON public.chat_conversations(created_by);