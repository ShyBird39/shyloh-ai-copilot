import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { MemoListPanel } from './MemoListPanel';
import { SynthesisPanel } from './SynthesisPanel';
import { VoiceMemo } from '@/types/voice-memo';
import { useMemoSelection } from '@/hooks/useMemoSelection';

interface DesktopLayoutProps {
  restaurantId: string;
  shiftDate: string;
  shiftType: string;
  memos: VoiceMemo[];
  onMemosUpdate: () => void;
}

export const DesktopLayout = ({
  restaurantId,
  shiftDate,
  shiftType,
  memos,
  onMemosUpdate,
}: DesktopLayoutProps) => {
  const memoSelection = useMemoSelection();

  return (
    <div className="h-full w-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={40} minSize={30}>
          <MemoListPanel
            memos={memos}
            selection={memoSelection}
            onUpdate={onMemosUpdate}
          />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={60} minSize={40}>
          <SynthesisPanel
            restaurantId={restaurantId}
            shiftDate={shiftDate}
            shiftType={shiftType}
            memos={memos}
            selection={memoSelection}
            onUpdate={onMemosUpdate}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
