import { useState } from "react";
import { ChevronUp, ChevronDown, AlertCircle } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

interface TextLog {
  id: string;
  created_at: string;
  log_category: string;
  urgency_level: string;
  content: string;
  tags: string[];
  user_display_name?: string;
}

interface TextLogDrawerProps {
  logs: TextLog[];
  onUpdate?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  incident: 'Incident',
  maintenance: 'Maintenance',
  staff_notes: 'Staff Notes',
  guest_feedback: 'Guest Feedback',
  eighty_sixed: "86'd Items",
  shout_outs: 'Shout-Outs',
};

export const TextLogDrawer = ({ logs, onUpdate }: TextLogDrawerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  return (
    <div
      className={cn(
        "fixed left-0 right-0 bg-background border-t border-border transition-all duration-300 ease-out z-40",
        isOpen ? "bottom-0 h-[60vh]" : "bottom-0 h-14"
      )}
    >
      {/* Drawer Handle */}
      <button
        onClick={toggleDrawer}
        className="w-full flex items-center justify-between px-4 py-3 mobile-tap-target"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            Today's Log Entries
          </h3>
          <Badge variant="secondary" className="text-xs">
            {logs.length}
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
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No log entries yet today
            </p>
          ) : (
            logs.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        {CATEGORY_LABELS[log.log_category] || log.log_category}
                      </Badge>
                      {log.urgency_level === 'urgent' && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Urgent
                        </Badge>
                      )}
                      {log.user_display_name && (
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                            {getInitials(log.user_display_name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'h:mm a')}
                    </span>
                  </div>

                  <p className="text-sm text-card-foreground">
                    {log.content}
                  </p>

                  {log.tags && log.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {log.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};