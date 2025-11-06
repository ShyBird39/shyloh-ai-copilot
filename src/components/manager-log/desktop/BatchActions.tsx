import { Button } from '@/components/ui/button';
import { useTranscriptionBatch } from '@/hooks/useTranscriptionBatch';
import { CheckCircle2, X, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
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

interface BatchActionsProps {
  selectedCount: number;
  selectedMemoIds: string[];
  onClearSelection: () => void;
  onUpdate: () => void;
}

export const BatchActions = ({
  selectedCount,
  selectedMemoIds,
  onClearSelection,
  onUpdate,
}: BatchActionsProps) => {
  const { batchUpdateStatus, isSaving } = useTranscriptionBatch();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBatchAction = async (status: 'reviewed' | 'approved' | 'rejected') => {
    const success = await batchUpdateStatus(selectedMemoIds, status);
    if (success) {
      onClearSelection();
      onUpdate();
    }
  };

  const handleBatchDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('voice_memos')
        .delete()
        .in('id', selectedMemoIds);

      if (error) throw error;

      toast.success(`${selectedCount} voice memo${selectedCount > 1 ? 's' : ''} deleted`);
      onClearSelection();
      onUpdate();
    } catch (error) {
      console.error('Error deleting memos:', error);
      toast.error('Failed to delete voice memos');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-accent rounded-lg">
      <span className="text-sm font-medium">{selectedCount} selected</span>
      
      <div className="flex gap-1 ml-auto">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleBatchAction('reviewed')}
          disabled={isSaving || isDeleting}
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Mark Reviewed
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={isDeleting || isSaving}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedCount} voice memo{selectedCount > 1 ? 's' : ''}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the selected voice memos and their transcriptions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleBatchDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
