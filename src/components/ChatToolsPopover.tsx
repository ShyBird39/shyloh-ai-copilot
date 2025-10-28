import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sliders, Zap, Bot } from "lucide-react";

interface ChatToolsPopoverProps {
  hardModeEnabled: boolean;
  notionEnabled: boolean;
  onHardModeToggle: (enabled: boolean) => void;
  onNotionToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export function ChatToolsPopover({
  hardModeEnabled,
  notionEnabled,
  onHardModeToggle,
  onNotionToggle,
  disabled = false
}: ChatToolsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="text-foreground hover:bg-accent"
          title="Chat tools"
        >
          <Sliders className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Chat Tools</h4>
            <p className="text-xs text-muted-foreground">
              Configure advanced features for this conversation
            </p>
          </div>

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
              onCheckedChange={onHardModeToggle}
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
              onCheckedChange={onNotionToggle}
              className="data-[state=checked]:bg-accent"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
