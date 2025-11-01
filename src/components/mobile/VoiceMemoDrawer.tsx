import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { VoiceMemoItem } from "@/components/manager-log/VoiceMemoItem";
import { VoiceMemo } from "@/types/log";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface VoiceMemoDrawerProps {
  memos: VoiceMemo[];
}

export const VoiceMemoDrawer = ({ memos }: VoiceMemoDrawerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  return (
    <div
      className={cn(
        "fixed left-0 right-0 bg-background border-t border-border transition-all duration-300 ease-out z-40",
        isOpen ? "bottom-16 h-[60vh]" : "bottom-16 h-14"
      )}
    >
      {/* Drawer Handle */}
      <button
        onClick={toggleDrawer}
        className="w-full flex items-center justify-between px-4 py-3 mobile-tap-target"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            Today's Recordings
          </h3>
          <Badge variant="secondary" className="text-xs">
            {memos.length}
          </Badge>
        </div>
        {isOpen ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Drawer Content */}
      {isOpen && (
        <div className="overflow-y-auto h-[calc(100%-3.5rem)] px-4 pb-4 space-y-3">
          {memos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recordings yet today
            </p>
          ) : (
            memos.map((memo) => (
              <VoiceMemoItem key={memo.id} memo={memo} />
            ))
          )}
        </div>
      )}
    </div>
  );
};
