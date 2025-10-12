import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOAST_API_BASE = 'https://ws-api.toasttab.com';
const RESTAURANT_GUID = '867A85A77688-SHY001-AME-$$';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Getting Toast access token...');
    
    // Get auth token
    const authResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/toast-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!authResponse.ok) {
      throw new Error('Failed to authenticate with Toast API');
    }

    const { accessToken } = await authResponse.json();
    console.log('Got Toast access token');

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Toast-Restaurant-External-ID': RESTAURANT_GUID,
    };

    // Fetch restaurant config
    console.log('Fetching restaurant config...');
    const configResponse = await fetch(
      `${TOAST_API_BASE}/config/v2/restaurants/${RESTAURANT_GUID}`,
      { headers }
    );
    if (!configResponse.ok) {
      const errorText = await configResponse.text();
      console.error('Config error:', configResponse.status, errorText);
    }

    // Fetch menus
    console.log('Fetching menus...');
    const menusResponse = await fetch(
      `${TOAST_API_BASE}/config/v2/menus`,
      { headers }
    );
    if (!menusResponse.ok) {
      const errorText = await menusResponse.text();
      console.error('Menus error:', menusResponse.status, errorText);
    }

    // Fetch today's orders
    const today = new Date().toISOString().split('T')[0];
    console.log('Fetching orders for:', today);
    const ordersResponse = await fetch(
      `${TOAST_API_BASE}/orders/v2/orders?businessDate=${today}`,
      { headers }
    );
    if (!ordersResponse.ok) {
      const errorText = await ordersResponse.text();
      console.error('Orders error:', ordersResponse.status, errorText);
    }

    const config = configResponse.ok ? await configResponse.json() : null;
    const menus = menusResponse.ok ? await menusResponse.json() : null;
    const orders = ordersResponse.ok ? await ordersResponse.json() : null;

    console.log('Orders response status:', ordersResponse.status);
    console.log('Orders response data:', JSON.stringify(orders).substring(0, 500));
    console.log('Config data:', JSON.stringify(config).substring(0, 200));
    console.log('Toast data fetched successfully');

    // Calculate metrics from orders
    let orderCount = 0;
    let totalRevenue = 0;

    if (orders && Array.isArray(orders)) {
      orderCount = orders.length;
      totalRevenue = orders.reduce((sum, order) => {
        return sum + (order.totalAmount || 0);
      }, 0);
    }

    // Extract menu highlights
    let menuHighlights: Array<{ name: string; price: string }> = [];
    if (menus && Array.isArray(menus)) {
      const allItems = menus.flatMap((menu: any) => 
        menu.groups?.flatMap((group: any) => group.items || []) || []
      ).filter((item: any) => item && item.name);
      
      menuHighlights = allItems.slice(0, 5).map((item: any) => ({
        name: item.name,
        price: item.price ? (item.price / 100).toFixed(2) : 'N/A',
      }));
    }

    const result = {
      restaurant: {
        name: config?.name || 'Shy Bird',
        status: config?.status || 'OPEN',
        locationName: config?.locationName || 'Unknown',
      },
      metrics: {
        orderCount,
        revenue: (totalRevenue / 100).toFixed(2),
        date: today,
      },
      menuHighlights,
      lastSync: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in toast-get-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
