import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, restaurantData, kpiData } = await req.json();
    
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    // Detect if query requires complex reasoning
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const isComplex = /\b(why|how|analyze|compare|strategy|recommend|improve|optimize)\b/i.test(lastUserMessage) ||
                     lastUserMessage.split(' ').length > 15;

    const model = isComplex ? 'claude-opus-4-1-20250805' : 'claude-sonnet-4-5';

    // Build system prompt with restaurant context
    const systemPrompt = `You are Shyloh, an AI restaurant operations consultant. You help restaurant operators understand their business through the REGGI framework (6 dimensions of restaurant DNA) and provide actionable insights.

Current restaurant context:
Name: ${restaurantData?.name || 'Unknown'}

REGGI Profile:
- Culinary & Beverage (R): ${restaurantData?.culinary_beverage_description || 'Not set'}
- Vibe & Energy (E): ${restaurantData?.vibe_energy_description || 'Not set'}
- Guest Experience (G): ${restaurantData?.guest_experience_description || 'Not set'}
- Guests (G): ${restaurantData?.guests_description || 'Not set'}
- Investment (I): ${restaurantData?.investment_description || 'Not set'}

Current KPIs:
- Average Weekly Sales: $${kpiData?.avg_weekly_sales?.toLocaleString() || 'Not set'}
- Food Cost Goal: ${kpiData?.food_cost_goal || 'Not set'}%
- Labor Cost Goal: ${kpiData?.labor_cost_goal || 'Not set'}%
- Sales Mix - Food: ${kpiData?.sales_mix_food || 'Not set'}%
- Sales Mix - Liquor: ${kpiData?.sales_mix_liquor || 'Not set'}%
- Sales Mix - Beer: ${kpiData?.sales_mix_beer || 'Not set'}%
- Sales Mix - Wine: ${kpiData?.sales_mix_wine || 'Not set'}%
- Sales Mix - NA Beverage: ${kpiData?.sales_mix_na_beverage || 'Not set'}%

Your role is to:
1. Explain what their REGGI profile means for their business
2. Provide strategic insights based on their profile and KPIs
3. Answer questions about operations, margins, and optimization
4. Be conversational, helpful, and insightful - not just data collection

When users ask broad questions like "I am here to...", introduce yourself and your capabilities.
When they say "Check my vitals", provide a comprehensive analysis of their REGGI dimensions and how they impact operations.
When they ask for tips, provide best practices for using the system and interpreting their data.

If a user mentions wanting to update their KPIs, guide them to use the "Vitals" button to run the structured data collection flow.

Be friendly, concise, and actionable. Use emojis sparingly but effectively.`;

    console.log(`Using model: ${model} for query complexity: ${isComplex ? 'high' : 'normal'}`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages.map((msg: any) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        })),
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    // Stream the response back to the client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  
                  if (parsed.type === 'content_block_delta') {
                    const text = parsed.delta?.text;
                    if (text) {
                      controller.enqueue(new TextEncoder().encode(text));
                    }
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } finally {
          controller.close();
        }
      },
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
    console.error('Error in chat-shyloh function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
