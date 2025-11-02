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
  const [audio] = useState(() => {
    const audioElement = new Audio();
    // Configure for mobile compatibility
    audioElement.preload = 'metadata';
    audioElement.setAttribute('playsinline', 'true');
    audioElement.setAttribute('webkit-playsinline', 'true');
    return audioElement;
  });

  useEffect(() => {
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: ErrorEvent) => {
      console.error('Audio error event:', e, audio.error);
      setIsPlaying(false);
      const errorMsg = audio.error?.message || 'Unknown error';
      toast.error(`Failed to play audio: ${errorMsg}`);
    };
    const handleLoadError = () => {
      console.error('Failed to load audio');
      toast.error('Failed to load audio: The operation is not supported.');
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError as any);
    audio.addEventListener('abort', handleLoadError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError as any);
      audio.removeEventListener('abort', handleLoadError);
      audio.pause();
      audio.src = '';
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
        console.log('Attempting to play audio:', memo.audio_url);
        
        // Get signed URL from Supabase storage
        const { data, error } = await supabase.storage
          .from('voice-memos')
          .createSignedUrl(memo.audio_url, 3600); // 1 hour expiry

        console.log('Signed URL response:', { data, error });

        if (error) {
          console.error('Signed URL error:', error);
          throw error;
        }
        if (!data?.signedUrl) throw new Error('No signed URL returned');

        console.log('Setting audio source:', data.signedUrl);
        
        // Reset audio element before setting new source
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
        
        // Load the new source
        audio.src = data.signedUrl;
        
        // Wait for audio to be ready
        await new Promise((resolve, reject) => {
          const loadTimeout = setTimeout(() => {
            reject(new Error('Audio load timeout'));
          }, 10000); // 10 second timeout
          
          const handleCanPlay = () => {
            clearTimeout(loadTimeout);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleLoadError);
            console.log('Audio can play');
            resolve(true);
          };
          
          const handleLoadError = (e: any) => {
            clearTimeout(loadTimeout);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleLoadError);
            console.error('Audio load error:', e, audio.error);
            reject(new Error(audio.error?.message || 'Failed to load audio'));
          };
          
          audio.addEventListener('canplay', handleCanPlay, { once: true });
          audio.addEventListener('error', handleLoadError, { once: true });
          
          audio.load();
        });
        
        // Attempt to play with better promise handling
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
        }
        
        setIsPlaying(true);
        console.log('Audio playback started');
      } catch (error: any) {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
        toast.error(error?.message || 'Failed to play audio');
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
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
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

          {memo.transcription && (
            <p className="text-sm text-foreground/80 italic mt-3">
              "{memo.transcription}"
            </p>
          )}
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={handlePlayPause}
          disabled={isLoading}
          className="shrink-0 h-12 w-12 rounded-full bg-shyloh-primary/10 hover:bg-shyloh-primary/20 text-shyloh-primary"
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-0.5" />
          )}
        </Button>
      </div>
    </div>
  );
};
