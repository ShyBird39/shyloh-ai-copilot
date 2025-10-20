import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { restaurant_id, pin } = await req.json();

    if (!restaurant_id || !pin) {
      return new Response(
        JSON.stringify({ error: 'Restaurant ID and PIN are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User attempting to claim:', user.id, 'for restaurant:', restaurant_id);

    // Verify PIN matches restaurant's tuning_pin
    const { data: restaurant, error: restaurantError } = await supabaseClient
      .from('restaurants')
      .select('tuning_pin, name')
      .eq('id', restaurant_id)
      .single();

    if (restaurantError) {
      console.error('Restaurant fetch error:', restaurantError);
      return new Response(
        JSON.stringify({ error: 'Restaurant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (restaurant.tuning_pin !== pin) {
      console.log('PIN mismatch. Expected:', restaurant.tuning_pin, 'Got:', pin);
      return new Response(
        JSON.stringify({ error: 'Invalid PIN' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('PIN verified successfully');

    // Check if user is already a member
    const { data: existingMember } = await supabaseClient
      .from('restaurant_members')
      .select('id')
      .eq('restaurant_id', restaurant_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingMember) {
      console.log('User is already a member');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'You are already a member of this restaurant',
          restaurant_id 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add user as restaurant member
    const { error: memberError } = await supabaseClient
      .from('restaurant_members')
      .insert({
        restaurant_id,
        user_id: user.id,
        status: 'active'
      });

    if (memberError) {
      console.error('Failed to add member:', memberError);
      return new Response(
        JSON.stringify({ error: 'Failed to add member: ' + memberError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Member added successfully');

    // Add user as owner role
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: user.id,
        restaurant_id,
        role: 'owner'
      });

    if (roleError) {
      console.error('Failed to add role:', roleError);
      // Clean up member record if role fails
      await supabaseClient
        .from('restaurant_members')
        .delete()
        .eq('restaurant_id', restaurant_id)
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ error: 'Failed to assign owner role: ' + roleError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Owner role assigned successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully claimed ${restaurant.name}!`,
        restaurant_id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in claim-restaurant:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});