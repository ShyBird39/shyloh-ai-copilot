import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConversationFileHeaderProps {
  conversationTitle?: string;
  fileCount: number;
  isOpen: boolean;
  onToggle: () => void;
  hasConversation: boolean;
}

export const ConversationFileHeader = ({
  conversationTitle,
  fileCount,
  isOpen,
  onToggle,
  hasConversation,
}: ConversationFileHeaderProps) => {
  if (!hasConversation) return null;

  return (
    <div className="border-b border-border bg-background px-4 py-3">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-foreground">
            {conversationTitle || "Current Conversation"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              "h-7 px-2 gap-1.5 transition-all",
              fileCount > 0 && "text-primary hover:text-primary/80"
            )}
          >
            <Paperclip className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{fileCount}</span>
            <span className="text-xs text-muted-foreground">
              {fileCount === 1 ? "file" : "files"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};
