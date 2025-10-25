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

    // Extract @mentions from content using improved regex (handles more punctuation)
    const mentionRegex = /@([A-Za-z0-9\s\-_.]+?)(?=\s|$|[.,!?:;()\[\]{}…–—])/g;
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

    // Look up mentioned users - fetch members and profiles separately
    const { data: members, error: memberError } = await supabase
      .from('restaurant_members')
      .select('user_id')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'active');

    if (memberError) {
      console.error('Error fetching members:', memberError);
      throw memberError;
    }

    if (!members || members.length === 0) {
      console.log('No active members found for this restaurant');
      return new Response(JSON.stringify({ 
        mentionsFound: mentionNames.length,
        notificationsCreated: 0,
        message: 'No active members to mention'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch profiles for these members
    const memberUserIds = members.map(m => m.user_id);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .in('id', memberUserIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      throw profileError;
    }

    const mentionedUserIds = new Set<string>();
    const unmatchedMentions: string[] = [];
    
    for (const name of mentionNames) {
      const lowerName = name.toLowerCase();
      
      // Priority matching: exact > prefix > partial (if token length >= 3)
      const matchedProfile = profiles?.find(p => {
        const displayName = p.display_name?.toLowerCase() || '';
        const email = p.email?.toLowerCase() || '';
        const emailPrefix = email.split('@')[0];
        
        // 1. Exact match on display name or email
        if (displayName === lowerName || emailPrefix === lowerName || email === lowerName) {
          return true;
        }
        
        // 2. Partial match for tokens >= 3 chars (safe for common names)
        if (lowerName.length >= 3) {
          // Split display name into tokens (by space, hyphen, underscore)
          const nameTokens = displayName.split(/[\s\-_]+/);
          if (nameTokens.some((token: string) => token.startsWith(lowerName))) {
            return true;
          }
          
          // Also check email prefix partial match
          if (emailPrefix.startsWith(lowerName)) {
            return true;
          }
        }
        
        return false;
      });
      
      if (matchedProfile && matchedProfile.id !== senderId) {
        mentionedUserIds.add(matchedProfile.id);
      } else if (!matchedProfile) {
        unmatchedMentions.push(name);
      }
    }
    
    console.log(`Matched ${mentionedUserIds.size} users to notify, ${unmatchedMentions.length} unmatched: ${unmatchedMentions.join(', ')}`);

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
      mentionedUsers: mentionedArray,
      unmatchedMentions
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
