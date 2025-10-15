import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messageId, content, conversationId, restaurantId, senderId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Processing mentions for message:', messageId);

    // Extract @mentions from content using regex
    const mentionRegex = /@([A-Za-z0-9\s\-_.]+?)(?:\s|$|[.,!?])/g;
    const mentionNames = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentionNames.push(match[1].trim());
    }

    if (mentionNames.length === 0) {
      console.log('No mentions found in message');
      return new Response(JSON.stringify({ mentionsFound: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${mentionNames.length} mentions: ${mentionNames.join(', ')}`);

    // Look up mentioned users by display_name or email
    const { data: members, error: memberError } = await supabase
      .from('restaurant_members')
      .select(`
        user_id,
        profiles:user_id(id, email, display_name)
      `)
      .eq('restaurant_id', restaurantId)
      .eq('status', 'active');

    if (memberError) {
      console.error('Error fetching members:', memberError);
      throw memberError;
    }

    const mentionedUserIds = new Set<string>();
    
    for (const name of mentionNames) {
      const lowerName = name.toLowerCase();
      const matchedMember = (members as any[]).find(m => {
        const displayName = m.profiles?.display_name?.toLowerCase() || '';
        const email = m.profiles?.email?.toLowerCase() || '';
        const emailPrefix = email.split('@')[0];
        
        return displayName === lowerName || 
               emailPrefix === lowerName ||
               email === lowerName;
      });
      
      if (matchedMember && matchedMember.user_id !== senderId) {
        mentionedUserIds.add(matchedMember.user_id);
      }
    }

    console.log(`Matched ${mentionedUserIds.size} users to notify`);

    // Update message with mentions array
    const mentionedArray = Array.from(mentionedUserIds);
    const { error: updateError } = await supabase
      .from('chat_messages')
      .update({ mentions: mentionedArray })
      .eq('id', messageId);

    if (updateError) {
      console.error('Error updating message mentions:', updateError);
      throw updateError;
    }

    // Create notification records
    const notifications = mentionedArray.map(userId => ({
      user_id: userId,
      restaurant_id: restaurantId,
      conversation_id: conversationId,
      message_id: messageId,
      mentioned_by: senderId,
      type: 'mention',
      content: content.slice(0, 200), // Preview
      is_read: false
    }));

    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Error creating notifications:', notifError);
        throw notifError;
      }
    }

    console.log(`Created ${notifications.length} notifications`);

    return new Response(JSON.stringify({ 
      mentionsFound: mentionNames.length,
      notificationsCreated: notifications.length,
      mentionedUsers: mentionedArray
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing mentions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
