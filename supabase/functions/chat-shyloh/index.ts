import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getDocument, GlobalWorkerOptions } from 'https://esm.sh/pdfjs-dist@4.0.379/legacy/build/pdf.mjs';
import mammoth from 'https://esm.sh/mammoth@1.8.0/mammoth.browser?bundle';

// Configure PDF.js worker for Deno runtime
GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/legacy/build/pdf.worker.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Execute Notion tool calls
async function executeNotionTool(toolName: string, toolInput: any): Promise<string> {
  const NOTION_API_KEY = Deno.env.get('NOTION_API_KEY');
  if (!NOTION_API_KEY) {
    return JSON.stringify({ error: "Notion API key not configured" });
  }

  const notionHeaders = {
    'Authorization': `Bearer ${NOTION_API_KEY}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };

  try {
    if (toolName === 'search_notion') {
      const response = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: notionHeaders,
        body: JSON.stringify({
          query: toolInput.query,
          filter: toolInput.filter ? { value: toolInput.filter, property: 'object' } : undefined,
          page_size: 10,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Notion search error:', error);
        return JSON.stringify({ error: `Notion API error: ${response.status}` });
      }

      const data = await response.json();
      return JSON.stringify({
        results: data.results.map((item: any) => ({
          id: item.id,
          type: item.object,
          title: item.properties?.title?.title?.[0]?.plain_text || 
                 item.properties?.Name?.title?.[0]?.plain_text || 
                 'Untitled',
          url: item.url,
        })),
      });
    }

    if (toolName === 'read_notion_page') {
      const pageId = toolInput.page_id.replace(/-/g, '');
      
      // Get page properties
      const pageResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        headers: notionHeaders,
      });

      if (!pageResponse.ok) {
        const error = await pageResponse.text();
        console.error('Notion page error:', error);
        return JSON.stringify({ error: `Notion API error: ${pageResponse.status}` });
      }

      // Get page content blocks
      const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
        headers: notionHeaders,
      });

      if (!blocksResponse.ok) {
        return JSON.stringify({ error: 'Failed to fetch page content' });
      }

      const pageData = await pageResponse.json();
      const blocksData = await blocksResponse.json();

      // Extract text content from blocks
      const content = blocksData.results.map((block: any) => {
        if (block.type === 'paragraph' && block.paragraph?.rich_text) {
          return block.paragraph.rich_text.map((t: any) => t.plain_text).join('');
        }
        if (block.type === 'heading_1' && block.heading_1?.rich_text) {
          return '# ' + block.heading_1.rich_text.map((t: any) => t.plain_text).join('');
        }
        if (block.type === 'heading_2' && block.heading_2?.rich_text) {
          return '## ' + block.heading_2.rich_text.map((t: any) => t.plain_text).join('');
        }
        if (block.type === 'bulleted_list_item' && block.bulleted_list_item?.rich_text) {
          return '• ' + block.bulleted_list_item.rich_text.map((t: any) => t.plain_text).join('');
        }
        return '';
      }).filter(Boolean).join('\n\n');

      return JSON.stringify({
        id: pageData.id,
        title: pageData.properties?.title?.title?.[0]?.plain_text || 
               pageData.properties?.Name?.title?.[0]?.plain_text || 
               'Untitled',
        url: pageData.url,
        content,
      });
    }

    if (toolName === 'query_notion_database') {
      const databaseId = toolInput.database_id.replace(/-/g, '');
      
      const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: notionHeaders,
        body: JSON.stringify({
          filter: toolInput.filter,
          sorts: toolInput.sorts,
          page_size: 20,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Notion database query error:', error);
        return JSON.stringify({ error: `Notion API error: ${response.status}` });
      }

      const data = await response.json();
      return JSON.stringify({
        results: data.results.map((item: any) => ({
          id: item.id,
          properties: item.properties,
          url: item.url,
        })),
      });
    }

    return JSON.stringify({ error: 'Unknown tool' });
  } catch (error) {
    console.error('Notion tool execution error:', error);
    return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, restaurantData, kpiData, restaurantId, useNotion = false } = await req.json();
    
    console.log(`Notion tools ${useNotion ? 'ENABLED' : 'disabled'} for this query`);
    
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    // Create Supabase client with service role for file access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch custom knowledge/rules
    let customKnowledgeContext = '';
    if (restaurantId) {
      try {
        const { data: knowledge, error: knowledgeError } = await supabase
          .from('restaurant_custom_knowledge')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (!knowledgeError && knowledge && knowledge.length > 0) {
          const knowledgeTexts = knowledge.map(k => 
            `**${k.title}**${k.category ? ` (${k.category})` : ''}\n${k.content}`
          ).join('\n\n');
          
          customKnowledgeContext = `\n\nRESTAURANT-SPECIFIC RULES & KNOWLEDGE\nThe operator has provided the following custom rules, concepts, and knowledge specific to their restaurant. Always prioritize and reference these when relevant to the conversation:\n\n${knowledgeTexts}`;
          console.log(`Added ${knowledge.length} custom knowledge entries to context`);
        }
      } catch (error) {
        console.error('Error fetching custom knowledge:', error);
      }
    }

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
              try {
                if (file.file_type === 'application/pdf') {
                  const arrayBuffer = await blob.arrayBuffer();
                  const typedArray = new Uint8Array(arrayBuffer);
                  const loadingTask = getDocument({ data: typedArray });
                  const pdfDoc = await loadingTask.promise;

                  const textParts: string[] = [];
                  const numPages = Math.min(pdfDoc.numPages, 50);
                  for (let i = 1; i <= numPages; i++) {
                    const page = await pdfDoc.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = (textContent.items as any[]).map((it: any) => it.str).join(' ');
                    textParts.push(pageText);
                  }
                  extractedText = textParts.join('\n\n');
                  console.log(`Successfully parsed PDF ${file.file_name} - ${numPages} pages`);
                } else if (file.file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                  const arrayBuffer = await blob.arrayBuffer();
                  const result = await mammoth.extractRawText({ arrayBuffer });
                  extractedText = result.value || '';
                  console.log(`Extracted ${extractedText.length} chars from Word docx ${file.file_name}`);
                } else if (file.file_type === 'application/msword') {
                  // .doc (binary) not supported by mammoth; skipping text extraction
                  console.warn(`.doc format not supported for text extraction: ${file.file_name}`);
                  extractedText = '';
                } else if (file.file_type === 'text/csv' || 
                           file.file_type === 'text/plain' || 
                           file.file_type === 'text/markdown') {
                  extractedText = await blob.text();
                  console.log(`Extracted ${extractedText.length} chars from text file ${file.file_name}`);
                } else if (file.file_type?.startsWith('image/')) {
                  // Images are uploaded but text extraction would require OCR
                  console.log(`Image file ${file.file_name} uploaded (OCR not implemented)`);
                  extractedText = `[Image file: ${file.file_name}]`;
                }
              } catch (parseError) {
                console.error(`Error parsing ${file.file_name} (${file.file_type}):`, parseError);
                extractedText = '';
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

    // Notion tools - only included when explicitly requested via @notion or /notion
    const notionTools = useNotion ? [
      {
        name: "search_notion",
        description: "Search across all accessible Notion pages and databases for specific content, keywords, or concepts. Returns matching pages with titles, URLs, and excerpts.",
        input_schema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query to find relevant Notion pages or database entries"
            },
            filter: {
              type: "string",
              description: "Optional filter by object type: 'page' or 'database'",
              enum: ["page", "database"]
            }
          },
          required: ["query"]
        }
      },
      {
        name: "read_notion_page",
        description: "Retrieve the full content of a specific Notion page by its ID. Use this after finding relevant pages via search to get detailed information.",
        input_schema: {
          type: "object",
          properties: {
            page_id: {
              type: "string",
              description: "The Notion page ID to retrieve (can be found from search results)"
            }
          },
          required: ["page_id"]
        }
      },
      {
        name: "query_notion_database",
        description: "Query a Notion database with filters and sorting. Useful for retrieving structured data like inventory lists, SOPs, schedules, or recipes.",
        input_schema: {
          type: "object",
          properties: {
            database_id: {
              type: "string",
              description: "The Notion database ID to query"
            },
            filter: {
              type: "object",
              description: "Optional filter object following Notion API filter syntax"
            },
            sorts: {
              type: "array",
              description: "Optional array of sort objects"
            }
          },
          required: ["database_id"]
        }
      }
    ] : [];

    // Conditionally add Notion context to system prompt
    const notionContext = useNotion 
      ? "\n\nNOTION INTEGRATION ACTIVE\nThe user has explicitly requested Notion access via @notion mention. You MUST use these tools to search their Notion workspace:\n- search_notion: Search for pages/databases by keyword (START HERE - always search first)\n- read_notion_page: Get full content of a specific page after finding it via search\n- query_notion_database: Query structured databases after finding them via search\n\nWhen the user asks about logs, SOPs, schedules, recipes, inventory, or any operational documentation, IMMEDIATELY use search_notion to look for it. Don't ask where it's stored—assume it's in Notion and search for it. Only mention that you couldn't find it if the search returns no results. Always cite specific Notion pages when using this information."
      : "";

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
- If a question can be answered more accurately with document context, prioritize that over general knowledge${customKnowledgeContext}${docsContext}${notionContext}`;

    // Log total context size for monitoring
    const totalContextChars = docsContext.length + systemPrompt.length;
    const estimatedTokens = Math.ceil(totalContextChars / 4); // Rough estimate: 1 token ≈ 4 chars
    console.log(`Using model: ${model} for query complexity: ${isComplex ? 'high' : 'normal'}`);
    console.log(`Total context size: ~${estimatedTokens} tokens (${totalContextChars} chars)`);

    // Build request body with conditional tools
    const requestBody: any = {
      model,
      max_tokens: 16384,
      system: systemPrompt,
      messages: messages.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
      stream: true,
    };

    // Add tools if Notion is enabled (Note: streaming must be disabled when using tools)
    if (notionTools.length > 0) {
      requestBody.tools = notionTools;
      requestBody.stream = false; // Anthropic doesn't support streaming with tool use
      console.log(`Added ${notionTools.length} Notion tools to request (streaming disabled)`);
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    // Handle tool use (non-streaming) vs regular streaming
    if (notionTools.length > 0) {
      // Tool use mode - non-streaming response
      const responseData = await response.json();
      console.log('Received tool use response from Anthropic');

      let currentMessages = [...messages.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }))];

      let finalResponse = '';
      let maxIterations = 5; // Prevent infinite loops
      let iteration = 0;

      while (iteration < maxIterations) {
        iteration++;
        
        // Check if response contains tool use
        const hasToolUse = responseData.content?.some((block: any) => block.type === 'tool_use');
        
        if (!hasToolUse) {
          // No more tool use - extract final text response
          finalResponse = responseData.content
            ?.filter((block: any) => block.type === 'text')
            .map((block: any) => block.text)
            .join('') || '';
          break;
        }

        // Execute tools
        console.log(`Tool use iteration ${iteration}`);
        const toolResults: any[] = [];

        for (const block of responseData.content) {
          if (block.type === 'tool_use') {
            console.log(`Executing tool: ${block.name}`);
            const toolResult = await executeNotionTool(block.name, block.input);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: toolResult,
            });
          }
        }

        // Add assistant message with tool use + tool results to conversation
        currentMessages.push({
          role: 'assistant',
          content: responseData.content,
        });

        currentMessages.push({
          role: 'user',
          content: toolResults,
        });

        // Make another API call with tool results
        const followUpResponse = await fetch('https://api.anthropic.com/v1/messages', {
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
            messages: currentMessages,
            tools: notionTools,
            stream: false,
          }),
        });

        if (!followUpResponse.ok) {
          const errorText = await followUpResponse.text();
          console.error('Anthropic follow-up API error:', errorText);
          break;
        }

        const followUpData = await followUpResponse.json();
        Object.assign(responseData, followUpData); // Update for next iteration
      }

      // Return final response as plain text stream
      return new Response(finalResponse, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain',
        },
      });
    }

    // Regular streaming mode (no tools)
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
