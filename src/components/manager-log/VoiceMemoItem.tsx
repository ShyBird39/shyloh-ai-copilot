import { useState, useEffect } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VoiceMemo } from '@/types/log';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VoiceMemoItemProps {
  memo: VoiceMemo;
}

export const VoiceMemoItem = ({ memo }: VoiceMemoItemProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audio] = useState(() => new Audio());

  useEffect(() => {
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setIsPlaying(false);
      toast.error('Failed to play audio');
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, [audio]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      try {
        // Get signed URL from Supabase storage
        const { data, error } = await supabase.storage
          .from('voice-memos')
          .createSignedUrl(memo.audio_url, 3600); // 1 hour expiry

        if (error) throw error;
        if (!data?.signedUrl) throw new Error('No signed URL returned');

        audio.src = data.signedUrl;
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing audio:', error);
        toast.error('Failed to load audio');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-shyloh-primary/20 text-shyloh-primary';
      case 'processing':
        return 'bg-shyloh-accent/20 text-shyloh-accent';
      case 'failed':
        return 'bg-shyloh-error/20 text-shyloh-error';
      default:
        return 'bg-shyloh-text/20 text-shyloh-text';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground">
              {format(new Date(memo.created_at), 'h:mm a')}
            </span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">
              {formatDuration(memo.duration_seconds)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={getStatusColor(memo.transcription_status)}>
              {memo.transcription_status}
            </Badge>
            {memo.category && (
              <Badge variant="outline">{memo.category}</Badge>
            )}
          </div>
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={handlePlayPause}
          disabled={isLoading}
          className="shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>
      </div>

      {memo.transcription && (
        <p className="text-sm text-foreground/80 italic">
          "{memo.transcription}"
        </p>
      )}
    </div>
  );
};
