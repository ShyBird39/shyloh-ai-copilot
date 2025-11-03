import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, tags } = await req.json();

    if (!content || content.length < 20) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Build tag context for AI
    const tagContext = tags.map((t: any) => 
      `- ${t.tag_name} (${t.display_name}): ${t.keywords.join(', ')}`
    ).join('\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        max_completion_tokens: 500,
        messages: [
          {
            role: 'system',
            content: `You are analyzing restaurant manager shift log entries. Your job is to suggest the most relevant tags based on the content. Return ONLY the top 3-5 most relevant tags, focusing on the PRIMARY intent of the log entry.

IMPORTANT: Common words have different meanings in context:
- "shift" as a time period (e.g., "during the shift", "challenging shift") should NOT trigger "Schedule Change"
- "Schedule Change" should ONLY be suggested for: shift swaps, coverage requests, schedule adjustments, time-off requests
- Prioritize operational issues: training needs, performance concerns, equipment problems, customer service, follow-ups

Available tags:
${tagContext}`
          },
          {
            role: 'user',
            content: `Analyze this shift log entry and suggest the most relevant tags:\n\n"${content}"\n\nReturn the tag suggestions with confidence scores and brief reasoning.`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_tags",
            description: "Return suggested tags for the manager log entry",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      tag_name: {
                        type: "string",
                        description: "The tag_name value from the available tags"
                      },
                      confidence: {
                        type: "number",
                        description: "Confidence score between 0 and 1"
                      },
                      reason: {
                        type: "string",
                        description: "Brief explanation of why this tag applies"
                      }
                    },
                    required: ["tag_name", "confidence", "reason"]
                  }
                }
              },
              required: ["suggestions"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "suggest_tags" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error('No tool call in response:', data);
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    // Validate that suggested tag_names exist in the provided tags
    const validTagNames = new Set(tags.map((t: any) => t.tag_name));
    const validatedSuggestions = result.suggestions
      .filter((s: any) => validTagNames.has(s.tag_name))
      .slice(0, 5); // Max 5 suggestions

    console.log(`AI suggested ${validatedSuggestions.length} tags for log entry`);

    return new Response(
      JSON.stringify({ suggestions: validatedSuggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in suggest-log-tags function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestions: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
