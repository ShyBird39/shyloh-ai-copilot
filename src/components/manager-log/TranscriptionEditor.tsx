import { useState, useEffect } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VoiceMemo } from '@/types/log';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TranscriptionEditorProps {
  memo: VoiceMemo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

const CATEGORIES = [
  'Operations',
  'Staff',
  'Guest Experience',
  'Inventory',
  'Maintenance',
  'Sales',
  'Other'
];

export const TranscriptionEditor = ({ memo, open, onOpenChange, onSave }: TranscriptionEditorProps) => {
  const [transcription, setTranscription] = useState(memo.transcription || '');
  const [category, setCategory] = useState(memo.category || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [audio] = useState(() => {
    const audioElement = new Audio();
    audioElement.preload = 'metadata';
    audioElement.setAttribute('playsinline', 'true');
    audioElement.setAttribute('webkit-playsinline', 'true');
    return audioElement;
  });

  useEffect(() => {
    setTranscription(memo.transcription || '');
    setCategory(memo.category || '');
    setHasChanges(false);
  }, [memo, open]);

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
      audio.src = '';
    };
  }, [audio]);

  const handlePlayPause = async () => {
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.storage
          .from('voice-memos')
          .createSignedUrl(memo.audio_url, 3600);

        if (error) throw error;
        if (!data?.signedUrl) throw new Error('No signed URL returned');

        audio.pause();
        audio.currentTime = 0;
        audio.src = data.signedUrl;
        
        await audio.play();
        setIsPlaying(true);
      } catch (error: any) {
        console.error('Error playing audio:', error);
        toast.error('Failed to play audio');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('voice_memos')
        .update({
          transcription,
          category: category || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memo.id);

      if (error) throw error;

      toast.success('Transcription updated');
      setHasChanges(false);
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving transcription:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Edit Transcription</SheetTitle>
          <SheetDescription>
            {format(new Date(memo.created_at), 'MMMM d, yyyy • h:mm a')} • {formatDuration(memo.duration_seconds)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Audio Player */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Button
              size="icon"
              variant="ghost"
              onClick={handlePlayPause}
              disabled={isLoading}
              className="shrink-0 h-12 w-12 rounded-full bg-primary/10 hover:bg-primary/20 text-primary"
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-0.5" />
              )}
            </Button>
            <div className="flex-1">
              <p className="text-sm font-medium">Voice Memo</p>
              <p className="text-xs text-muted-foreground">Tap to {isPlaying ? 'pause' : 'play'}</p>
            </div>
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value);
                setHasChanges(true);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transcription Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Transcription</label>
              <span className="text-xs text-muted-foreground">
                {transcription.length} characters • {transcription.split(/\s+/).filter(w => w).length} words
              </span>
            </div>
            <Textarea
              value={transcription}
              onChange={(e) => {
                setTranscription(e.target.value);
                setHasChanges(true);
              }}
              placeholder="Edit transcription..."
              className="min-h-[300px] resize-y"
              autoFocus
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
