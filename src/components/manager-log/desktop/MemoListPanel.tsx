import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MemoListItem } from './MemoListItem';
import { BatchActions } from './BatchActions';
import { VoiceMemo, MemoFilter, MemoSort } from '@/types/voice-memo';
import { Filter, ArrowUpDown, Mic, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { VoiceCapture } from '../VoiceCapture';

interface MemoListPanelProps {
  memos: VoiceMemo[];
  selection: ReturnType<typeof import('@/hooks/useMemoSelection').useMemoSelection>;
  onUpdate: () => void;
  restaurantId: string;
  shiftDate: string;
  shiftType: string;
}

export const MemoListPanel = ({ memos, selection, onUpdate, restaurantId, shiftDate, shiftType }: MemoListPanelProps) => {
  const [filter, setFilter] = useState<MemoFilter>('all');
  const [sort, setSort] = useState<MemoSort>('newest');
  const [isRecordingOpen, setIsRecordingOpen] = useState(false);

  const filteredMemos = memos.filter(memo => {
    switch (filter) {
      case 'unreviewed':
        return memo.review_status === 'unreviewed';
      case 'reviewed':
        return memo.review_status === 'reviewed' || memo.review_status === 'approved';
      case 'transcribed':
        return memo.transcription_status === 'completed';
      case 'pending':
        return memo.transcription_status === 'pending' || memo.transcription_status === 'processing';
      default:
        return true;
    }
  });

  const sortedMemos = [...filteredMemos].sort((a, b) => {
    switch (sort) {
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'duration':
        return b.duration_seconds - a.duration_seconds;
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Voice Memos ({sortedMemos.length})</h2>
          <Collapsible open={isRecordingOpen} onOpenChange={setIsRecordingOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Mic className="h-4 w-4" />
                Record
                {isRecordingOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
        
        <Collapsible open={isRecordingOpen} onOpenChange={setIsRecordingOpen}>
          <CollapsibleContent>
            <div className="border border-border rounded-lg overflow-hidden max-h-64">
              <VoiceCapture
                restaurantId={restaurantId}
                shiftDate={shiftDate}
                shiftType={shiftType}
                isMobile={false}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Filters */}
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as MemoFilter)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Memos</SelectItem>
              <SelectItem value="unreviewed">Unreviewed</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="transcribed">Transcribed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setSort(v as MemoSort)}>
            <SelectTrigger className="w-[130px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="duration">By Duration</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Batch Actions */}
        {selection.selectedCount > 0 && (
          <BatchActions
            selectedCount={selection.selectedCount}
            selectedMemoIds={selection.selectedMemoIds}
            onClearSelection={selection.clearSelection}
            onUpdate={onUpdate}
          />
        )}
      </div>

      {/* Memo List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {sortedMemos.map((memo) => (
            <MemoListItem
              key={memo.id}
              memo={memo}
              isSelected={selection.isSelected(memo.id)}
              onToggleSelect={() => selection.toggleMemo(memo.id)}
            />
          ))}
          {sortedMemos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No memos found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
