import { useState, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { VoiceMemoItem } from './VoiceMemoItem';
import { VoiceMemo } from '@/types/log';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface VoiceCaptureProps {
  restaurantId: string;
  shiftDate: string;
  shiftType: string;
}

export const VoiceCapture = ({ restaurantId, shiftDate, shiftType }: VoiceCaptureProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [memos, setMemos] = useState<VoiceMemo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const {
    isRecording,
    duration,
    audioBlob,
    startRecording,
    stopRecording,
    clearRecording,
    error,
  } = useAudioRecorder();

  useEffect(() => {
    fetchMemos();
  }, [restaurantId, shiftDate, shiftType]);

  // Poll for transcription updates
  useEffect(() => {
    const hasPending = memos.some(m => m.transcription_status === 'pending' || m.transcription_status === 'processing');
    
    if (hasPending) {
      const interval = setInterval(() => {
        fetchMemos();
      }, 3000); // Poll every 3 seconds
      
      return () => clearInterval(interval);
    }
  }, [memos]);

  useEffect(() => {
    if (audioBlob && !isRecording) {
      handleUpload();
    }
  }, [audioBlob, isRecording]);

  const fetchMemos = async () => {
    const { data, error } = await supabase
      .from('voice_memos')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('shift_date', shiftDate)
      .eq('shift_type', shiftType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching memos:', error);
    } else {
      setMemos(data || []);
    }
  };

  const handleUpload = async () => {
    if (!audioBlob || !user) return;

    setIsUploading(true);
    try {
      const fileName = `${restaurantId}/${Date.now()}.webm`;
      
      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('voice-memos')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      // Create database record
      const { error: dbError } = await supabase
        .from('voice_memos')
        .insert({
          user_id: user.id,
          restaurant_id: restaurantId,
          audio_url: fileName,
          duration_seconds: duration,
          shift_date: shiftDate,
          shift_type: shiftType,
        });

      if (dbError) throw dbError;

      // Get the created memo ID
      const { data: memoData } = await supabase
        .from('voice_memos')
        .select('id')
        .eq('audio_url', fileName)
        .single();

      // Trigger transcription
      if (memoData?.id) {
        supabase.functions.invoke('transcribe-voice-memo', {
          body: { memoId: memoData.id }
        }).catch(err => console.error('Transcription trigger error:', err));
      }

      toast({
        title: 'Voice memo saved',
        description: 'Transcription will be available shortly.',
      });

      clearRecording();
      fetchMemos();
    } catch (err) {
      console.error('Error uploading memo:', err);
      toast({
        title: 'Upload failed',
        description: 'Please try recording again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (error) {
    toast({
      title: 'Microphone error',
      description: error,
      variant: 'destructive',
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Recording Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
        <div className="relative">
          <Button
            size="lg"
            onClick={handleRecordClick}
            disabled={isUploading}
            className={`h-32 w-32 rounded-full transition-all ${
              isRecording
                ? 'bg-shyloh-error hover:bg-shyloh-error/90 animate-pulse'
                : 'bg-shyloh-primary hover:bg-shyloh-primary/90'
            }`}
          >
            {isUploading ? (
              <Loader2 className="h-12 w-12 animate-spin" />
            ) : isRecording ? (
              <Square className="h-12 w-12 fill-current" />
            ) : (
              <Mic className="h-12 w-12" />
            )}
          </Button>

          {/* Waveform animation when recording */}
          {isRecording && (
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 rounded-full bg-shyloh-error/20 animate-ping" />
              <div className="absolute inset-0 rounded-full bg-shyloh-error/20 animate-ping animation-delay-300" />
            </div>
          )}
        </div>

        {/* Duration Timer */}
        {isRecording && (
          <div className="text-4xl font-mono text-shyloh-text">
            {formatTime(duration)}
          </div>
        )}

        {isUploading && (
          <p className="text-sm text-muted-foreground">Saving memo...</p>
        )}

        {!isRecording && !isUploading && (
          <p className="text-sm text-muted-foreground">
            Tap to start recording
          </p>
        )}
      </div>

      {/* Memos List */}
      {memos.length > 0 && (
        <div className="border-t border-border p-6 space-y-4 max-h-96 overflow-y-auto">
          <h3 className="text-lg font-semibold text-shyloh-text">
            Today's Recordings ({memos.length})
          </h3>
          <div className="space-y-3">
            {memos.map((memo) => (
              <VoiceMemoItem key={memo.id} memo={memo} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
