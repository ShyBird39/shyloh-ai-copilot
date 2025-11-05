import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateConversationRequest {
  restaurant_id: string;
  title: string;
  visibility?: 'private' | 'team' | 'public';
  initial_message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    // Create client with user's auth to verify identity
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Parse request body
    const { restaurant_id, title, visibility = 'private', initial_message }: CreateConversationRequest = await req.json();

    if (!restaurant_id || !title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: restaurant_id and title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client to bypass RLS
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is a member of the restaurant
    const { data: membership, error: memberError } = await supabaseService
      .from('restaurant_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('restaurant_id', restaurant_id)
      .eq('status', 'active')
      .single();

    if (memberError || !membership) {
      console.error('Membership check failed:', memberError);
      return new Response(
        JSON.stringify({ error: 'User is not a member of this restaurant' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User is a valid restaurant member');

    // Create conversation with service role
    const { data: conversation, error: conversationError } = await supabaseService
      .from('chat_conversations')
      .insert({
        restaurant_id,
        title,
        visibility,
        created_by: user.id,
        message_count: initial_message ? 1 : 0,
      })
      .select()
      .single();

    if (conversationError) {
      console.error('Error creating conversation:', conversationError);
      return new Response(
        JSON.stringify({ error: 'Failed to create conversation', details: conversationError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Conversation created:', conversation.id);

    // Add creator as participant with owner role
    const { error: participantError } = await supabaseService
      .from('chat_conversation_participants')
      .insert({
        conversation_id: conversation.id,
        user_id: user.id,
        role: 'owner',
      });

    if (participantError) {
      console.error('Error adding participant:', participantError);
      // Clean up conversation if participant creation fails
      await supabaseService.from('chat_conversations').delete().eq('id', conversation.id);
      return new Response(
        JSON.stringify({ error: 'Failed to add participant', details: participantError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Participant added successfully');

    // Create initial message if provided
    if (initial_message) {
      const { error: messageError } = await supabaseService
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          user_id: user.id,
          role: 'user',
          content: initial_message,
        });

      if (messageError) {
        console.error('Error creating initial message:', messageError);
      }
    }

    return new Response(
      JSON.stringify({ conversation }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
