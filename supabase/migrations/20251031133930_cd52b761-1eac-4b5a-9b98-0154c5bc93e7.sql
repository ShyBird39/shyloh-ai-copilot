-- Drop the overly permissive RLS policy on chat_conversations
-- This policy allowed all restaurant members to see all conversations,
-- which violated the privacy of "private" conversations.
-- The more specific policy "Users can view accessible conversations" already
-- handles proper access control based on visibility and participant status.

DROP POLICY IF EXISTS "Super admin or members can view conversations" ON public.chat_conversations;