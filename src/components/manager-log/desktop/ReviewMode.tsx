import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VoiceMemo } from '@/types/voice-memo';
import { useTranscriptionBatch } from '@/hooks/useTranscriptionBatch';
import { Play, Pause, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES = [
  'service_quality',
  'food_quality',
  'staff_performance',
  'operations',
  'customer_feedback',
  'inventory',
  'maintenance',
  'other',
];

interface ReviewModeProps {
  selectedMemos: VoiceMemo[];
  onUpdate: () => void;
}

export const ReviewMode = ({ selectedMemos, onUpdate }: ReviewModeProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editedTranscription, setEditedTranscription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const { updateMemoReview, isSaving } = useTranscriptionBatch();

  const currentMemo = selectedMemos[currentIndex];

  // Update local state when memo changes
  useState(() => {
    if (currentMemo) {
      setEditedTranscription(currentMemo.transcription || '');
      setSelectedCategory(currentMemo.category || '');
      setReviewerNotes(currentMemo.reviewer_notes || '');
    }
  });

  const handleSave = async (status: 'reviewed' | 'approved' | 'rejected') => {
    if (!currentMemo) return;

    const success = await updateMemoReview(currentMemo.id, {
      transcription: editedTranscription,
      category: selectedCategory,
      review_status: status,
      reviewer_notes: reviewerNotes,
    });

    if (success) {
      onUpdate();
      // Move to next memo if available
      if (currentIndex < selectedMemos.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  if (selectedMemos.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Select memos from the list to review
      </div>
    );
  }

  if (!currentMemo) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Navigation */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Memo {currentIndex + 1} of {selectedMemos.length}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentIndex(Math.min(selectedMemos.length - 1, currentIndex + 1))}
              disabled={currentIndex === selectedMemos.length - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Audio Player */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full h-12 w-12"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {format(new Date(currentMemo.created_at), 'h:mm a')} • {formatDuration(currentMemo.duration_seconds)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {currentMemo.review_status === 'unreviewed' ? 'Not reviewed' : 'Reviewed'}
                </div>
              </div>
            </div>
          </Card>

          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transcription Editor */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Transcription</label>
            <Textarea
              value={editedTranscription}
              onChange={(e) => setEditedTranscription(e.target.value)}
              rows={8}
              placeholder="Transcription will appear here..."
            />
          </div>

          {/* Reviewer Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Textarea
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              rows={3}
              placeholder="Add notes about this memo..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => handleSave('approved')}
              disabled={isSaving}
              className="flex-1"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              onClick={() => handleSave('reviewed')}
              disabled={isSaving}
              variant="outline"
              className="flex-1"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Reviewed
            </Button>
            <Button
              onClick={() => handleSave('rejected')}
              disabled={isSaving}
              variant="destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
