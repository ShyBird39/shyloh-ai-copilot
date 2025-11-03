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
    const { query, restaurantId, limit = 10 } = await req.json();

    if (!query || !restaurantId) {
      return new Response(
        JSON.stringify({ error: 'query and restaurantId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Searching shift logs for: "${query}" in restaurant ${restaurantId}`);

    // 1. Generate embedding for the search query
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      const error = await embeddingResponse.text();
      console.error('OpenAI embedding error:', error);
      throw new Error('Failed to generate query embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    console.log('Query embedding generated');

    // 2. Perform vector similarity search
    // Using pgvector's cosine distance operator (<=>)
    const { data: searchResults, error: searchError } = await supabase.rpc('search_shift_logs', {
      query_embedding: JSON.stringify(queryEmbedding),
      restaurant_id_param: restaurantId,
      match_threshold: 0.3, // Minimum similarity threshold (0-1, higher = more similar)
      match_count: limit,
    });

    if (searchError) {
      // If RPC doesn't exist, create it inline using a raw query
      console.log('RPC not found, using direct query');
      
      const embeddingStr = `[${queryEmbedding.join(',')}]`;
      
      // Query embeddings table with vector similarity
      const { data: embeddings, error: embError } = await supabase
        .from('shift_log_embeddings')
        .select(`
          id,
          chunk_text,
          shift_log_id,
          shift_summary_id,
          embedding
        `)
        .order('embedding', { 
          ascending: true,
          nullsFirst: false 
        })
        .limit(limit);

      if (embError) {
        console.error('Error searching embeddings:', embError);
        throw embError;
      }

      // Calculate cosine similarity manually
      const results = embeddings?.map(emb => {
        const similarity = cosineSimilarity(queryEmbedding, emb.embedding);
        return { ...emb, similarity };
      })
      .filter(r => r.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

      // Fetch associated log entries
      const logIds = results?.map(r => r.shift_log_id).filter(Boolean) || [];
      const summaryIds = results?.map(r => r.shift_summary_id).filter(Boolean) || [];

      let logs = [];
      let summaries = [];

      if (logIds.length > 0) {
        const { data: logsData } = await supabase
          .from('shift_logs')
          .select(`
            *,
            profiles:user_id (
              display_name
            )
          `)
          .in('id', logIds);
        logs = logsData || [];
      }

      if (summaryIds.length > 0) {
        const { data: summariesData } = await supabase
          .from('shift_summaries')
          .select('*')
          .in('id', summaryIds);
        summaries = summariesData || [];
      }

      // Combine results
      const formattedResults = results?.map(result => {
        const log = logs.find(l => l.id === result.shift_log_id);
        const summary = summaries.find(s => s.id === result.shift_summary_id);

        return {
          type: log ? 'log' : 'summary',
          similarity: result.similarity,
          chunk_text: result.chunk_text,
          data: log || summary,
        };
      }) || [];

      return new Response(
        JSON.stringify({
          results: formattedResults,
          query,
          count: formattedResults.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${searchResults?.length || 0} results`);

    return new Response(
      JSON.stringify({
        results: searchResults || [],
        query,
        count: searchResults?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error searching shift logs:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (normA * normB);
}
