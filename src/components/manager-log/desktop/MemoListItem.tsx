import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { VoiceMemo } from '@/types/voice-memo';
import { Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface MemoListItemProps {
  memo: VoiceMemo;
  isSelected: boolean;
  onToggleSelect: () => void;
}

export const MemoListItem = ({ memo, isSelected, onToggleSelect }: MemoListItemProps) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    if (memo.transcription_status === 'completed') {
      return <Badge variant="outline" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Transcribed</Badge>;
    }
    if (memo.transcription_status === 'processing' || memo.transcription_status === 'pending') {
      return <Badge variant="outline" className="text-xs"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
    }
    if (memo.transcription_status === 'failed') {
      return <Badge variant="destructive" className="text-xs"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
    }
    return null;
  };

  const getReviewBadge = () => {
    if (memo.review_status === 'reviewed' || memo.review_status === 'approved') {
      return <Badge variant="secondary" className="text-xs">Reviewed</Badge>;
    }
    return null;
  };

  return (
    <Card 
      className={`p-3 cursor-pointer hover:bg-accent/50 transition-colors ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onToggleSelect}
    >
      <div className="flex gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
        />
        
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{format(new Date(memo.created_at), 'h:mm a')}</span>
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{formatDuration(memo.duration_seconds)}</span>
            {getStatusBadge()}
            {getReviewBadge()}
            {memo.category && (
              <Badge variant="outline" className="text-xs">{memo.category}</Badge>
            )}
          </div>
          
          {memo.transcription && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {memo.transcription}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
