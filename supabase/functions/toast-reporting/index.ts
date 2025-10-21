import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOAST_API_BASE = 'https://ws-api.toasttab.com';
const MAX_POLL_ATTEMPTS = 30;
const POLL_INTERVAL_MS = 2000;

interface ToastReportRequest {
  action: 'request' | 'poll' | 'fetch' | 'request-and-poll' | 'restaurants';
  reportType: 'metrics' | 'labor' | 'menu' | 'check' | 'restaurants';
  timeRange?: 'day' | 'week' | 'month' | 'year';
  startDate?: number; // YYYYMMDD format
  endDate?: number; // YYYYMMDD format
  restaurantIds?: string[];
  reportRequestGuid?: string;
  groupBy?: string[];
  aggregateBy?: 'DAY' | 'HOUR';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ToastReportRequest = await req.json();
    console.log('Toast Reporting request:', JSON.stringify(body));

    // Get auth token from toast-auth function
    console.log('Getting Toast access token...');
    const authResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/toast-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!authResponse.ok) {
      throw new Error('Failed to authenticate with Toast API');
    }

    const { accessToken } = await authResponse.json();
    console.log('Got Toast access token');

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // Handle different actions
    switch (body.action) {
      case 'restaurants':
        return await getRestaurants(headers);
      
      case 'request':
        return await requestReport(body, headers);
      
      case 'poll':
        if (!body.reportRequestGuid) {
          throw new Error('reportRequestGuid required for poll action');
        }
        return await pollReport(body.reportType, body.reportRequestGuid, headers);
      
      case 'fetch':
        if (!body.reportRequestGuid) {
          throw new Error('reportRequestGuid required for fetch action');
        }
        return await fetchReport(body.reportType, body.reportRequestGuid, headers);
      
      case 'request-and-poll':
        return await requestAndPollReport(body, headers);
      
      default:
        throw new Error(`Unknown action: ${body.action}`);
    }
  } catch (error) {
    console.error('Error in toast-reporting:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        message: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function getRestaurants(headers: Record<string, string>) {
  console.log('Fetching restaurants information...');
  
  const response = await fetch(
    `${TOAST_API_BASE}/era/v1/restaurants-information`,
    { headers }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch restaurants: ${response.status} ${errorText}`);
  }

  const restaurants = await response.json();
  console.log('Restaurants fetched:', restaurants.length);

  return new Response(
    JSON.stringify({ 
      success: true, 
      data: restaurants 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function requestReport(body: ToastReportRequest, headers: Record<string, string>) {
  if (!body.startDate || !body.endDate) {
    throw new Error('startDate and endDate required');
  }

  let endpoint = '';
  let requestBody: any = {
    startBusinessDate: body.startDate,
    endBusinessDate: body.endDate,
    restaurantIds: body.restaurantIds || [],
    excludedRestaurantIds: [],
  };

  // Build endpoint based on report type
  switch (body.reportType) {
    case 'metrics':
      endpoint = body.timeRange ? `/era/v1/metrics/${body.timeRange}` : '/era/v1/metrics';
      if (body.groupBy) {
        requestBody.groupBy = body.groupBy;
      }
      // Add aggregateBy query param for day timeRange
      if (body.timeRange === 'day' && body.aggregateBy) {
        endpoint += `?aggregateBy=${body.aggregateBy}`;
      }
      break;
    
    case 'labor':
      if (!body.timeRange) throw new Error('timeRange required for labor reports');
      endpoint = `/era/v1/labor/${body.timeRange}`;
      if (body.groupBy) {
        requestBody.groupBy = body.groupBy;
      }
      break;
    
    case 'menu':
      if (!body.timeRange) throw new Error('timeRange required for menu reports');
      endpoint = `/era/v1/menu/${body.timeRange}`;
      break;
    
    case 'check':
      endpoint = '/era/v1/check/day'; // Only day is supported
      break;
    
    default:
      throw new Error(`Unsupported report type: ${body.reportType}`);
  }

  console.log('Requesting report:', endpoint, requestBody);

  const response = await fetch(`${TOAST_API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to request report: ${response.status} ${errorText}`);
  }

  // Toast returns plain string UUID
  const reportRequestGuid = await response.text();
  const cleanGuid = reportRequestGuid.replace(/^"|"$/g, '').trim();
  
  console.log('Report request created:', cleanGuid);

  return new Response(
    JSON.stringify({ 
      success: true, 
      reportRequestGuid: cleanGuid,
      status: 'requested',
      message: 'Report request created. Use poll or fetch action to retrieve data.'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function pollReport(reportType: string, reportRequestGuid: string, headers: Record<string, string>) {
  let endpoint = '';
  
  switch (reportType) {
    case 'metrics':
      endpoint = `/era/v1/metrics/${reportRequestGuid}?fetchRestaurantNames=true`;
      break;
    case 'labor':
      endpoint = `/era/v1/labor/${reportRequestGuid}`;
      break;
    case 'menu':
      endpoint = `/era/v1/menu/${reportRequestGuid}`;
      break;
    case 'check':
      endpoint = `/era/v1/check/${reportRequestGuid}?fetchRestaurantNames=true`;
      break;
    default:
      throw new Error(`Unsupported report type: ${reportType}`);
  }

  console.log('Polling report:', endpoint);

  const response = await fetch(`${TOAST_API_BASE}${endpoint}`, { headers });

  if (response.status === 202) {
    // Still processing
    const inProgressData = await response.json();
    return new Response(
      JSON.stringify({ 
        success: false,
        status: 'processing',
        reportRequestGuid,
        message: 'Report is still being processed. Try again in a few seconds.',
        details: inProgressData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202
      }
    );
  }

  if (response.status === 404) {
    return new Response(
      JSON.stringify({ 
        success: false,
        status: 'error',
        message: 'Report request GUID not found. Request a new report.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      }
    );
  }

  if (response.status === 409) {
    return new Response(
      JSON.stringify({ 
        success: false,
        status: 'error',
        message: 'Unable to process request. Request a new report GUID.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409
      }
    );
  }

  if (response.status === 504) {
    return new Response(
      JSON.stringify({ 
        success: false,
        status: 'error',
        message: 'Request timeout. Please try again.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 504
      }
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to poll report: ${response.status} ${errorText}`);
  }

  // Data ready
  const data = await response.json();
  const dataArray = Array.isArray(data) ? data : [data];
  
  console.log('Report data ready:', dataArray.length, 'records');

  return new Response(
    JSON.stringify({ 
      success: true,
      status: 'ready',
      data: dataArray,
      reportRequestGuid
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function fetchReport(reportType: string, reportRequestGuid: string, headers: Record<string, string>) {
  return await pollReport(reportType, reportRequestGuid, headers);
}

async function requestAndPollReport(body: ToastReportRequest, headers: Record<string, string>) {
  // First, request the report
  const requestResponse = await requestReport(body, headers);
  const requestData = await requestResponse.json();
  
  if (!requestData.success) {
    return requestResponse;
  }

  const reportRequestGuid = requestData.reportRequestGuid;
  console.log('Starting polling for report:', reportRequestGuid);

  // Poll until data is ready or max attempts reached
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
    console.log(`Poll attempt ${attempt}/${MAX_POLL_ATTEMPTS}`);
    
    // Wait before polling
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    
    const pollResponse = await pollReport(body.reportType, reportRequestGuid, headers);
    const pollData = await pollResponse.json();
    
    if (pollData.status === 'ready') {
      console.log('Report data ready after', attempt, 'attempts');
      return new Response(
        JSON.stringify(pollData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (pollData.status === 'error') {
      return new Response(
        JSON.stringify(pollData),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: pollResponse.status
        }
      );
    }
    
    // Still processing, continue polling
  }

  // Max attempts reached
  return new Response(
    JSON.stringify({ 
      success: false,
      status: 'timeout',
      reportRequestGuid,
      message: `Report data not ready after ${MAX_POLL_ATTEMPTS} polling attempts. Use fetch action with this GUID to try again later.`
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 408
    }
  );
}
