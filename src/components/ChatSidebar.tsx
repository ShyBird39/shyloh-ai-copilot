import { useState, useEffect } from "react";
import { MessageSquare, Trash2, Plus, Bot, Lock, Users as UsersIcon, Globe, GripVertical, Share2, ChevronDown, UserPlus, ClipboardList, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { TasksList } from "./TasksList";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  visibility: string;
  participant_count?: number;
}

interface ChatSidebarProps {
  restaurantId: string;
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewConversation: () => void;
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRefreshConversations: () => void;
  onToggleVisibility?: (conversationId: string, currentVisibility: string) => void;
  onOpenShareSettings?: (conversationId: string, visibility: string) => void;
}

export function ChatSidebar({
  restaurantId,
  conversations,
  currentConversationId,
  onNewConversation,
  onLoadConversation,
  onDeleteConversation,
  onRefreshConversations,
  onToggleVisibility,
  onOpenShareSettings,
}: ChatSidebarProps) {
  const [agents, setAgents] = useState<any[]>([]);
  const [draggedAgent, setDraggedAgent] = useState<any>(null);
  const [dragOverAgent, setDragOverAgent] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<{ id: string; visibility: string } | null>(null);
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadAgents();
  }, [restaurantId]);

  // Load file counts for all conversations
  useEffect(() => {
    const loadFileCounts = async () => {
      if (conversations.length === 0) return;

      const counts: Record<string, number> = {};
      for (const conv of conversations) {
        const { count } = await supabase
          .from('restaurant_files')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('storage_type', 'temporary');
        
        counts[conv.id] = count || 0;
      }
      setFileCounts(counts);
    };

    loadFileCounts();
  }, [conversations]);

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurant_agents")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error("Error loading agents:", error);
    }
  };

  const handleAgentDragStart = (e: React.DragEvent, agent: any) => {
    setDraggedAgent(agent);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleAgentDragOver = (e: React.DragEvent, agent: any) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverAgent(agent.id);
  };

  const handleAgentDragLeave = () => {
    setDragOverAgent(null);
  };

  const handleAgentDrop = async (e: React.DragEvent, targetAgent: any) => {
    e.preventDefault();
    setDragOverAgent(null);
    
    if (!draggedAgent || draggedAgent.id === targetAgent.id) {
      setDraggedAgent(null);
      return;
    }

    const draggedIndex = agents.findIndex(a => a.id === draggedAgent.id);
    const targetIndex = agents.findIndex(a => a.id === targetAgent.id);

    // Reorder locally
    const newAgents = [...agents];
    newAgents.splice(draggedIndex, 1);
    newAgents.splice(targetIndex, 0, draggedAgent);

    // Update sort_order for all affected agents
    const updates = newAgents.map((agent, index) => ({
      id: agent.id,
      sort_order: index + 1
    }));

    setAgents(newAgents);

    try {
      for (const update of updates) {
        await supabase
          .from("restaurant_agents")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
      }
      toast({
        title: "Order updated",
        description: "Agent order saved successfully",
      });
    } catch (error) {
      console.error("Error updating agent order:", error);
      toast({
        title: "Error",
        description: "Failed to save agent order",
        variant: "destructive",
      });
      loadAgents(); // Reload on error
    }

    setDraggedAgent(null);
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "team":
        return <UsersIcon className="w-3 h-3" />;
      case "public":
        return <Globe className="w-3 h-3" />;
      default:
        return <Lock className="w-3 h-3" />;
    }
  };

  const handleDeleteClick = (conversationId: string) => {
    setSelectedConversation({ id: conversationId, visibility: '' });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedConversation) {
      onDeleteConversation(selectedConversation.id);
    }
    setDeleteConfirmOpen(false);
    setSelectedConversation(null);
  };

  const handleToggleClick = (conversationId: string, currentVisibility: string) => {
    // If switching from private to public/team, show confirmation
    if (currentVisibility === 'private') {
      setSelectedConversation({ id: conversationId, visibility: currentVisibility });
      setToggleConfirmOpen(true);
    } else {
      // If switching from public/team to private, no confirmation needed
      onToggleVisibility?.(conversationId, currentVisibility);
    }
  };

  const handleToggleConfirm = () => {
    if (selectedConversation && onToggleVisibility) {
      onToggleVisibility(selectedConversation.id, selectedConversation.visibility);
    }
    setToggleConfirmOpen(false);
    setSelectedConversation(null);
  };

  return (
    <>
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this conversation and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={toggleConfirmOpen} onOpenChange={setToggleConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make Conversation Public?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make the conversation visible to all team members. They will be able to view all messages in this conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleConfirm}>
              Make Public
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="h-full flex flex-col border-r border-border bg-background">
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold">Chat & Files</h2>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="conversations" className="w-full h-full flex flex-col">
          <TabsList className="w-full grid grid-cols-3 mx-4 mt-2" style={{ width: 'calc(100% - 2rem)' }}>
            <TabsTrigger value="conversations">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chats
            </TabsTrigger>
            <TabsTrigger value="agents">
              <Bot className="w-4 h-4 mr-2" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <ClipboardList className="w-4 h-4 mr-2" />
              Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversations" className="mt-4 px-4">
            <Button
              onClick={onNewConversation}
              className="w-full mb-4"
              variant="default"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Conversation
            </Button>

            <ScrollArea className="h-[calc(100vh-240px)]">
              {conversations.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No conversations yet. Start chatting!
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => {
                    const isSelected = currentConversationId === conv.id;
                    return (
                      <div
                        key={conv.id}
                        className={`group relative p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[#620B14] text-[#FBEFEA] border-[#DD3828] border-2"
                            : "bg-[#FBEFEA] text-[#620B14] border-[#EAEFDB] hover:bg-[#EAEFDB] hover:border-[#195029]"
                        }`}
                        onClick={() => onLoadConversation(conv.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          {/* Left side: Trash icon (hover only) + Title & Details */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(conv.id);
                              }}
                              title="Delete conversation"
                            >
                              <Trash2 className="w-4 h-4" style={{ color: '#DD3828' }} />
                            </Button>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate">
                                {conv.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <p className={`text-xs ${isSelected ? 'text-[#F3C5B6]' : 'text-[#DD3828]'}`}>
                                  {formatDistanceToNow(new Date(conv.updated_at), {
                                    addSuffix: true,
                                  })}
                                </p>
                                {fileCounts[conv.id] > 0 && (
                                  <span className={`text-xs flex items-center gap-1 ${isSelected ? 'text-[#F3C5B6]' : 'text-[#DD3828]'}`}>
                                    <Paperclip className="h-3 w-3" />
                                    {fileCounts[conv.id]}
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs mt-0.5 ${isSelected ? 'text-[#F3C5B6]' : 'text-[#DD3828]'}`}>
                                {conv.message_count} messages
                              </p>
                            </div>
                          </div>
                          
                          {/* Right side: Visibility controls (always visible) */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Lock/Users Icon */}
                            {conv.visibility === 'team' || conv.visibility === 'public' ? (
                              <UsersIcon className="w-4 h-4" style={{ color: isSelected ? '#EAEFDB' : '#195029' }} />
                            ) : (
                              <Lock className="w-4 h-4" style={{ color: isSelected ? '#EAEFDB' : '#195029' }} />
                            )}
                            
                            {/* Toggle Switch */}
                            {onToggleVisibility && (
                              <Switch
                                checked={conv.visibility === 'team' || conv.visibility === 'public'}
                                onCheckedChange={() => handleToggleClick(conv.id, conv.visibility)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-5 w-9 [&>span]:bg-[#DD3828]"
                                style={{
                                  backgroundColor: conv.visibility === 'team' || conv.visibility === 'public' ? '#EAEFDB' : '#F3C5B6'
                                }}
                              />
                            )}
                            
              {/* Share Arrow Button with Participant Count Badge */}
              {onOpenShareSettings && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenShareSettings(conv.id, conv.visibility);
                    }}
                    title="Share with specific members"
                  >
                    <Share2 className="w-4 h-4" style={{ color: isSelected ? '#EAEFDB' : '#195029' }} />
                  </Button>
                  {/* Participant count badge - only show if more than just owner */}
                  {conv.participant_count && conv.participant_count > 1 && (
                    <div 
                      className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold"
                      style={{ 
                        backgroundColor: '#DD3828',
                        color: '#FBEFEA'
                      }}
                    >
                      {conv.participant_count}
                    </div>
                  )}
                </div>
              )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="agents" className="mt-4 px-4 flex flex-col h-full">
            <div className="space-y-2 flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                AI-powered agents to help with specific tasks. Drag to reorder.
              </p>
              <p className="text-xs text-muted-foreground/60 mb-4">*powered by Agent.ai</p>
              
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  draggable
                  onDragStart={(e) => handleAgentDragStart(e, agent)}
                  onDragOver={(e) => handleAgentDragOver(e, agent)}
                  onDragLeave={handleAgentDragLeave}
                  onDrop={(e) => handleAgentDrop(e, agent)}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg
                    transition-all cursor-move
                    ${!agent.is_active 
                      ? 'bg-primary/60 text-primary-foreground/70 border border-primary/40' 
                      : 'bg-primary text-primary-foreground border border-primary hover:bg-primary/90'}
                    ${dragOverAgent === agent.id ? 'ring-2 ring-primary-foreground/50' : ''}
                    ${draggedAgent?.id === agent.id ? 'opacity-40' : ''}
                  `}
                  onClick={() => agent.is_active && agent.url && window.open(agent.url, '_blank')}
                >
                  <GripVertical className="w-4 h-4 flex-shrink-0 opacity-70" />
                  <Bot className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm flex-1 font-medium">
                    {agent.name}
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-0 h-[calc(100vh-200px)] flex flex-col">
            <TasksList 
              restaurantId={restaurantId}
              onNavigateToConversation={onLoadConversation}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
}
