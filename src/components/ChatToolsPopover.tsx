import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sliders, Zap, Bot, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatToolsPopoverProps {
  hardModeEnabled: boolean;
  notionEnabled: boolean;
  debugMode?: boolean;
  onHardModeToggle: (enabled: boolean) => void;
  onNotionToggle: (enabled: boolean) => void;
  onDebugModeToggle?: (enabled: boolean) => void;
  disabled?: boolean;
  restaurantId: string;
  conversationId?: string;
  userId?: string;
}

export function ChatToolsPopover({
  hardModeEnabled,
  notionEnabled,
  debugMode = false,
  onHardModeToggle,
  onNotionToggle,
  onDebugModeToggle,
  disabled = false,
  restaurantId,
  conversationId,
  userId
}: ChatToolsPopoverProps) {
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskDialogOpen, setQuickTaskDialogOpen] = useState(false);

  const handleCreateQuickTask = async () => {
    if (!userId || !quickTaskTitle.trim()) return;

    const { data: existingTasks } = await supabase
      .from("restaurant_tasks")
      .select("sort_order")
      .eq("user_id", userId)
      .eq("restaurant_id", restaurantId)
      .is("archived_at", null);

    const maxSortOrder = existingTasks && existingTasks.length > 0 
      ? Math.max(...existingTasks.map(t => t.sort_order)) 
      : -1;

    const { error } = await supabase.from("restaurant_tasks").insert({
      user_id: userId,
      restaurant_id: restaurantId,
      title: quickTaskTitle.trim(),
      conversation_id: conversationId || null,
      sort_order: maxSortOrder + 1,
    });

    if (error) {
      toast.error("Failed to create task");
      console.error(error);
    } else {
      toast.success("Task created");
      setQuickTaskTitle("");
      setQuickTaskDialogOpen(false);
    }
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-disabled={disabled}
          className={`relative z-50 h-10 w-10 text-foreground hover:bg-accent ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          title="Chat tools"
        >
          <Sliders className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 z-50" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Chat Tools</h4>
            <p className="text-xs text-muted-foreground">
              Configure advanced features for this conversation
            </p>
          </div>

          {/* Quick Task Button */}
          <Dialog open={quickTaskDialogOpen} onOpenChange={setQuickTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <ClipboardList className="w-4 h-4 mr-2" />
                Quick Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Quick Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Task title..."
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateQuickTask()}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setQuickTaskDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateQuickTask} disabled={!quickTaskTitle.trim()}>
                    Create Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Hard Mode Toggle */}
          <div className="flex items-start justify-between space-x-2">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                <Label htmlFor="hard-mode" className="text-sm font-medium">
                  Hard Mode
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Use the most powerful AI model for complex people problems. 
                Enables deeper reasoning and more thoughtful analysis.
              </p>
            </div>
            <Switch
              id="hard-mode"
              checked={hardModeEnabled}
              onCheckedChange={(v) => !disabled && onHardModeToggle(v)}
              disabled={disabled}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>

          {/* Notion Toggle */}
          <div className="flex items-start justify-between space-x-2">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-accent-foreground" />
                <Label htmlFor="notion" className="text-sm font-medium">
                  Notion Integration
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Access your Notion workspace to search for SOPs, recipes, 
                schedules, and operational docs.
              </p>
            </div>
            <Switch
              id="notion"
              checked={notionEnabled}
              onCheckedChange={(v) => !disabled && onNotionToggle(v)}
              disabled={disabled}
              className="data-[state=checked]:bg-accent"
            />
          </div>

          {/* Debug Mode Toggle */}
          {onDebugModeToggle && (
            <div className="flex items-start justify-between space-x-2 border-t pt-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-500" />
                  <Label htmlFor="debug-mode" className="text-sm font-medium">
                    Debug Mode
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Show the complete prompt context sent to Claude instead of generating a response.
                </p>
              </div>
              <Switch
                id="debug-mode"
                checked={debugMode}
                onCheckedChange={(v) => !disabled && onDebugModeToggle(v)}
                disabled={disabled}
                className="data-[state=checked]:bg-blue-500"
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
