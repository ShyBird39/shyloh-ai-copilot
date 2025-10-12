import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOAST_API_BASE = 'https://ws-api.toasttab.com';
const DEFAULT_RESTAURANT_GUID = Deno.env.get('TOAST_RESTAURANT_GUID') || '';

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

    let restaurantGuid = '';
    try {
      const body = await req.json();
      restaurantGuid = body?.restaurantGuid || DEFAULT_RESTAURANT_GUID;
    } catch (_) {
      restaurantGuid = DEFAULT_RESTAURANT_GUID;
    }

    if (!restaurantGuid) {
      throw new Error('Missing TOAST_RESTAURANT_GUID. Set the secret or pass {"restaurantGuid":"<uuid>"} in request body.');
    }

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Toast-Restaurant-External-ID': restaurantGuid,
    };

    // Fetch restaurant config
    console.log('Fetching restaurant config...');
    const configResponse = await fetch(
      `${TOAST_API_BASE}/config/v2/restaurants/${restaurantGuid}`,
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
    // Fetch today's orders (Toast expects yyyyMMdd)
    const todayDate = new Date();
    const businessDate = todayDate.toISOString().slice(0, 10).replace(/-/g, '');
    console.log('Fetching orders for businessDate:', businessDate);
    const ordersResponse = await fetch(
      `${TOAST_API_BASE}/orders/v2/orders?businessDate=${businessDate}`,
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
      
      // Toast returns an array of order GUIDs; fetch details to compute net sales
      console.log('Fetching individual order details for revenue calculation...');
      const orderDetailsPromises = orders.map(async (orderGuid: string) => {
        try {
          const orderResponse = await fetch(
            `${TOAST_API_BASE}/orders/v2/orders/${orderGuid}`,
            { headers }
          );
          if (orderResponse.ok) {
            const orderDetail = await orderResponse.json();
            return orderDetail;
          }
          return null;
        } catch (error) {
          console.error(`Error fetching order ${orderGuid}:`, error);
          return null;
        }
      });

      const orderDetails = await Promise.all(orderDetailsPromises);
      
      // Net Sales (per Toast docs): items preDiscountPrice - item discounts + non-gratuity service charges - check-level discounts
      totalRevenue = orderDetails
        .filter((order: any) => order && !order.voided && !order.deleted)
        .reduce((orderSum: number, order: any) => {
          const checks = Array.isArray(order.checks) ? order.checks : [];
          const checksTotal = checks
            .filter((check: any) => !check?.voided && !check?.deleted)
            .reduce((checkSum: number, check: any) => {
              const selections = (check.menuItemSelections || check.selections || []);
              const itemsNet = selections
                .filter((sel: any) => !sel?.voided && !sel?.deleted && sel?.displayName !== 'Gift Card')
                .reduce((selSum: number, sel: any) => {
                  const prePrice = Number(sel?.preDiscountPrice ?? 0);
                  const itemDiscounts = (sel?.discounts || []).reduce((dSum: number, d: any) => dSum + Number(d?.nonTaxableDiscountAmount ?? 0), 0);
                  return selSum + (prePrice - itemDiscounts);
                }, 0);

              const serviceCharges = (check.serviceCharges || []).reduce((scSum: number, sc: any) => {
                const isGratuity = Boolean(sc?.gratuity);
                return scSum + (isGratuity ? 0 : Number(sc?.chargeAmount ?? 0));
              }, 0);

              const checkLevelDiscounts = (check.discounts || []).reduce((dSum: number, d: any) => dSum + Number(d?.nonTaxableDiscountAmount ?? 0), 0);

              const checkNet = itemsNet + serviceCharges - checkLevelDiscounts;
              return checkSum + checkNet;
            }, 0);

          return orderSum + checksTotal;
        }, 0);

      console.log(`Processed ${orderDetails.filter((o: any) => o).length} orders, computed net sales: ${totalRevenue}`);
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
        revenue: totalRevenue.toFixed(2),
        date: businessDate,
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
