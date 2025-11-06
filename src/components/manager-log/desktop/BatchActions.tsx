import { Button } from '@/components/ui/button';
import { useTranscriptionBatch } from '@/hooks/useTranscriptionBatch';
import { CheckCircle2, X, Trash2 } from 'lucide-react';

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

  const handleBatchAction = async (status: 'reviewed' | 'approved' | 'rejected') => {
    const success = await batchUpdateStatus(selectedMemoIds, status);
    if (success) {
      onClearSelection();
      onUpdate();
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
          disabled={isSaving}
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Mark Reviewed
        </Button>
        
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
