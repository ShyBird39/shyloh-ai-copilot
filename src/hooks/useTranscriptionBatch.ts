import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTranscriptionBatch = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const updateMemoReview = async (
    memoId: string,
    updates: {
      review_status?: 'unreviewed' | 'reviewed' | 'approved' | 'rejected';
      reviewer_notes?: string;
      transcription?: string;
      category?: string;
    }
  ) => {
    setIsSaving(true);
    try {
      const updateData: any = { ...updates, updated_at: new Date().toISOString() };
      
      if (updates.review_status) {
        updateData.reviewed_at = new Date().toISOString();
        updateData.reviewed_by = (await supabase.auth.getUser()).data.user?.id;
      }

      const { error } = await supabase
        .from('voice_memos')
        .update(updateData)
        .eq('id', memoId);

      if (error) throw error;

      toast({
        title: 'Updated successfully',
        description: 'Voice memo has been updated.',
      });

      return true;
    } catch (error) {
      console.error('Error updating memo:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update voice memo.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const batchUpdateStatus = async (
    memoIds: string[],
    status: 'reviewed' | 'approved' | 'rejected'
  ) => {
    setIsSaving(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      const { error } = await supabase
        .from('voice_memos')
        .update({
          review_status: status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: userId,
        })
        .in('id', memoIds);

      if (error) throw error;

      toast({
        title: 'Batch update complete',
        description: `${memoIds.length} memos marked as ${status}.`,
      });

      return true;
    } catch (error) {
      console.error('Error batch updating:', error);
      toast({
        title: 'Batch update failed',
        description: 'Failed to update selected memos.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    updateMemoReview,
    batchUpdateStatus,
  };
};
