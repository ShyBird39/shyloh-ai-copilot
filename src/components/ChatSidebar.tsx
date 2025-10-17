import { useState, useEffect } from "react";
import { MessageSquare, Upload, Trash2, FileText, Plus, Bot, LogOut, Lock, Users as UsersIcon, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  visibility: string;
  participant_count?: number;
}

interface RestaurantFile {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
  processed: boolean;
  embeddings_generated: boolean;
}

interface ChatSidebarProps {
  restaurantId: string;
  conversations: Conversation[];
  files: RestaurantFile[];
  currentConversationId: string | null;
  onNewConversation: () => void;
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onFileUpload: (files: FileList) => void;
  onDeleteFile: (id: string) => void;
  onMoveToKnowledgeBase?: (fileId: string, fileName: string) => void;
  onRefreshConversations: () => void;
  onRefreshFiles: () => void;
}

export function ChatSidebar({
  restaurantId,
  conversations,
  files,
  currentConversationId,
  onNewConversation,
  onMoveToKnowledgeBase,
  onLoadConversation,
  onDeleteConversation,
  onFileUpload,
  onDeleteFile,
  onRefreshConversations,
  onRefreshFiles,
}: ChatSidebarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadAgents();
  }, [restaurantId]);

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurant_agents")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error("Error loading agents:", error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files);
    }
  };

  const { signOut } = useAuth();

  return (
    <div className="h-full flex flex-col border-r border-border bg-background">
      <div className="border-b border-border p-4 flex flex-row items-center justify-between">
        <h2 className="text-lg font-semibold">Chat & Files</h2>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="conversations" className="w-full h-full flex flex-col">
          <TabsList className="w-full grid grid-cols-3 mx-4 mt-2" style={{ width: 'calc(100% - 2rem)' }}>
            <TabsTrigger value="conversations">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chats
            </TabsTrigger>
            <TabsTrigger value="files">
              <FileText className="w-4 h-4 mr-2" />
              Files
            </TabsTrigger>
            <TabsTrigger value="agents">
              <Bot className="w-4 h-4 mr-2" />
              Agents
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
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`group relative p-3 rounded-lg border cursor-pointer transition-colors ${
                        currentConversationId === conv.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground border-border"
                      }`}
                      onClick={() => onLoadConversation(conv.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-sm truncate flex-1">
                              {conv.title}
                            </h3>
                            <div className="flex items-center gap-1 opacity-70">
                              {getVisibilityIcon(conv.visibility)}
                              {conv.participant_count && conv.visibility === "private" && (
                                <span className="text-xs">
                                  {conv.participant_count}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs opacity-70 mt-1">
                            {formatDistanceToNow(new Date(conv.updated_at), {
                              addSuffix: true,
                            })}
                          </p>
                          <p className="text-xs opacity-60 mt-0.5">
                            {conv.message_count} messages
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conv.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="files" className="mt-4 px-4">
            <div
              className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag & drop files here
              </p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    onFileUpload(e.target.files);
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                Browse Files
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-380px)]">
              {files.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No files uploaded yet
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 rounded-lg border border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm break-words" title={file.file_name}>
                              {file.file_name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatFileSize(file.file_size)} • {file.file_type}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDistanceToNow(new Date(file.uploaded_at), {
                                addSuffix: true,
                              })}
                            </p>
                            {file.processed && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                ✓ {file.embeddings_generated ? "Ready for RAG" : "Processed"}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground/70 italic mt-1">
                              Temporary file
                            </p>
                            {!file.processed && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                Processing...
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {onMoveToKnowledgeBase && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onMoveToKnowledgeBase(file.id, file.file_name)}
                              className="flex-1 text-primary-foreground hover:text-primary-foreground"
                            >
                              Move to KB
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDeleteFile(file.id)}
                            className="flex-1"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="agents" className="mt-4 px-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                AI-powered agents to help with specific tasks
              </p>
              
              {/* Active agents from database */}
              {agents.map((agent) => (
                <Button
                  key={agent.id}
                  onClick={() => window.open(agent.url, '_blank')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  {agent.name}
                </Button>
              ))}
              
              {/* Coming Soon placeholder agents */}
              <Button
                className="w-full justify-start"
                variant="outline"
                disabled
              >
                <Bot className="w-4 h-4 mr-2" />
                Reservation Availability (Coming Soon)
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
