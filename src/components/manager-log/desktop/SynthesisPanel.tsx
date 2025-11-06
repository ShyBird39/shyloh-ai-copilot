import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReviewMode } from './ReviewMode';
import { VoiceMemo } from '@/types/voice-memo';
import { FileText, Pencil } from 'lucide-react';

interface SynthesisPanelProps {
  restaurantId: string;
  shiftDate: string;
  shiftType: string;
  memos: VoiceMemo[];
  selection: ReturnType<typeof import('@/hooks/useMemoSelection').useMemoSelection>;
  onUpdate: () => void;
}

export const SynthesisPanel = ({
  restaurantId,
  shiftDate,
  shiftType,
  memos,
  selection,
  onUpdate,
}: SynthesisPanelProps) => {
  const [activeTab, setActiveTab] = useState('review');
  const selectedMemos = memos.filter(m => selection.isSelected(m.id));

  return (
    <div className="h-full flex flex-col bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="border-b border-border px-4 pt-4">
          <TabsList className="w-full">
            <TabsTrigger value="review" className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Review Mode
            </TabsTrigger>
            <TabsTrigger value="draft" className="flex-1" disabled>
              <Pencil className="h-4 w-4 mr-2" />
              Draft Builder
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="review" className="flex-1 m-0">
          <ReviewMode
            selectedMemos={selectedMemos}
            onUpdate={onUpdate}
          />
        </TabsContent>

        <TabsContent value="draft" className="flex-1 m-0">
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Draft builder coming soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
