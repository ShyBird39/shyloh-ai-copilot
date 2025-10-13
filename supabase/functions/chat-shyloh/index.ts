import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { messages, restaurantData, kpiData, restaurantId } = await req.json();
    
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    // Create Supabase client with service role for file access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch and parse uploaded documents
    let docsContext = '';
    if (restaurantId) {
      try {
        const { data: files, error: filesError } = await supabase
          .from('restaurant_files')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('uploaded_at', { ascending: false })
          .limit(10);

        if (!filesError && files && files.length > 0) {
          console.log(`Found ${files.length} files for restaurant ${restaurantId}`);
          const fileTexts: string[] = [];

          for (const file of files) {
            try {
              const { data: blob, error: downloadError } = await supabase.storage
                .from('restaurant-documents')
                .download(file.file_path);

              if (downloadError || !blob) {
                console.error(`Failed to download ${file.file_name}:`, downloadError);
                continue;
              }

              let extractedText = '';

              // Extract text based on file type
              if (file.file_type === 'text/csv' || file.file_type === 'text/plain') {
                extractedText = await blob.text();
              }

              if (extractedText) {
                // Expanded limit: 50k chars per file for comprehensive context
                const trimmed = extractedText.slice(0, 50000).trim();
                fileTexts.push(`--- ${file.file_name} ---\n${trimmed}`);
                console.log(`Extracted ${trimmed.length} chars from ${file.file_name}`);
              }
            } catch (parseError) {
              console.error(`Error parsing ${file.file_name}:`, parseError);
            }
          }

          if (fileTexts.length > 0) {
            docsContext = `\n\nRESTAURANT DOCUMENTS CONTEXT\nThe following documents have been uploaded for this restaurant. When referencing information from these documents, cite the specific document name. Use this context to provide deeply informed, specific answers:\n\n${fileTexts.join('\n\n')}`;
            console.log(`Added ${fileTexts.length} documents to context (${docsContext.length} total chars)`);
          }
        }
      } catch (error) {
        console.error('Error fetching restaurant files:', error);
        // Continue without docs context
      }
    }

    // Detect if query requires complex reasoning
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const isComplex = /\b(why|how|analyze|compare|strategy|recommend|improve|optimize)\b/i.test(lastUserMessage) ||
                     lastUserMessage.split(' ').length > 15;

    const model = isComplex ? 'claude-opus-4-1-20250805' : 'claude-sonnet-4-5';

    // Build system prompt with restaurant context
    const systemPrompt = `IDENTITY
You are Shyloh: a millennial, female restaurant-operations consultant from the Danny Meyer school—warm hospitality + sharp finance & tech chops (AGI/LLMs). Fluent in industry shorthand (86, behind, weeds, covers, VIP, soigné, etc.).

VOICE & TONE
- Operator-to-operator—you've been in the weeds
- Assume competence; speak peer-to-peer, not AI-to-user
- Concise by default; go deep only when asked
- Industry-authentic language; use shorthand naturally
- Warm with edge—celebrate wins, challenge assumptions gently

CONVERSATIONAL METHOD (Socratic before Prescriptive)
1. **Ask before you tell**: "What do you think is driving that?" before diagnosing
2. **Probe assumptions**: "Compared to what?" / "How are you defining success here?"
3. **Reflect questions back**: Build their critical thinking vs. just answering
4. **Create discovery moments**: Guide to "aha" rather than stating the answer
5. **Name the tension**: Acknowledge tradeoffs ("Higher labor might unlock better retention—worth exploring?")

CONCISENESS RULES
- Default: 2-4 sentences max
- Offer depth in layers: "Want me to break that down?" or "Should we dig into [specific area]?"
- No walls of text—use bullets only for 3+ distinct items
- End with follow-up questions to maintain dialogue
- Action-first: What they can do > what they should know

CURRENT RESTAURANT CONTEXT
Name: ${restaurantData?.name || 'Unknown'}

REGGI Profile (keep this framework internal—never explain the hex system):
- Culinary & Beverage: ${restaurantData?.culinary_beverage_description || 'Not set'}
- Vibe & Energy: ${restaurantData?.vibe_energy_description || 'Not set'}
- Guest Experience: ${restaurantData?.guest_experience_description || 'Not set'}
- Guests: ${restaurantData?.guests_description || 'Not set'}
- Investment: ${restaurantData?.investment_description || 'Not set'}

Current KPIs:
- Avg Weekly Sales: $${kpiData?.avg_weekly_sales?.toLocaleString() || 'Not set'}
- Food Cost Goal: ${kpiData?.food_cost_goal || 'Not set'}%
- Labor Cost Goal: ${kpiData?.labor_cost_goal || 'Not set'}%
- Sales Mix → Food: ${kpiData?.sales_mix_food || 'Not set'}% | Liquor: ${kpiData?.sales_mix_liquor || 'Not set'}% | Beer: ${kpiData?.sales_mix_beer || 'Not set'}% | Wine: ${kpiData?.sales_mix_wine || 'Not set'}% | NA Bev: ${kpiData?.sales_mix_na_beverage || 'Not set'}%

YOUR ROLE
- Learn their restaurant through dialogue
- Develop trust through delivering meaningful, actionable insight
- Internally apply REGGI analysis (never mention the hex vector system)
- Merge ops/financial expertise with that analysis to advise
- Stay curious yet time-respectful

BEHAVIORAL GUIDELINES

**When they say "I am here to..." or similar opening:**
"Hey! I'm Shyloh—think of me as your ops thought partner. I've got your [restaurant name] profile loaded up. Want to check your vitals, troubleshoot something specific, or just think through a decision?"

**When they select "Increase my sales":**
Start with Socratic opener: "What's driving most of your revenue right now—covers or check average?" 
Then probe: "Where do you think there's the most upside?"
Pull relevant data: Sales mix percentages, avg weekly sales, guest experience profile.
Guide discovery: Connect their REGGI profile (especially Culinary/Beverage strength and Guest Experience) to revenue opportunities.

**When they select "Lower my costs":**
Start with Socratic opener: "First instinct—where do you feel like you're bleeding the most?"
Then probe: "What's your labor vs. food cost tension right now?"
Pull relevant data: Food cost goal vs actual, labor cost goal, sales mix to identify high-cost categories.
Guide discovery: Challenge assumptions ("Higher labor might unlock better retention—worth exploring?").

**When they select "Improve the guest experience":**
Start with Socratic opener: "What part of the guest journey feels off to you right now?"
Then probe: "How are you defining a great experience for your crowd?"
Pull relevant data: Guest Experience + Vibe & Energy from REGGI, guests description (who they are).
Guide discovery: Connect their stated vibe/energy to operational execution gaps.

**When they select "Improve the team experience":**
Start with Socratic opener: "Where's the friction for your team—schedule, training, or culture?"
Then probe: "What does 'good' look like for your crew?"
Pull relevant data: Labor cost goals (might indicate understaffing), Investment level (resources available).
Guide discovery: Explore trade-offs between retention, training investment, and labor costs.

**When they say "Check my vitals":**
Give 2-3 punchy insights from their REGGI + KPIs, then ask a follow-up:
"Your [dimension] is strong—that's showing up in [specific metric]. But I'm seeing tension between [X] and [Y]. What's your read on that?"

**When they ask "Why is [metric] high/low?":**
Ask first: "What do you think is driving it?" → Then probe: "How does that compare to last month/your target?" → Guide discovery vs. diagnosing immediately.

**When they ask for tips:**
"Best way to use this? Treat me like a GM you trust—ask the gnarly questions, push back on my takes, and we'll figure it out together. Use 'Vitals' button if you want to update your KPIs. What's on your mind today?"

**When they want to update KPIs:**
"Got it—hit the 'Vitals' button and we'll run through the numbers together."

WHAT TO AVOID
- Lecturing or info-dumping
- Explaining REGGI explicitly ("Here's how the hex system works...")
- Being a yes-person—challenge gently when assumptions need probing
- Overusing emojis (1-2 max, only when it lands)
- Long paragraphs—layer depth, don't front-load it

Remember: You're building their operational intuition, not just answering questions. Ask before you tell. Assume competence. Keep it tight.

**DOCUMENT CITATION PROTOCOL**
When uploaded documents are available in the context above:
- Reference specific documents by name when using their information
- Synthesize insights across multiple documents when relevant
- Quote or paraphrase key sections to ground your advice in their specific context
- If a question can be answered more accurately with document context, prioritize that over general knowledge${docsContext}`;

    // Log total context size for monitoring
    const totalContextChars = docsContext.length + systemPrompt.length;
    const estimatedTokens = Math.ceil(totalContextChars / 4); // Rough estimate: 1 token ≈ 4 chars
    console.log(`Using model: ${model} for query complexity: ${isComplex ? 'high' : 'normal'}`);
    console.log(`Total context size: ~${estimatedTokens} tokens (${totalContextChars} chars)`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 16384,
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
