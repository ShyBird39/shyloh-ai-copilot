import { useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VoiceMemo } from '@/types/log';
import { format } from 'date-fns';

interface VoiceMemoItemProps {
  memo: VoiceMemo;
}

export const VoiceMemoItem = ({ memo }: VoiceMemoItemProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(() => new Audio());

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
      // In a real implementation, you'd get the signed URL from Supabase
      // audio.src = await getSignedUrl(memo.audio_url);
      audio.play();
      setIsPlaying(true);
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
          className="shrink-0"
        >
          {isPlaying ? (
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
