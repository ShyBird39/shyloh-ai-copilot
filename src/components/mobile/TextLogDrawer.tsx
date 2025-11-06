import { useState } from "react";
import { ChevronUp, ChevronDown, AlertCircle, Trash2 } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
} from "@/components/ui/alert-dialog";

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleDelete = async (logId: string) => {
    setDeletingId(logId);
    try {
      const { error } = await supabase
        .from('shift_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;

      toast.success('Log entry deleted');
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting log:', error);
      toast.error('Failed to delete log entry');
    } finally {
      setDeletingId(null);
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'h:mm a')}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={deletingId === log.id}
                            className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete log entry?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the log entry.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(log.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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