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
    const { restaurantId, shiftDate, shiftType } = await req.json();

    if (!restaurantId || !shiftDate || !shiftType) {
      return new Response(
        JSON.stringify({ error: 'restaurantId, shiftDate, and shiftType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!ANTHROPIC_API_KEY || !OPENAI_API_KEY) {
      throw new Error('API keys not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating shift summary for ${restaurantId} on ${shiftDate} (${shiftType})`);

    // 1. Fetch all shift log entries for this shift
    const { data: shiftLogs, error: logsError } = await supabase
      .from('shift_logs')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('shift_date', shiftDate)
      .eq('shift_type', shiftType)
      .order('created_at', { ascending: true });

    if (logsError) {
      console.error('Error fetching shift logs:', logsError);
      throw logsError;
    }

    // 2. Fetch all voice memos for this shift
    const { data: voiceMemos, error: memosError } = await supabase
      .from('voice_memos')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('shift_date', shiftDate)
      .eq('shift_type', shiftType)
      .order('created_at', { ascending: true });

    if (memosError) {
      console.error('Error fetching voice memos:', memosError);
      throw memosError;
    }

    // Check if we have any data at all
    const hasShiftLogs = shiftLogs && shiftLogs.length > 0;
    const hasVoiceMemos = voiceMemos && voiceMemos.length > 0;

    if (!hasShiftLogs && !hasVoiceMemos) {
      return new Response(
        JSON.stringify({ error: 'No shift logs or voice memos found for this shift' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${shiftLogs?.length || 0} shift log entries and ${voiceMemos?.length || 0} voice memos`);

    // 3. Fetch Toast POS data for this date
    let toastMetrics: {
      netSales?: number;
      guestCount?: number;
      laborPercent?: number;
      avgCheckSize?: number;
    } = {};
    try {
      const dateInt = parseInt(shiftDate.replace(/-/g, ''));
      const toastResponse = await fetch(`${supabaseUrl}/functions/v1/toast-reporting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request-and-poll',
          reportType: 'metrics',
          timeRange: 'day',
          startDate: dateInt,
          endDate: dateInt,
        }),
      });

      if (toastResponse.ok) {
        const toastData = await toastResponse.json();
        toastMetrics = {
          netSales: toastData.data?.netSales || 0,
          guestCount: toastData.data?.guestCount || 0,
          laborPercent: toastData.data?.laborPercent || 0,
          avgCheckSize: toastData.data?.avgCheckSize || 0,
        };
        console.log('Toast metrics fetched:', toastMetrics);
      }
    } catch (error) {
      console.error('Error fetching Toast data:', error);
    }

    // 4. Build context for Claude from both text logs and voice memos
    const textLogsFormatted = (shiftLogs || []).map(log => 
      `[${log.log_category.toUpperCase()}] ${log.urgency_level === 'urgent' ? '🔴 URGENT' : ''}\n${log.content}\n`
    );

    const voiceMemosFormatted = (voiceMemos || [])
      .filter(memo => memo.transcription && memo.transcription_status === 'completed')
      .map(memo => 
        `[VOICE MEMO${memo.category ? ` - ${memo.category.toUpperCase()}` : ''}]\n${memo.transcription}\n`
      );

    const allEntries = [...textLogsFormatted, ...voiceMemosFormatted];
    const logsText = allEntries.join('\n---\n\n');

    const prompt = `You are analyzing a ${shiftType} shift at a restaurant on ${shiftDate}.

SHIFT LOG ENTRIES:
${logsText}

TOAST POS METRICS:
- Net Sales: $${toastMetrics.netSales?.toFixed(2) || 'N/A'}
- Guest Count: ${toastMetrics.guestCount || 'N/A'} covers
- Labor %: ${toastMetrics.laborPercent?.toFixed(1) || 'N/A'}%
- Avg Check: $${toastMetrics.avgCheckSize?.toFixed(2) || 'N/A'}

Generate a comprehensive shift summary in markdown format. Include:

1. **Shift Overview** - Brief summary of how the shift went
2. **Key Metrics** - Sales, covers, labor% with brief analysis
3. **Notable Events** - Major incidents, equipment issues, staffing matters
4. **Guest Experience** - Feedback, complaints, shout-outs
5. **Operations** - 86'd items, maintenance needs, inventory notes
6. **Action Items** - Specific tasks that need follow-up (format as bullet points)

Write in a concise, professional manager voice. Focus on actionable insights.`;

    // 5. Call Claude to generate summary
    console.log('Calling Claude for summary generation...');
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeResponse.ok) {
      const error = await claudeResponse.text();
      console.error('Claude API error:', error);
      throw new Error('Failed to generate summary');
    }

    const claudeData = await claudeResponse.json();
    const summaryMarkdown = claudeData.content[0].text;
    console.log('Summary generated');

    // 6. Extract action items from summary
    const actionItemMatches = summaryMarkdown.match(/(?:^|\n)[-*]\s+(.+)/gm) || [];
    const actionItems = actionItemMatches
      .filter((item: string) => item.toLowerCase().includes('action items') === false)
      .map((item: string) => ({
        task: item.replace(/^[-*]\s+/, '').trim(),
        completed: false,
        urgency: item.toLowerCase().includes('urgent') ? 'high' : 'normal',
      }))
      .slice(0, 10);

    console.log(`Extracted ${actionItems.length} action items`);

    // 7. Store summary in database
    const { data: summary, error: summaryError } = await supabase
      .from('shift_summaries')
      .upsert({
        restaurant_id: restaurantId,
        shift_date: shiftDate,
        shift_type: shiftType,
        summary_markdown: summaryMarkdown,
        action_items: actionItems,
        toast_metrics: toastMetrics,
        generated_by: user.id,
      }, {
        onConflict: 'restaurant_id,shift_date,shift_type',
      })
      .select()
      .single();

    if (summaryError) {
      console.error('Error storing summary:', summaryError);
      throw summaryError;
    }

    console.log('Summary stored with ID:', summary.id);

    // 8. Generate embeddings for semantic search
    // Chunk the summary into 500-word chunks with 50-word overlap
    const words = summaryMarkdown.split(/\s+/);
    const chunkSize = 500;
    const overlap = 50;
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim().length > 0) {
        chunks.push(chunk);
      }
    }

    console.log(`Generated ${chunks.length} text chunks for embedding`);

    // Also include individual urgent log entries and voice memos as separate chunks
    const urgentLogs = (shiftLogs || [])
      .filter(log => log.urgency_level === 'urgent')
      .map(log => `[URGENT - ${log.log_category}] ${log.content}`);
    
    const completedMemoTranscriptions = (voiceMemos || [])
      .filter(memo => memo.transcription && memo.transcription_status === 'completed')
      .map(memo => `[VOICE MEMO${memo.category ? ` - ${memo.category}` : ''}] ${memo.transcription}`);
    
    chunks.push(...urgentLogs, ...completedMemoTranscriptions);

    // Generate OpenAI embeddings for each chunk
    const embeddingsToInsert: any[] = [];

    for (const chunk of chunks) {
      try {
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: chunk,
          }),
        });

        if (!embeddingResponse.ok) {
          console.error('OpenAI embedding error for chunk:', chunk.substring(0, 50));
          continue;
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        embeddingsToInsert.push({
          shift_summary_id: summary.id,
          chunk_text: chunk,
          embedding,
        });
      } catch (error) {
        console.error('Error generating embedding:', error);
      }
    }

    // 9. Store embeddings in database
    if (embeddingsToInsert.length > 0) {
      const { error: embeddingsError } = await supabase
        .from('shift_log_embeddings')
        .insert(embeddingsToInsert);

      if (embeddingsError) {
        console.error('Error storing embeddings:', embeddingsError);
      } else {
        console.log(`Stored ${embeddingsToInsert.length} embeddings`);
      }
    }

    // 10. Also generate embeddings for individual log entries
    for (const log of (shiftLogs || [])) {
      try {
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: `[${log.log_category}] ${log.content}`,
          }),
        });

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          const embedding = embeddingData.data[0].embedding;

          await supabase
            .from('shift_log_embeddings')
            .insert({
              shift_log_id: log.id,
              chunk_text: log.content,
              embedding,
            });
        }
      } catch (error) {
        console.error('Error generating embedding for log:', error);
      }
    }

    console.log('Shift summary generation complete');

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        embeddings_count: embeddingsToInsert.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating shift summary:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
