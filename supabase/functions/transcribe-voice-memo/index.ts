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
    const { memoId } = await req.json();
    
    if (!memoId) {
      throw new Error('No memo ID provided');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get memo details
    const { data: memo, error: memoError } = await supabase
      .from('voice_memos')
      .select('*')
      .eq('id', memoId)
      .single();

    if (memoError || !memo) {
      throw new Error('Voice memo not found');
    }

    // Update status to processing
    await supabase
      .from('voice_memos')
      .update({ transcription_status: 'processing' })
      .eq('id', memoId);

    // Download audio from storage
    const { data: audioData, error: downloadError } = await supabase.storage
      .from('voice-memos')
      .download(memo.audio_url);

    if (downloadError || !audioData) {
      throw new Error('Failed to download audio file');
    }

    // Prepare form data for OpenAI Whisper
    const formData = new FormData();
    formData.append('file', audioData, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    // Send to OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const transcription = result.text;

    // Auto-categorize based on transcription content
    let category = null;
    const lowerText = transcription.toLowerCase();
    
    if (lowerText.includes('86') || lowerText.includes('out of') || lowerText.includes('ran out')) {
      category = 'eighty_sixed';
    } else if (lowerText.includes('complaint') || lowerText.includes('issue') || lowerText.includes('problem')) {
      category = 'incident';
    } else if (lowerText.includes('broken') || lowerText.includes('not working') || lowerText.includes('repair')) {
      category = 'maintenance';
    } else if (lowerText.includes('great job') || lowerText.includes('awesome') || lowerText.includes('killed it')) {
      category = 'shout_outs';
    } else if (lowerText.includes('loved') || lowerText.includes('compliment') || lowerText.includes('happy')) {
      category = 'guest_feedback';
    }

    // Update memo with transcription and category
    const { error: updateError } = await supabase
      .from('voice_memos')
      .update({
        transcription,
        transcription_status: 'completed',
        category,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memoId);

    if (updateError) {
      throw updateError;
    }

    console.log(`Transcription completed for memo ${memoId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        transcription,
        category,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Transcription error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
