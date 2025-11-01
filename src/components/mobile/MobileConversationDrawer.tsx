import { X, Plus, MessageSquare, Paperclip, Lock, Globe, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  visibility: string;
  participant_count?: number;
}

interface MobileConversationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onLoadConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  fileCounts?: Record<string, number>;
  notificationCounts?: Record<string, { mentions: number; invites: number }>;
  lastMessages?: Record<string, string>;
}

export const MobileConversationDrawer = ({
  open,
  onOpenChange,
  conversations,
  currentConversationId,
  onLoadConversation,
  onNewConversation,
  onDeleteConversation,
  fileCounts = {},
  notificationCounts = {},
  lastMessages = {},
}: MobileConversationDrawerProps) => {
  
  const handleConversationTap = (conversationId: string) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    onLoadConversation(conversationId);
    onOpenChange(false);
  };

  const handleNewConversation = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    onNewConversation();
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh]">
        <DrawerHeader className="flex items-center justify-between border-b border-border">
          <DrawerTitle className="text-xl font-semibold">Conversations</DrawerTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </DrawerHeader>

        <div className="p-4 border-b border-border/50">
          <Button 
            onClick={handleNewConversation}
            className="w-full mobile-tap-target"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Conversation
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No conversations yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Tap "New Conversation" to start chatting with Shyloh AI
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.id === currentConversationId;
                const fileCount = fileCounts[conv.id] || 0;
                const notifications = notificationCounts[conv.id] || { mentions: 0, invites: 0 };
                const totalNotifications = notifications.mentions + notifications.invites;
                const lastMessage = lastMessages[conv.id] || "";
                const preview = lastMessage.length > 60 
                  ? lastMessage.substring(0, 60) + "..." 
                  : lastMessage;

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleConversationTap(conv.id)}
                    className={`conversation-item w-full text-left ${
                      isActive ? 'conversation-item-active' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{conv.title}</h4>
                          {conv.visibility === 'private' && (
                            <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                          {conv.visibility === 'public' && (
                            <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                          {(conv.participant_count || 0) > 1 && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {conv.participant_count}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {preview && (
                          <p className="text-sm text-muted-foreground truncate mb-1">
                            {preview}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}</span>
                          {conv.message_count > 0 && (
                            <>
                              <span>•</span>
                              <span>{conv.message_count} messages</span>
                            </>
                          )}
                          {fileCount > 0 && (
                            <>
                              <span>•</span>
                              <Paperclip className="h-3 w-3" />
                              <span>{fileCount}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {totalNotifications > 0 && (
                          <Badge 
                            variant={notifications.mentions > 0 ? "destructive" : "secondary"}
                            className="h-5 min-w-[20px] px-1.5"
                          >
                            {totalNotifications}
                          </Badge>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};
