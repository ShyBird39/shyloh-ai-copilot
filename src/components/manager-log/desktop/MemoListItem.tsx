import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VoiceMemo } from '@/types/voice-memo';
import { Clock, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

interface MemoListItemProps {
  memo: VoiceMemo;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete?: () => void;
}

export const MemoListItem = ({ memo, isSelected, onToggleSelect, onDelete }: MemoListItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('voice_memos')
        .delete()
        .eq('id', memo.id);

      if (error) throw error;

      toast.success('Voice memo deleted');
      onDelete?.();
    } catch (error) {
      console.error('Error deleting memo:', error);
      toast.error('Failed to delete voice memo');
    } finally {
      setIsDeleting(false);
    }
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

        <AlertDialog>
          <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete voice memo?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the voice memo and its transcription.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
};
