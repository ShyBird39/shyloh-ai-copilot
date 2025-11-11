import { Button } from "@/components/ui/button";
import { SALES_MIX_FIELDS, getSalesMixFieldKeys } from "@/config/sales-mix-fields";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { LogOut, MapPin, Tag, Pencil, Loader2, Send, PanelLeftClose, PanelLeft, ChevronDown, ChevronUp, RotateCcw, Paperclip, UtensilsCrossed, Sparkles, Users, Clock, Settings, Heart, UserCog, Trash2, Brain, AlertCircle, Edit, Crown, Bot, Zap, ClipboardList, MessageSquare, Plus, Menu, Lock, Globe, ChevronRight, CheckSquare } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChatSidebar } from "@/components/ChatSidebar";
import { TagSelector } from "@/components/TagSelector";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { TeamManagement } from "@/components/TeamManagement";
import { ConversationSettings } from "@/components/ConversationSettings";
import { MentionInput } from "@/components/MentionInput";
import { NotificationBell } from "@/components/NotificationBell";
import { TuningSheet } from "@/components/TuningSheet";
import { PinInput } from "@/components/PinInput";
import { OnboardingTuningFlow } from "@/components/OnboardingTuningFlow";
import { ChatToolsPopover } from "@/components/ChatToolsPopover";
import KPIInput from "@/components/KPIInput";
import { useAuth } from "@/hooks/useAuth";
import { useRestaurantData } from "@/hooks/useRestaurantData";
import { useConversationState } from "@/hooks/useConversationState";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { ConversationFileHeader } from "@/components/ConversationFileHeader";
import { ConversationFilePanel } from "@/components/ConversationFilePanel";
import { ShiftLogPanel } from "@/components/ShiftLogPanel";
import { ShiftLogEntry } from "@/components/ShiftLogEntry";
import { InstallPrompt } from "@/components/InstallPrompt";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileConversationDrawer } from "@/components/mobile/MobileConversationDrawer";
import { MobileSettings } from "@/components/mobile/MobileSettings";
import { MobileNavigationMenu } from "@/components/mobile/MobileNavigationMenu";
import { VoiceCapture } from "@/components/manager-log/VoiceCapture";

interface KPIData {
  avg_weekly_sales: number | null;
  food_cost_goal: number | null;
  labor_cost_goal: number | null;
  sales_mix_food: number | null;
  sales_mix_liquor: number | null;
  sales_mix_wine: number | null;
  sales_mix_beer: number | null;
  sales_mix_na_bev: number | null;
  sales_mix_retail: number | null;
  sales_mix_room_fees: number | null;
  sales_mix_other: number | null;
  sales_mix_other_label: string | null;
}

interface ChatMessage {
  id?: string;
  role: "assistant" | "user";
  content: string;
  type?: "question" | "confirmation" | "input";
  user_id?: string | null;
  display_name?: string | null;
  hard_mode_used?: boolean;
}

const RestaurantFindings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const isMobile = useIsMobile();
  
  // Use restaurant data hook
  const {
    restaurantData: data,
    setRestaurantData: setData,
    kpiData,
    setKPIData,
    hasCompletedKPIs,
    setHasCompletedKPIs,
    toolsData,
    setToolsData,
    customKnowledge,
    setCustomKnowledge,
    toastData,
    loadingToastData,
    loading,
    loadCustomKnowledge,
    fetchToastData,
    refreshRestaurantData,
  } = useRestaurantData(id);
  
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [claimPin, setClaimPin] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);
  
  // REGGI dimensions configuration
  const reggiDimensions = [
    { 
      key: 'culinary_beverage', 
      label: 'Culinary/Beverage', 
      icon: UtensilsCrossed,
      codeKey: 'culinary_beverage_code',
      descKey: 'culinary_beverage_description'
    },
    { 
      key: 'vibe_energy', 
      label: 'Vibe/Energy', 
      icon: Sparkles,
      codeKey: 'vibe_energy_code',
      descKey: 'vibe_energy_description'
    },
    { 
      key: 'social_context', 
      label: 'Social Context', 
      icon: Users,
      codeKey: 'social_context_code',
      descKey: 'social_context_description'
    },
    { 
      key: 'time_occasion', 
      label: 'Time/Occasion', 
      icon: Clock,
      codeKey: 'time_occasion_code',
      descKey: 'time_occasion_description'
    },
    { 
      key: 'operational_execution', 
      label: 'Operational Execution', 
      icon: Settings,
      codeKey: 'operational_execution_code',
      descKey: 'operational_execution_description'
    },
    { 
      key: 'hospitality_approach', 
      label: 'Hospitality Approach', 
      icon: Heart,
      codeKey: 'hospitality_approach_code',
      descKey: 'hospitality_approach_description'
    },
  ];
  
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [kpisOpen, setKpisOpen] = useState(false);
  const [dimensionsOpen, setDimensionsOpen] = useState(false);
  const [reggiOpen, setReggiOpen] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [knowledgeBaseOpen, setKnowledgeBaseOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [editingKPI, setEditingKPI] = useState<string | null>(null);
  const [kpiEditValue, setKpiEditValue] = useState("");
  const [permanentFiles, setPermanentFiles] = useState<any[]>([]);
  const [editingFileTags, setEditingFileTags] = useState<string | null>(null);
  const [fileTagsValue, setFileTagsValue] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  
  // REGGI editing state
  const [editingReggi, setEditingReggi] = useState<string | null>(null);
  const [reggiEditValue, setReggiEditValue] = useState("");
  
  const [editingTool, setEditingTool] = useState<string | null>(null);
  const [toolEditValue, setToolEditValue] = useState("");
  
  // Custom knowledge UI state
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState<string | null>(null);
  const [knowledgeForm, setKnowledgeForm] = useState({
    title: "",
    content: "",
    category: "",
  });
  
  // Prompt library state
  const [promptsOpen, setPromptsOpen] = useState(false);
  const [myPromptsOpen, setMyPromptsOpen] = useState(true);
  const [savedPrompts, setSavedPrompts] = useState<any[]>([]);
  const [globalPrompts, setGlobalPrompts] = useState<any[]>([]);
  const [myPrompts, setMyPrompts] = useState<any[]>([]);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [promptForm, setPromptForm] = useState({
    title: "",
    prompt_text: "",
    category: "",
  });
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [tuningOpen, setTuningOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [tuningSheetOpen, setTuningSheetOpen] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinMode, setPinMode] = useState<"set" | "verify">("verify");
  const [pinLoading, setPinLoading] = useState(false);
  
  // Chat state
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [promptsVisible, setPromptsVisible] = useState(true);
  const [currentInput, setCurrentInput] = useState("");
  const [notionMentioned, setNotionMentioned] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [showFileNotification, setShowFileNotification] = useState(false);
  const [showObjectives, setShowObjectives] = useState(false);
  const [manualKPIEntry, setManualKPIEntry] = useState({
    avg_weekly_sales: '',
    food_cost_goal: '',
    labor_cost_goal: '',
    sales_mix_food: '',
    sales_mix_liquor: '',
    sales_mix_wine: '',
    sales_mix_beer: '',
    sales_mix_na_bev: '',
    sales_mix_retail: '',
    sales_mix_room_fees: '',
    sales_mix_other: '',
    sales_mix_other_label: '',
  });
  const [kpiFormErrors, setKpiFormErrors] = useState<Record<string, string>>({});
  const [savingManualKPIs, setSavingManualKPIs] = useState(false);
  
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New state for chat history and files
  const [files, setFiles] = useState<any[]>([]);
  const [cleanupAttempted, setCleanupAttempted] = useState(false);
  const [showConversationSettings, setShowConversationSettings] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showPromptDialog, setShowPromptDialog] = useState(false);

  // Coaching session state
  const [showCoachingOptions, setShowCoachingOptions] = useState(false);
  const [selectedCoachingAreas, setSelectedCoachingAreas] = useState<string[]>([]);


  // Onboarding state
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [currentReggiDimension, setCurrentReggiDimension] = useState<number>(0); // Track which REGGI dimension (0-5)
  const [onboardingSteps, setOnboardingSteps] = useState([
    { id: 'profile', label: 'Profile', completed: false, active: true },
    { id: 'kpis', label: 'KPIs', completed: false, active: false },
    { id: 'tools', label: 'Tools', completed: false, active: false },
    { id: 'files', label: 'Files', completed: false, active: false },
    { id: 'rules', label: 'Rules', completed: false, active: false },
  ]);

  // File panel state
  const [filePanelOpen, setFilePanelOpen] = useState(false);

  // Quick Win onboarding state
  const [onboardingPhase, setOnboardingPhase] = useState<'hook' | 'pain_point' | 'quick_win' | 'tuning' | 'data_collection'>('hook');
  const [userPainPoint, setUserPainPoint] = useState<string>('');
  const [quickWinExchangeCount, setQuickWinExchangeCount] = useState<number>(0);
  const [quickWinStartTime, setQuickWinStartTime] = useState<number | null>(null);
  const [showTuningFlow, setShowTuningFlow] = useState(false);

  // Quick Win Progress tracking
  const [quickWinProgress, setQuickWinProgress] = useState({
    currentStep: 1,
    totalSteps: 5,
    steps: [
      { id: 'quick_win', label: 'Earn Your Attention', completed: false, active: true },
      { id: 'tuning_intro', label: 'Tuning Setup', completed: false, active: false },
      { id: 'tuning_sliders', label: 'Set Profile', completed: false, active: false },
      { id: 'kpi_collection', label: 'Key Numbers', completed: false, active: false },
      { id: 'complete', label: 'Ready!', completed: false, active: false },
    ]
  });

  // Center view toggle
  const [centerView, setCenterView] = useState<'chat' | 'shift-log'>('chat');

  // Track unread notifications for tab title
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Mobile tab state
  const [mobileTab, setMobileTab] = useState<'chat' | 'voice' | 'text'>('chat');
  const [conversationDrawerOpen, setConversationDrawerOpen] = useState(false);
  const [navigationMenuOpen, setNavigationMenuOpen] = useState(false);
  const [currentNavSection, setCurrentNavSection] = useState<'chats' | 'agents' | 'tasks' | 'manager-log'>('chats');
  const [showConversationThread, setShowConversationThread] = useState(false);
  
  // Use conversation state hook
  const {
    currentConversationId,
    setCurrentConversationId,
    conversations,
    setConversations,
    messages,
    setMessages,
    currentParticipants,
    setCurrentParticipants,
    conversationState,
    setConversationState,
    currentConversationVisibility,
    setCurrentConversationVisibility,
    notionEnabled,
    setNotionEnabled,
    hardModeEnabled,
    setHardModeEnabled,
    messageFeedback,
    setMessageFeedback,
    lastMessagePreviews,
    setLastMessagePreviews,
    loadConversations,
    loadCurrentConversationParticipants,
    handleNewConversation,
    handleLoadConversation,
    handleDeleteConversation,
    handleToggleVisibility,
  } = useConversationState({
    restaurantId: id,
    userId: user?.id,
    restaurantData: data,
    setOnboardingPhase,
    setCurrentInput,
    setShowObjectives,
  });

  // Ensure Chat tab is active on mobile by default and validate tab value
  useEffect(() => {
    if (isMobile) {
      const validTabs = ['chat', 'voice', 'text'];
      if (!validTabs.includes(mobileTab)) {
        setMobileTab('chat');
      }
      // Reset to conversation list when switching away from chat tab
      if (mobileTab !== 'chat') {
        setShowConversationThread(false);
      }
    }
  }, [isMobile, mobileTab]);

  const samplePrompts = [
    "I am here to...",
    "Strategy Session",
    "Review or Change Settings",
    "Tips for using Shyloh"
  ];

  const objectives = [
    { id: 'sales', label: 'Increase my sales', icon: '📈' },
    { id: 'costs', label: 'Lower my costs', icon: '💰' },
    { id: 'guest', label: 'Improve the guest experience', icon: '✨' },
    { id: 'team', label: 'Improve the team experience', icon: '👥' }
  ];

  const handleRefreshChat = () => {
    handleNewConversation();
  };

  const updateMessageFeedbackStats = async (messageId: string) => {
    try {
      const { data: allFeedback, error } = await supabase
        .from("chat_message_feedback")
        .select("rating")
        .eq("message_id", messageId);

      if (error || !allFeedback) return;

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let total = 0;
      let sum = 0;

      allFeedback.forEach(fb => {
        distribution[fb.rating as keyof typeof distribution]++;
        total++;
        sum += fb.rating;
      });

      const average = total > 0 ? sum / total : 0;

      await supabase
        .from("chat_messages")
        .update({
          feedback_stats: { total, average, distribution }
        })
        .eq("id", messageId);
    } catch (error) {
      console.error("Error updating feedback stats:", error);
    }
  };

  const handleMessageFeedback = async (messageIndex: number, rating: number) => {
    if (!currentConversationId || !id || !user?.id) return;

    setMessageFeedback(prev => ({ ...prev, [messageIndex]: rating }));

    try {
      const { data: msgs, error: fetchError } = await supabase
        .from("chat_messages")
        .select("id")
        .eq("conversation_id", currentConversationId)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;
      
      const messageId = msgs?.[messageIndex]?.id;
      if (!messageId) throw new Error("Message not found");

      const { data: existingFeedback } = await supabase
        .from("chat_message_feedback")
        .select("id")
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .single();

      if (existingFeedback) {
        const { error } = await supabase
          .from("chat_message_feedback")
          .update({ rating, created_at: new Date().toISOString() })
          .eq("id", existingFeedback.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("chat_message_feedback")
          .insert({
            message_id: messageId,
            conversation_id: currentConversationId,
            restaurant_id: id,
            user_id: user.id,
            rating
          });
        
        if (error) throw error;
      }

      await updateMessageFeedbackStats(messageId);
      toast.success("Thanks for your feedback!");
    } catch (error) {
      console.error("Error saving feedback:", error);
      toast.error("Failed to save feedback");
      setMessageFeedback(prev => {
        const newState = { ...prev };
        delete newState[messageIndex];
        return newState;
      });
    }
  };

  const handleDeleteMessage = async (messageId: string, messageIndex: number) => {
    if (!currentConversationId || !user?.id) return;
    
    if (!confirm("Delete this message? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("chat_messages")
        .update({ 
          deleted_at: new Date().toISOString(),
          deleted_by: user.id 
        })
        .eq("id", messageId);

      if (error) throw error;

      // Update local state to remove the message
      setMessages(prev => prev.filter((_, idx) => idx !== messageIndex));
      
      // Decrement message count
      await supabase.rpc('decrement_message_count', { 
        p_conversation_id: currentConversationId 
      });
      
      toast.success("Message deleted");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  const FeedbackEmojis = ({ 
    messageIndex, 
    currentRating, 
    onRate 
  }: { 
    messageIndex: number; 
    currentRating?: number; 
    onRate: (rating: number) => void;
  }) => {
    const emojis = [
      { rating: 1, emoji: "😡", label: "Not helpful" },
      { rating: 2, emoji: "😐", label: "Neutral" },
      { rating: 3, emoji: "🙂", label: "Okay" },
      { rating: 4, emoji: "😊", label: "Good" },
      { rating: 5, emoji: "😍", label: "Excellent" }
    ];

    return (
      <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {emojis.map(({ rating, emoji, label }) => (
          <button
            key={rating}
            onClick={() => onRate(rating)}
            className={`text-lg hover:scale-125 transition-transform ${
              currentRating === rating ? 'scale-125' : 'opacity-50 hover:opacity-100'
            }`}
            title={label}
          >
            {emoji}
          </button>
        ))}
      </div>
    );
  };

  const ParticipantTags = () => {
    if (!currentConversationId || currentParticipants.length <= 1) {
      return null;
    }

    return (
      <div className="border-b border-accent/20 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-2 max-w-4xl">
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="w-4 h-4" style={{ color: '#195029' }} />
            <span className="text-sm font-medium" style={{ color: '#620B14' }}>
              Participants:
            </span>
            <div className="flex flex-wrap gap-2">
              {currentParticipants.map((participant) => {
                const isCurrentUser = participant.user_id === user?.id;
                const displayName = participant.profiles.display_name || 
                                   participant.profiles.email.split('@')[0];
                
                return (
                  <Badge
                    key={participant.id}
                    variant="outline"
                    className="flex items-center gap-1"
                    style={{
                      backgroundColor: '#EAEFDB',
                      borderColor: '#195029',
                      color: '#620B14'
                    }}
                  >
                    {participant.role === 'owner' && (
                      <Crown className="w-3 h-3" style={{ color: '#DD3828' }} />
                    )}
                    {displayName}
                    {isCurrentUser && <span className="text-xs">(you)</span>}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const startOnboarding = () => {
    setIsOnboarding(true);
    setOnboardingStep(1);
    setCurrentReggiDimension(0);
    setCurrentConversationId(null);
    
    setMessages([
      {
        role: "assistant",
        content: `Hey! 👋 I'm Shyloh—think of me as your ops thought partner. I'm here to help you run a tighter, more profitable operation. Before we dive in, I need to learn about your restaurant. This'll take about 5 minutes. Sound good?`,
        type: "question",
      },
    ]);
    updateOnboardingProgress(1, true);
  };

  const updateOnboardingProgress = (step: number, makeActive: boolean = false) => {
    setOnboardingSteps(prev => prev.map((s, idx) => ({
      ...s,
      completed: idx < step - 1,
      active: makeActive ? idx === step - 1 : s.active,
    })));
  };

  // Helper function to detect file type with fallback to extension
  const getFileType = (file: File): string => {
    // First try the browser's MIME type
    if (file.type) return file.type;
    
    // Fallback: detect from extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
      'md': 'text/markdown',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc': 'application/msword',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    };
    
    return mimeMap[ext || ''] || 'application/octet-stream';
  };

  const handleFileUpload = async (fileList: FileList, storageType: 'temporary' | 'permanent' = 'temporary', description?: string) => {
    if (!id) return;

    // Prevent temporary file uploads if no conversation is active
    if (storageType === 'temporary' && !currentConversationId) {
      toast.error("Please start a conversation before uploading files");
      return;
    }

    const fileNames = Array.from(fileList).map(f => f.name);
    setUploadingFiles(prev => [...prev, ...fileNames]);
    setShowFileNotification(true);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // Sanitize filename: replace spaces and special characters with underscores
      const sanitizedName = file.name.replace(/[^\w.-]/g, '_');
      const fileName = `${id}/${crypto.randomUUID()}/${sanitizedName}`;

      try {
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("restaurant-documents")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Detect file type with fallback
        const fileType = getFileType(file);

        // Create database record - link temporary files to conversation
        const { error: dbError } = await supabase
          .from("restaurant_files")
          .insert({
            restaurant_id: id,
            conversation_id: storageType === 'temporary' ? currentConversationId : null,
            file_name: file.name,
            file_path: fileName,
            file_size: file.size,
            file_type: fileType,
            storage_type: storageType,
            description: description || null,
            processed: true,
            embeddings_generated: false,
          });

        if (dbError) throw dbError;

        toast.success(storageType === 'permanent' ? `${file.name} added to Knowledge Base` : `${file.name} uploaded successfully`);
        setUploadingFiles(prev => prev.filter(name => name !== file.name));
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error(`Failed to upload ${file.name}`);
        setUploadingFiles(prev => prev.filter(name => name !== file.name));
      }
    }

    loadFiles();
  };

  const handleMoveToKnowledgeBase = async (fileId: string, fileName: string) => {
    const description = prompt(`Add a description for "${fileName}" (optional):`);
    
    try {
      const { error } = await supabase
        .from("restaurant_files")
        .update({ 
          storage_type: 'permanent',
          conversation_id: null, // Remove conversation link when moving to KB
          description: description || null
        })
        .eq("id", fileId);

      if (error) throw error;

      toast.success("File moved to Knowledge Base");
      loadFiles();
    } catch (error) {
      console.error("Error moving file:", error);
      toast.error("Failed to move file");
    }
  };

  const handleUpdateFileTags = async (fileId: string, tags: string[]) => {
    try {
      const { error } = await supabase
        .from("restaurant_files")
        .update({ tags })
        .eq("id", fileId);

      if (error) throw error;

      toast.success("Tags updated");
      setEditingFileTags(null);
      loadFiles();
    } catch (error: any) {
      console.error("Error updating tags:", error);
      toast.error("Failed to update tags");
    }
  };

  const handleAddCustomTag = async (tagName: string) => {
    if (!tagName.trim() || !id) return;

    try {
      const { error } = await supabase
        .from("restaurant_custom_tags")
        .insert({
          restaurant_id: id,
          tag_name: tagName.trim(),
          created_by: user?.id
        });

      if (error) {
        if (error.code === '23505') {
          toast.error("Tag already exists");
        } else {
          throw error;
        }
        return;
      }

      setCustomTags([...customTags, tagName.trim()]);
      setNewTagInput("");
      toast.success("Custom tag created");
    } catch (error: any) {
      console.error("Error creating custom tag:", error);
      toast.error("Failed to create custom tag");
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      // Get file info
      const { data: fileData, error: fetchError } = await supabase
        .from("restaurant_files")
        .select("file_path")
        .eq("id", fileId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("restaurant-documents")
        .remove([fileData.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("restaurant_files")
        .delete()
        .eq("id", fileId);

      if (dbError) throw dbError;

      loadFiles();
      toast.success("File deleted");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    }
  };

  // One-time cleanup: remove any previous stuck upload (unprocessed)
  const deleteStuckFileIfAny = async () => {
    if (!id) return;
    try {
      const { data: stuck, error } = await supabase
        .from("restaurant_files")
        .select("id, file_path, processed, uploaded_at")
        .eq("restaurant_id", id)
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (stuck && stuck.processed === false) {
        await supabase.storage.from("restaurant-documents").remove([stuck.file_path]);
        await supabase.from("restaurant_files").delete().eq("id", stuck.id);
        toast.success("Removed previous stuck upload");
        loadFiles();
      }
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  };

  const loadFiles = async () => {
    if (!id) return;

    try {
      // Load conversation-specific temporary files for Files tab
      if (currentConversationId) {
        const { data: tempData, error: tempError } = await supabase
          .from("restaurant_files")
          .select("*")
          .eq("restaurant_id", id)
          .eq("storage_type", "temporary")
          .eq("conversation_id", currentConversationId)
          .order("uploaded_at", { ascending: false });

        if (tempError) throw tempError;
        setFiles(tempData || []);
      } else {
        // No active conversation = no temporary files to show
        setFiles([]);
      }

      // Load permanent files for Knowledge Base (unchanged)
      const { data: permData, error: permError } = await supabase
        .from("restaurant_files")
        .select("*")
        .eq("restaurant_id", id)
        .eq("storage_type", "permanent")
        .order("uploaded_at", { ascending: false });

      if (permError) throw permError;
      setPermanentFiles(permData || []);

      // Load custom tags
      const { data: tagsData } = await supabase
        .from("restaurant_custom_tags")
        .select("tag_name")
        .eq("restaurant_id", id);
      
      if (tagsData) {
        setCustomTags(tagsData.map(t => t.tag_name));
      }
    } catch (error) {
      console.error("Error loading files:", error);
    }
  };

  const loadSavedPrompts = async () => {
    if (!id) return;
    
    try {
      // Fetch all prompts (global + restaurant-specific)
      const { data, error } = await supabase
        .from("restaurant_saved_prompts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const allPrompts = data || [];
      setSavedPrompts(allPrompts);
      
      // Separate global and restaurant-specific prompts
      setGlobalPrompts(allPrompts.filter(p => p.is_global));
      setMyPrompts(allPrompts.filter(p => !p.is_global && p.restaurant_id === id));
    } catch (error) {
      console.error("Error loading saved prompts:", error);
    }
  };

  const handleObjectiveClick = (objective: typeof objectives[0]) => {
    setShowObjectives(false);
    handleSendMessage(`I want to ${objective.label.toLowerCase()}`);
  };

  const handlePromptClick = async (promptText: string) => {
    // Handle "Review or Change Settings" prompt
    if (promptText === "Review or Change Settings") {
      // Add user message to chat
      const userMessage: ChatMessage = { role: "user", content: promptText };
      setMessages((prev) => [...prev, userMessage]);
      setShowObjectives(false);
      
      // Open the settings sidebar
      setSidebarOpen(true);
      
      // Show typing indicator
      setIsTyping(true);
      
      // AI response after brief delay
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: "I've opened your settings panel on the right. What would you like to adjust?\n\nHere are some common changes:\n\n- **Adjust my food cost goal** - Update your target food cost percentage\n- **Change my average weekly sales** - Modify your sales baseline\n- **Update my labor cost goal** - Set a new labor cost target\n- **Create a custom rule** - Add operational protocols or special instructions\n- **Edit my restaurant story** - Refine your brand narrative or mission\n- **Update my tech stack** - Change your POS, reservation system, etc.\n\nJust let me know what you'd like to change, and I'll guide you to the right section!"
        }]);
        setIsTyping(false);
      }, 1200);
      
      return;
    }

    // Handle "I am here to..." prompt with thinking delay
    if (promptText === "I am here to...") {
      const userMessage: ChatMessage = { role: "user", content: promptText };
      setMessages((prev) => [...prev, userMessage]);
      setShowObjectives(false);
      setIsTyping(true);

      // Show thinking animation for 2500ms
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: "Don't overthink this...just tell me what you want. I am not a magician, I might not be able to do it but I can promise I'll try to be helpful and I won't waste your time!"
        }]);
        setIsTyping(false);
      }, 2500);
      
      return;
    }

    // Handle Strategy Session prompt with framework and interactive options
    if (promptText === "Strategy Session") {
      const userMessage: ChatMessage = { role: "user", content: promptText };
      setMessages((prev) => [...prev, userMessage]);
      setShowObjectives(false);
      setSelectedCoachingAreas([]);
      setIsTyping(true);

      // Mark conversation as coaching session
      if (currentConversationId) {
        await supabase
          .from('chat_conversations')
          .update({ 
            current_topic: 'coaching_session',
            intent_classification: 'seek_coaching',
            conversation_state: {
              coaching_mode: true,
              coaching_areas: []
            }
          })
          .eq('id', currentConversationId);

        setConversationState(prev => ({ 
          ...prev, 
          current_topic: 'coaching_session',
          intent_classification: 'seek_coaching',
          conversation_state: {
            ...prev.conversation_state,
            coaching_mode: true,
            coaching_areas: []
          }
        }));
      }

      // Show coaching framework message
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: "Hey! So when we're looking at using tech in the restaurant, I've found it usually comes down to one of four things: growing sales, cutting costs, making it a better place for guests to eat, or making it a better place for the team to work. If what you're working on doesn't fit into one of these buckets, you might honestly be better off just jumping into service and helping the team directly. But if it does fit - which of these areas are you focused on? Pick up to two."
        }]);
        setIsTyping(false);
        setShowCoachingOptions(true);
      }, 1200);
      
      return;
    }

    // Handle WWAHD prompt with specific two-part response
    if (promptText === "WWAHD?") {
      if (!hasCompletedKPIs) return;
      
      const userMessage: ChatMessage = { role: "user", content: promptText };
      setMessages((prev) => [...prev, userMessage]);
      setShowObjectives(false);
      setIsTyping(true);

      // Mark conversation as WWAHD mode
      if (currentConversationId) {
        await supabase
          .from('chat_conversations')
          .update({ 
            wwahd_mode: true,
            current_topic: 'wwahd_guidance',
            intent_classification: 'seek_guidance'
          })
          .eq('id', currentConversationId);

        setConversationState(prev => ({ 
          ...prev, 
          wwahd_mode: true,
          current_topic: 'wwahd_guidance',
          intent_classification: 'seek_guidance'
        }));
      }
      
      // First response
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: "First, how're the lighting and music level?...."
        }]);
        setIsTyping(false);
        
        // Immediate follow-up
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setMessages((prev) => [...prev, {
              role: "assistant",
              content: "Ok, what's the context for WWAHD and I'll do my best to channel him"
            }]);
            setIsTyping(false);
          }, 800);
        }, 1000);
      }, 600);
      return;
    }

    // Handle Tips for using Shyloh prompt with Socratic pro tip
    if (promptText === "Tips for using Shyloh") {
      const userMessage: ChatMessage = { role: "user", content: promptText };
      setMessages((prev) => [...prev, userMessage]);
      setShowObjectives(false);
      setIsTyping(true);

      setTimeout(() => {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `Here are some tips to get the most out of working with me:

**Pro tip:** I'm Socratic by default—I'll ask what *you* think first before jumping to answers. Builds your intuition over time. If you just want the answer, tell me to skip the questions.

**Quick Start Prompts:** Use the buttons above to jump into common workflows like Strategy Sessions or WWAHD guidance.

**Saved Prompts:** Access your custom prompt library in the right sidebar to save and reuse your best questions.

**Context Matters:** I have access to your KPIs, tools, and custom knowledge—the more you fill out, the better I can help.

**Be Specific:** Instead of "help with sales," try "what can I do this week to increase check averages by 10%?"

What would you like to work on today?`
        }]);
        setIsTyping(false);
      }, 1200);
      
      return;
    }
    
    setCurrentInput(promptText);
    // Auto-send the prompt
    setTimeout(() => {
      if (hasCompletedKPIs) {
        handleSendMessage(promptText);
      }
    }, 100);
  };

  const handleCoachingAreaToggle = (area: string) => {
    setSelectedCoachingAreas(prev => {
      if (prev.includes(area)) {
        return prev.filter(a => a !== area);
      } else if (prev.length < 2) {
        return [...prev, area];
      }
      return prev;
    });
  };

  const handleHardModeToggle = async (enabled: boolean) => {
    // Always update local state so the toggle feels responsive
    setHardModeEnabled(enabled);

    if (!currentConversationId) {
      // Defer persistence until a conversation exists
      toast.info(enabled ? "Hard Mode will apply to your next conversation" : "Hard Mode turned off");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ hard_mode_enabled: enabled })
        .eq('id', currentConversationId);
      
      if (error) throw error;
      
      toast.success(enabled ? "🔥 Hard Mode enabled - Using most powerful model" : "Hard Mode disabled");
    } catch (error) {
      console.error('Error toggling Hard Mode:', error);
      // Revert local state on failure
      setHardModeEnabled(!enabled);
      toast.error('Failed to update Hard Mode setting');
    }
  };

  const handleCoachingAreasSubmit = async () => {
    if (selectedCoachingAreas.length === 0) return;

    setShowCoachingOptions(false);
    
    // Add user message with selected areas
    const areasText = selectedCoachingAreas.join(" and ");
    const userMessage: ChatMessage = { 
      role: "user",
      content: `I'm focused on: ${areasText}` 
    };
    setMessages((prev) => [...prev, userMessage]);

    // Update conversation state with coaching areas
    if (currentConversationId) {
      await supabase
        .from('chat_conversations')
        .update({ 
          conversation_state: {
            coaching_mode: true,
            coaching_areas: selectedCoachingAreas
          }
        })
        .eq('id', currentConversationId);

      setConversationState(prev => ({ 
        ...prev, 
        conversation_state: {
          ...prev.conversation_state,
          coaching_mode: true,
          coaching_areas: selectedCoachingAreas
        }
      }));
    }

    // Continue conversation with AI
    setIsTyping(true);
    await handleSendMessage(`I'm focused on: ${areasText}`);
  };


  // Load conversations, files, and saved prompts on mount
  useEffect(() => {
    loadConversations();
    loadFiles();
    loadSavedPrompts();
  }, [id]);

  // One-time: auto-remove any stuck unprocessed upload for this restaurant
  useEffect(() => {
    if (!id || cleanupAttempted) return;
    setCleanupAttempted(true);
    deleteStuckFileIfAny();
  }, [id, cleanupAttempted]);

  // Show file notification only when files finish uploading (not on page load)
  useEffect(() => {
    if (files && files.length > 0 && uploadingFiles.length === 0 && showFileNotification) {
      const timer = setTimeout(() => {
        setShowFileNotification(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [files, uploadingFiles, showFileNotification]);

  // Load last message previews for conversations (mobile)
  useEffect(() => {
    const loadLastMessages = async () => {
      if (conversations.length === 0) {
        setLastMessagePreviews({});
        return;
      }
      
      const previews: Record<string, string> = {};
      for (const conv of conversations) {
        const { data } = await supabase
          .from('chat_messages')
          .select('content')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (data) {
          previews[conv.id] = data.content;
        }
      }
      setLastMessagePreviews(previews);
    };
    
    loadLastMessages();
  }, [conversations]);

  // Update document title with unread notification count
  useEffect(() => {
    if (!id || !user) return;

    const loadUnreadCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', id)
        .eq('is_read', false);
      
      const unreadCount = count || 0;
      setUnreadNotificationCount(unreadCount);
      
      // Update tab title
      if (unreadCount > 0) {
        document.title = `(${unreadCount}) ${data?.name || 'Restaurant'}`;
      } else {
        document.title = data?.name || 'Restaurant';
      }
    };

    loadUnreadCount();

    // Subscribe to notification changes
    const channel = supabase
      .channel('tab-title-notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `restaurant_id=eq.${id}`
      }, () => {
        loadUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      document.title = data?.name || 'Restaurant'; // Reset title on unmount
    };
  }, [id, user, data?.name]);

  // Check authentication and membership
  useEffect(() => {
    const checkMembership = async () => {
      if (!id) {
        navigate('/');
        return;
      }

      // Check authentication and membership first
      if (!authLoading && user) {
        try {
          const { data: memberData, error: memberError } = await supabase
            .from('restaurant_members')
            .select('id')
            .eq('restaurant_id', id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (memberError) console.error('Error checking membership:', memberError);
          
          setIsMember(!!memberData);

          // Check for pending claim
          const pendingClaim = sessionStorage.getItem('pending_claim');
          if (pendingClaim && !memberData) {
            const claimData = JSON.parse(pendingClaim);
            if (claimData.restaurant_id === id) {
              setShowClaimDialog(true);
            }
          }
        } catch (error) {
          console.error('Error checking membership:', error);
        }
      }
    };

    checkMembership();
  }, [id, navigate, user, authLoading]);

  // Resume incomplete tuning on page load
  useEffect(() => {
    if (data && hasCompletedKPIs) {
      const tuningCompleted = (data as any).tuning_completed;
      const hasTuningProfile = data.tuning_profile && Object.keys(data.tuning_profile).length > 0;
      
      // Check if tuning profile is actually incomplete (not all sliders filled)
      const requiredSliders = ['profit_motivation', 'service_philosophy', 'revenue_strategy', 
                               'market_position', 'team_philosophy', 'innovation_appetite'];
      const isTuningIncomplete = !requiredSliders.every(key => 
        data.tuning_profile?.[key] !== undefined && data.tuning_profile?.[key] !== null
      );
      
      // Only auto-resume if profile is genuinely incomplete AND flag is false
      if (hasTuningProfile && !tuningCompleted && isTuningIncomplete) {
        setShowTuningFlow(true);
        setOnboardingPhase('tuning');
        setQuickWinProgress(prev => ({
          ...prev,
          currentStep: 3,
          steps: prev.steps.map((step, idx) => ({
            ...step,
            completed: idx < 2,
            active: idx === 2
          }))
        }));
      }
    }
  }, [data, hasCompletedKPIs]);


  const handleClaimRestaurant = async () => {
    if (!id || !user || !claimPin.trim()) {
      toast.error("Please enter a PIN");
      return;
    }

    setClaiming(true);
    try {
      const { data, error } = await supabase.functions.invoke('claim-restaurant', {
        body: { restaurant_id: id, pin: claimPin }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        sessionStorage.removeItem('pending_claim');
        setShowClaimDialog(false);
        setClaimPin("");
        setIsMember(true);
      } else {
        throw new Error(data.error || 'Failed to claim restaurant');
      }
    } catch (error: any) {
      console.error('Claim error:', error);
      toast.error(error.message || 'Invalid PIN or failed to claim restaurant');
    } finally {
      setClaiming(false);
    }
  };


  // Validate manual KPI form
  const validateManualKPIs = () => {
    const errors: Record<string, string> = {};
    
    // Check required fields
    if (!manualKPIEntry.avg_weekly_sales || parseFloat(manualKPIEntry.avg_weekly_sales) <= 0) {
      errors.avg_weekly_sales = 'Required and must be greater than 0';
    }
    
    // Check percentages are 0-100
    const percentageFields = [
      'food_cost_goal', 
      'labor_cost_goal', 
      ...getSalesMixFieldKeys()
    ];
    
    percentageFields.forEach(field => {
      const value = parseFloat(manualKPIEntry[field as keyof typeof manualKPIEntry]);
      if (manualKPIEntry[field as keyof typeof manualKPIEntry] !== '' && (isNaN(value) || value < 0 || value > 100)) {
        errors[field] = 'Must be between 0 and 100';
      }
    });
    
    // Check sales mix totals 100%
    const salesMixFields = getSalesMixFieldKeys();
    const salesMixTotal = salesMixFields.reduce((sum, field) => {
      const value = parseFloat(manualKPIEntry[field as keyof typeof manualKPIEntry]) || 0;
      return sum + value;
    }, 0);
    
    if (Math.abs(salesMixTotal - 100) > 0.01) {
      errors.sales_mix_total = `Sales mix must total 100% (currently ${salesMixTotal.toFixed(1)}%)`;
    }
    
    return errors;
  };

  // Save manual KPI entry
  const handleSaveManualKPIs = async () => {
    const errors = validateManualKPIs();
    setKpiFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix validation errors");
      return;
    }
    
    setSavingManualKPIs(true);
    
    try {
      const { error } = await supabase
        .from("restaurant_kpis")
        .upsert({
          restaurant_id: id,
          avg_weekly_sales: parseFloat(manualKPIEntry.avg_weekly_sales),
          food_cost_goal: parseFloat(manualKPIEntry.food_cost_goal) || null,
          labor_cost_goal: parseFloat(manualKPIEntry.labor_cost_goal) || null,
          sales_mix_food: parseFloat(manualKPIEntry.sales_mix_food) || null,
          sales_mix_liquor: parseFloat(manualKPIEntry.sales_mix_liquor) || null,
          sales_mix_wine: parseFloat(manualKPIEntry.sales_mix_wine) || null,
          sales_mix_beer: parseFloat(manualKPIEntry.sales_mix_beer) || null,
          sales_mix_na_bev: parseFloat(manualKPIEntry.sales_mix_na_bev) || null,
        });
        
      if (error) throw error;
      
      toast.success("KPIs saved successfully!");
      
      // Refresh KPI data
      const { data: kpis, error: kpisError } = await supabase
        .from('restaurant_kpis')
        .select('*')
        .eq('restaurant_id', id)
        .maybeSingle();

      if (!kpisError && kpis) {
        setKPIData({
          avg_weekly_sales: kpis.avg_weekly_sales,
          food_cost_goal: kpis.food_cost_goal,
          labor_cost_goal: kpis.labor_cost_goal,
          sales_mix_food: kpis.sales_mix_food,
          sales_mix_liquor: kpis.sales_mix_liquor,
          sales_mix_wine: kpis.sales_mix_wine,
          sales_mix_beer: kpis.sales_mix_beer,
          sales_mix_na_bev: kpis.sales_mix_na_bev,
          sales_mix_retail: kpis.sales_mix_retail,
          sales_mix_room_fees: kpis.sales_mix_room_fees,
          sales_mix_other: kpis.sales_mix_other,
          sales_mix_other_label: kpis.sales_mix_other_label,
        });

        const allKPIsCompleted = Boolean(
          kpis.avg_weekly_sales &&
          kpis.food_cost_goal &&
          kpis.labor_cost_goal &&
          kpis.sales_mix_food !== null &&
          kpis.sales_mix_liquor !== null &&
          kpis.sales_mix_wine !== null &&
          kpis.sales_mix_beer !== null &&
          kpis.sales_mix_na_bev !== null
        );
        setHasCompletedKPIs(allKPIsCompleted);
      }
      
      // Clear form
      setManualKPIEntry({
        avg_weekly_sales: '',
        food_cost_goal: '',
        labor_cost_goal: '',
        sales_mix_food: '',
        sales_mix_liquor: '',
        sales_mix_wine: '',
        sales_mix_beer: '',
        sales_mix_na_bev: '',
        sales_mix_retail: '',
        sales_mix_room_fees: '',
        sales_mix_other: '',
        sales_mix_other_label: '',
      });
      setKpiFormErrors({});
      
    } catch (error) {
      console.error("Error saving KPIs:", error);
      toast.error("Failed to save KPIs");
    } finally {
      setSavingManualKPIs(false);
    }
  };

  // Handle KPI help flow
  const handleKPIHelp = () => {
    // Start a new conversation with KPI education focus
    handleNewConversation();
    
    // Add educational message to guide user through KPI setup
    setTimeout(() => {
      setMessages([{
        role: "assistant",
        content: "I'd love to help you understand and set up your KPIs! Let's walk through each one together. KPIs (Key Performance Indicators) are the numbers that tell you how your restaurant is actually performing.\n\nLet's start with the basics:\n\n**Average Weekly Sales** - This is simply how much revenue you bring in during a typical week. If you don't know exactly, think about a recent week that felt 'normal' - what did you do in sales?\n\n**Food Cost Goal** - This is the percentage of your sales that goes to food ingredients. Most full-service restaurants aim for 28-32%. If your menu items have higher ingredient costs (like a steakhouse), it might be higher.\n\n**Labor Cost Goal** - This is the percentage of sales spent on salaries and wages. Most restaurants target 28-32%, but this varies based on your service style.\n\n**Sales Mix** - This breaks down what percentage of your sales comes from each category. For example, if you do $10,000 in sales and $6,500 is food, that's 65% food.\n\nWhat would you like to explore first? We can work through calculating any of these together, or I can share industry benchmarks for your type of restaurant.",
        type: "question",
      }]);
    }, 100);
  };

  // Phase 1: The Hook - Auto-triggered messages for first-time users (only if tuning NOT completed)
  useEffect(() => {
    // Only trigger hook if:
    // 1. KPIs not completed
    // 2. Tuning not completed (NEW: don't re-trigger if tuning is done)
    // 3. No messages yet
    // 4. In hook phase
    // 5. Data loaded and user authenticated
    if (!hasCompletedKPIs && !data?.tuning_completed && messages.length === 0 && onboardingPhase === 'hook' && !loading && id && user?.id) {
      setIsTyping(true);
      
      // Initialize progress tracking
      setQuickWinProgress(prev => ({
        ...prev,
        currentStep: 1,
        steps: prev.steps.map((step, idx) => ({
          ...step,
          active: idx === 0,
          completed: false
        }))
      }));
      
      // Create conversation for onboarding
      const createOnboardingConversation = async () => {
        try {
          const { data: newConv, error: convError } = await supabase
            .from("chat_conversations")
            .insert({
              restaurant_id: id,
              title: "Getting Started with Shyloh",
              message_count: 0,
              created_by: user.id,
              visibility: 'private',
            })
            .select()
            .single();

          if (convError) throw convError;
          
          setCurrentConversationId(newConv.id);
          setCurrentConversationVisibility('private');

          // Add creator as participant (owner)
          await supabase
            .from("chat_conversation_participants")
            .insert({
              conversation_id: newConv.id,
              user_id: user.id,
              role: 'owner',
            });

          // Save messages as they're added
          const saveMessage = async (content: string, delay: number) => {
            return new Promise<void>((resolve) => {
              setTimeout(async () => {
                setMessages(prev => [...prev, { role: "assistant", content }]);
                
                await supabase.from("chat_messages").insert({
                  conversation_id: newConv.id,
                  role: 'assistant',
                  content,
                  user_id: null,
                  hard_mode_used: false,
                });
                
                // Increment message count
                const { data: currentConv } = await supabase
                  .from("chat_conversations")
                  .select('message_count')
                  .eq('id', newConv.id)
                  .single();
                
                if (currentConv) {
                  await supabase
                    .from("chat_conversations")
                    .update({ message_count: (currentConv.message_count || 0) + 1 })
                    .eq('id', newConv.id);
                }
                
                resolve();
              }, delay);
            });
          };

          // Message 1
          await saveMessage("Hey! We're the team behind Shy Bird—we run 3 restaurants in Boston. We built Shyloh because AI has helped us with stuff we never imagined.", 1000);
          
          // Message 2
          await saveMessage("Things like cutting brunch ticket times, rethinking sidework, lowering food cost. We want to share what we've learned to make running restaurants a little easier.", 2500);
          
          // Message 3
          await saveMessage("But first, we need to prove AI can actually help *you*. What's 1-2 things you're working on right now or that are stressing you out?", 2500);
          
          setOnboardingPhase('pain_point');
          setIsTyping(false);
          
          // Reload conversations to show in left nav
          loadConversations();
        } catch (error) {
          console.error('Error creating onboarding conversation:', error);
          setIsTyping(false);
        }
      };

      createOnboardingConversation();
    }
  }, [hasCompletedKPIs, messages.length, onboardingPhase, loading, id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load participants when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadCurrentConversationParticipants(currentConversationId);
    } else {
      setCurrentParticipants([]);
    }
  }, [currentConversationId]);

  // Reload files when conversation changes (for conversation-scoped files)
  useEffect(() => {
    setFilePanelOpen(false); // Close panel on conversation switch
    loadFiles();
  }, [currentConversationId]);


  useEffect(() => {
    if (sidebarOpen) {
      inputRef.current?.focus();
    }
  }, [messages, sidebarOpen]);


  const handleOnboardingMessage = async (messageText: string) => {
    if (!id || !data) return;

    const userMessage: ChatMessage = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setCurrentInput("");
    setIsTyping(true);

    // Step 1: Welcome - user responds to "Sound good?"
    if (onboardingStep === 1 && currentReggiDimension === 0) {
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `Perfect! Let's take 5 minutes to make sure I've got your profile dialed in correctly. I've broken your restaurant down into 6 dimensions—the DNA of your concept.`,
        }]);
        
        setTimeout(() => {
          // Show first REGGI dimension
          const firstDim = reggiDimensions[0];
          const description = data?.[firstDim.descKey] || 'No description available';
          
          setMessages((prev) => [...prev, {
            role: "assistant",
            content: `Let's start with **${firstDim.label}**:\n\n${description}\n\nDoes this look right? You can edit it in the **REGGI Codes** section on the right, or just type "looks good" to move to the next one.`,
          }]);
          
          setCurrentReggiDimension(0); // Mark that we've shown the first dimension
        }, 1200);
        
        setIsTyping(false);
      }, 800);
      return;
    }

    // Step 1 (continued): User reviews each REGGI dimension one at a time
    if (onboardingStep === 1 && currentReggiDimension < reggiDimensions.length) {
      const nextIndex = currentReggiDimension + 1;
      
      if (nextIndex < reggiDimensions.length) {
        // Show next REGGI dimension
        setTimeout(() => {
          const nextDim = reggiDimensions[nextIndex];
          const description = data?.[nextDim.descKey] || 'No description available';
          
          setMessages((prev) => [...prev, {
            role: "assistant",
            content: `Great! Next up: **${nextDim.label}**\n\n${description}\n\nDoes this capture it? Edit on the right or type "looks good" to continue.`,
          }]);
          
          setCurrentReggiDimension(nextIndex);
          setIsTyping(false);
        }, 800);
      } else {
        // Finished all REGGI dimensions, move to KPIs
        setTimeout(() => {
          setMessages((prev) => [...prev, {
            role: "assistant",
            content: `Perfect! ✅ Your concept profile is locked in. Now let's get into the numbers—this is where I can really help you operationally.`,
          }]);
          
          setTimeout(() => {
            setMessages((prev) => [...prev, {
              role: "assistant",
              content: `I need a few quick ops numbers. Let's start with your **average weekly sales** in dollars. Feel free to round!`,
            }]);
          }, 1000);
          
          setOnboardingStep(3);
          updateOnboardingProgress(3, true);
          setIsTyping(false);
        }, 800);
      }
      return;
    }

    // Step 3: KPI Collection - simplified version
    if (onboardingStep === 3) {
      // This is a simplified flow - in production you'd want the full KPIInput flow
      // For now, just acknowledge and move to tools
      setIsTyping(false);
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `Got it! For the full KPI setup, you can use the "Settings" section in the sidebar anytime.`,
        }]);
        
        setTimeout(() => {
          setMessages((prev) => [...prev, {
            role: "assistant",
            content: `Quick question—**what tools do you use to run the restaurant?**\n\nSpecifically:\n- 💳 **POS system** (e.g., Toast, Square, Clover)\n- 📅 **Reservation system** (e.g., Resy, OpenTable)\n- 💰 **Payroll** (e.g., Gusto, ADP)\n- 📊 **Accounting** (e.g., QuickBooks, Xero)\n\nJust tell me what you use, or type "skip" if you want to add these later!`,
          }]);
        }, 1200);
        
        setOnboardingStep(4);
        updateOnboardingProgress(4, true);
      }, 800);
      return;
    }

    // Step 4: Tools collection
    if (onboardingStep === 4) {
      setIsTyping(false);
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `Perfect! I've noted those tools. You can always update this in the **Tech Stack** section on the right.`,
        }]);
        
        setTimeout(() => {
          setMessages((prev) => [...prev, {
            role: "assistant",
            content: `You're dialed in! 🎉 One more thing to unlock my full potential—**real data**.\n\nI work way better when I have your actual numbers. Got any of these?\n- 📊 Sales reports (weekly/monthly)\n- ⏰ Labor/time entry reports\n- 🧾 Invoices or order guides\n- 📋 Menu pricing sheets\n- 📈 P&L statements\n\nYou can upload them now using the 📎 **paperclip icon** below, or just type "skip" to add them later. What works?`,
          }]);
        }, 1200);
        
        setOnboardingStep(5);
        updateOnboardingProgress(5, true);
      }, 800);
      return;
    }

    // Step 5: File upload prompt
    if (onboardingStep === 5) {
      setIsTyping(false);
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `No problem—you can upload files anytime using the 📎 icon. The more data I have, the sharper I get!`,
        }]);
        
        setTimeout(() => {
          setMessages((prev) => [...prev, {
            role: "assistant",
            content: `Last thing—got any house rules, policies, or quirks I should know about? Stuff like:\n- 'VIP guests get complimentary champagne'\n- 'Happy hour is 3-6pm Tuesday-Friday'\n- 'Our signature dish is the rotisserie chicken'\n\nYou can add these in **Custom Rules** on the right sidebar, or just type "skip" to add them later.`,
          }]);
        }, 1200);
        
        setOnboardingStep(6);
        updateOnboardingProgress(6, true);
      }, 800);
      return;
    }

    // Step 6: Custom knowledge intro
    if (onboardingStep === 6) {
      setIsTyping(false);
      
      // Complete onboarding
      setTimeout(async () => {
        const finalMessage = {
          role: "assistant" as const,
          content: `Alright, **${data.name}**—you're all set! ✅\n\nNow—what do you want to tackle first? I can help you:\n- 📊 **Check your settings** (KPIs vs. benchmarks)\n- 📈 **Increase sales**\n- 💰 **Lower costs**\n- ✨ **Improve guest experience**\n- 👥 **Improve team experience**\n\nOr just ask me anything—I'm here.`,
        };
        
        setMessages((prev) => [...prev, finalMessage]);
        
        setOnboardingStep(7);
        updateOnboardingProgress(7, true);
        setShowObjectives(true);
        
        // Create onboarding conversation record
        try {
          // Get session for proper user ID
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user?.id) {
            console.error('No session when saving onboarding conversation');
            setIsOnboarding(false);
            setOnboardingPhase('hook');
            return;
          }

          const conversationParams = {
            restaurant_id: id,
            title: "Getting Started with Shyloh",
            message_count: messages.length + 2,
            conversation_type: 'onboarding',
            created_by: session.user.id,
            visibility: 'private',
          };

          const { data: newConv, error } = await supabase
            .from("chat_conversations")
            .insert(conversationParams)
            .select()
            .single();

          if (error) throw error;

          // Add creator as participant (owner)
          await supabase
            .from("chat_conversation_participants")
            .insert({
              conversation_id: newConv.id,
              user_id: session.user.id,
              role: 'owner',
            });

          // Save all messages to this conversation including the final message
          const messagesToSave = [...messages, userMessage, finalMessage].map((msg, idx) => ({
            conversation_id: newConv.id,
            role: msg.role,
            content: msg.content,
            user_id: msg.role === 'user' ? user?.id : null,
            created_at: new Date(Date.now() + idx * 1000).toISOString(),
            hard_mode_used: false,
          }));

          await supabase.from("chat_messages").insert(messagesToSave);
          
          setCurrentConversationId(newConv.id);
          setCurrentConversationVisibility('private');
          loadConversations();
          
          // End onboarding - this allows normal chat to work
          setIsOnboarding(false);
          setOnboardingPhase('hook'); // Reset phase
        } catch (error) {
          console.error('Error saving onboarding conversation:', error);
          // Still end onboarding even if save fails so chat can work
          setIsOnboarding(false);
          setOnboardingPhase('hook');
        }
      }, 800);
      return;
    }

    setIsTyping(false);
  };

  const showNextReggiDimension = () => {
    if (!data) return;
    
    const dimensions = [
      { key: 'culinary', label: 'Culinary & Beverage', field: 'culinary_beverage_description' },
      { key: 'vibe', label: 'Vibe & Energy', field: 'vibe_energy_description' },
      { key: 'social', label: 'Social Context', field: 'social_context_description' },
      { key: 'time', label: 'Time & Occasion', field: 'time_occasion_description' },
      { key: 'operational', label: 'Operational Execution', field: 'operational_execution_description' },
      { key: 'hospitality', label: 'Hospitality Approach', field: 'hospitality_approach_description' },
    ];

    const dimension = dimensions[currentReggiDimension];
    const description = data[dimension.field] || 'Not yet defined';

    setMessages((prev) => [...prev, {
      role: "assistant",
      content: `Here's how I understand your **${dimension.label}**:\n\n*"${description}"*\n\nDoes that capture it? Type "looks good" to confirm, or tell me what to adjust.`,
    }]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentInput(value);
    
    // Check for @notion or /notion mentions
    const hasNotionMention = /@notion|\/notion/i.test(value);
    setNotionMentioned(hasNotionMention);
  };

  // Helper function to get consistent color for each user
  const getUserColor = (userId: string | null): { bg: string; border: string; avatar: string } | null => {
    if (!userId) return null;
    
    // Simple hash function to get consistent color
    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const colors = [
      { bg: 'bg-emerald-600', border: 'border-emerald-500', avatar: 'bg-emerald-500' },
      { bg: 'bg-teal-600', border: 'border-teal-500', avatar: 'bg-teal-500' },
      { bg: 'bg-cyan-600', border: 'border-cyan-500', avatar: 'bg-cyan-500' },
      { bg: 'bg-green-700', border: 'border-green-600', avatar: 'bg-green-600' },
      { bg: 'bg-lime-700', border: 'border-lime-600', avatar: 'bg-lime-600' },
      { bg: 'bg-blue-600', border: 'border-blue-500', avatar: 'bg-blue-500' }
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  const handleSendMessage = async (messageOverride?: string) => {
    const messageText = messageOverride || currentInput;
    if (!messageText.trim() || !id) return;

    // Route to onboarding handler if in onboarding mode
    if (isOnboarding) {
      return handleOnboardingMessage(messageText);
    }

    await sendMessageWithMode(messageText, hardModeEnabled);
  };

  const sendMessageWithMode = async (messageText: string, useHardMode: boolean) => {
    if (!messageText.trim() || !id) return;

    // PHASE 2: Capture pain point
    if (onboardingPhase === 'pain_point') {
      const userMessage: ChatMessage = { role: "user", content: messageText };
      setMessages((prev) => [...prev, userMessage]);
      setCurrentInput("");
      setIsTyping(true);
      
      setUserPainPoint(messageText);
      setOnboardingPhase('quick_win');
      setQuickWinExchangeCount(1);
      setQuickWinStartTime(Date.now()); // Start timer
      
      // Update progress
      setQuickWinProgress(prev => ({
        ...prev,
        currentStep: 1,
        steps: prev.steps.map((step, idx) => ({
          ...step,
          active: idx === 0,
          completed: false
        }))
      }));
      
      // Build REGGI summary for context (implicit use)
      const reggiSummary = [
        data?.culinary_beverage_description,
        data?.time_occasion_description,
        data?.operational_execution_description
      ].filter(Boolean).join(', ');
      
      try {
        // Get user's JWT for authentication
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-shyloh`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              messages: [...messages, userMessage],
              restaurantData: data,
              kpiData: kpiData,
              restaurantId: id,
              conversationId: currentConversationId,
              onboarding_mode: 'quick_win',
              pain_point: messageText,
              reggi_summary: reggiSummary,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error || `AI request failed with status ${response.status}`;
          console.error('AI Error:', errorMsg, errorData);
          
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again in a moment.');
          } else if (response.status === 402) {
            throw new Error('Payment required. Please add credits to your workspace.');
          }
          
          throw new Error(errorMsg);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let assistantMessage = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          assistantMessage += chunk;

          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.role === 'assistant') {
              return [...prev.slice(0, -1), { ...lastMsg, content: assistantMessage }];
            }
            return [...prev, { role: 'assistant', content: assistantMessage }];
          });
        }
      } catch (error) {
        console.error('Error in Quick Win phase:', error);
        toast.error('Something went wrong. Please try again.');
      } finally {
        setIsTyping(false);
      }
      return;
    }

    // PHASE 3: Quick Win conversation (3-4 exchanges)
    if (onboardingPhase === 'quick_win') {
      const userMessage: ChatMessage = { role: "user", content: messageText };
      setMessages((prev) => [...prev, userMessage]);
      setCurrentInput("");
      setIsTyping(true);
      
      setQuickWinExchangeCount(prev => prev + 1);
      
      // Build REGGI summary
      const reggiSummary = [
        data?.culinary_beverage_description,
        data?.time_occasion_description,
        data?.operational_execution_description
      ].filter(Boolean).join(', ');
      
      try {
        // Get user's JWT for authentication
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-shyloh`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              messages: [...messages, userMessage],
              restaurantData: data,
              kpiData: kpiData,
              restaurantId: id,
              conversationId: currentConversationId,
              onboarding_mode: 'quick_win',
              pain_point: userPainPoint,
              reggi_summary: reggiSummary,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error || `AI request failed with status ${response.status}`;
          console.error('AI Error:', errorMsg, errorData);
          
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again in a moment.');
          } else if (response.status === 402) {
            throw new Error('Payment required. Please add credits to your workspace.');
          }
          
          throw new Error(errorMsg);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let assistantMessage = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          assistantMessage += chunk;

          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.role === 'assistant') {
              return [...prev.slice(0, -1), { ...lastMsg, content: assistantMessage }];
            }
            return [...prev, { role: 'assistant', content: assistantMessage }];
          });
        }

        // Check if we should transition to tuning (time limit or exchange count)
        const elapsedMinutes = quickWinStartTime ? (Date.now() - quickWinStartTime) / 60000 : 0;
        const shouldTransition = quickWinExchangeCount >= 3 || elapsedMinutes >= 2;
        
        // Only transition to setup when the user explicitly asks OR we've hit limits
        const setupSignals = /\b(set ?up|setup|walk.?through|configure|onboarding|start (setup|onboarding)|get me set up|let'?s (do|start)|yes.*(setup|walk)|sure.*(setup|walk)|ok.*(setup|walk))\b/i.test(messageText);
        
        if (setupSignals || shouldTransition) {
          setTimeout(() => {
            // Mark Quick Win complete, activate tuning intro
            setQuickWinProgress(prev => ({
              ...prev,
              currentStep: 2,
              steps: prev.steps.map((step, idx) => ({
                ...step,
                completed: idx === 0,
                active: idx === 1
              }))
            }));
            
            setMessages(prev => [...prev, {
              role: "assistant",
              content: "Great! Now, before we dive into the numbers, I need to understand YOUR philosophy for running this place. This 2-minute tuning exercise is how I learn what matters to YOU.",
            }]);
            
            setTimeout(() => {
              setShowTuningFlow(true);
              setOnboardingPhase('tuning');
            }, 1000);
          }, 500);
        }
      } catch (error) {
        console.error('Error in Quick Win conversation:', error);
        toast.error('Something went wrong. Please try again.');
      } finally {
        setIsTyping(false);
      }
      return;
    }

    // PHASE 4: Data collection phase (now called from tuning completion)
    if (onboardingPhase === 'data_collection') {
      // Import KPIInput dynamically if not already imported
      // The data_collection phase will now be triggered by tuning completion
      // We don't transition to old onboarding, but show KPI collection
      return;
    }

    // Hide objectives when sending a message
    setShowObjectives(false);

    // Detect AI mention to route message appropriately
    const mentionsAI = /@shyloh|@ai|\/ask|\/shyloh/i.test(messageText);
    
    // Check if message starts with a mention to someone other than Shyloh
    const startsWithUserMention = /^@(?!shyloh|ai)\w+/i.test(messageText.trim());
    
    // Get fresh participant data from database to avoid stale state
    const freshParticipants = currentConversationId 
      ? await loadCurrentConversationParticipants(currentConversationId)
      : [];
    
    // Check if this is a private 1-on-1 conversation (just user and Shyloh)
    const isPrivateOneOnOne = currentConversationVisibility === 'private' && 
                              (freshParticipants || []).length === 1 && 
                              (freshParticipants || [])[0]?.user_id === user?.id;
    
    // Auto-route to Shyloh if:
    // 1. User explicitly mentions @shyloh, OR
    // 2. It's a private 1-on-1 conversation (just user and Shyloh - no others involved)
    const shouldRouteToAI = mentionsAI || isPrivateOneOnOne;
    
    // Detect Notion mention and strip it from the message
    const mentionedNotion = /@notion|\/notion/i.test(messageText);
    const useNotion = mentionedNotion || notionEnabled; // Use if mentioned OR conversation has it enabled
    const cleanedMessage = messageText.replace(/@notion|\/notion/gi, '').trim();
    
    // If not routing to AI, send as human-to-human message
    if (!shouldRouteToAI) {
      const userMessage: ChatMessage = { role: "user", content: messageText };
      setMessages((prev) => [...prev, userMessage]);
      setCurrentInput("");
      setNotionMentioned(false);

      try {
        // Create or update conversation
        let convId = currentConversationId;
        
        if (!convId) {
          // Verify session before creating conversation
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user?.id) {
            toast.error("Your session expired. Please refresh the page.");
            return;
          }
          
          const conversationParams = {
            restaurant_id: id,
            title: messageText.substring(0, 50) + (messageText.length > 50 ? "..." : ""),
            message_count: 1,
            created_by: session.user.id,
            visibility: currentConversationVisibility || 'private',
          };
          
          // Create new conversation
          const { data: newConv, error: convError } = await supabase
            .from("chat_conversations")
            .insert(conversationParams)
            .select()
            .single();

          if (convError) {
            console.error('Conversation creation error:', convError);
            toast.error(`Failed to create conversation: ${convError.message}`);
            throw convError;
          }
          convId = newConv.id;
          setCurrentConversationId(convId);

          // Add creator as participant (owner)
          const { error: participantError } = await supabase
            .from("chat_conversation_participants")
            .insert({
              conversation_id: newConv.id,
              user_id: session.user.id,
              role: 'owner',
            });

          if (participantError) {
            console.error('Participant insertion error:', participantError);
            toast.error(`Failed to add participant: ${participantError.message}`);
          }
        } else {
          // Verify user can access this conversation (participant OR team member for team conversations)
          if (user?.id) {
            const { data: conversation } = await supabase
              .from('chat_conversations')
              .select('visibility')
              .eq('id', convId)
              .single();

            const { data: existingParticipant } = await supabase
              .from('chat_conversation_participants')
              .select('id')
              .eq('conversation_id', convId)
              .eq('user_id', user.id)
              .maybeSingle();

            const canAccess = existingParticipant || (conversation?.visibility === 'team');

            if (!canAccess) {
              throw new Error("You don't have access to this conversation");
            }
          }
        }

        // Debug: Check auth state and token
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('🔍 Auth Debug Before Message Insert:', {
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
          userEmail: currentSession?.user?.email,
          reactUserId: user?.id,
          reactUserEmail: user?.email,
          match: currentSession?.user?.id === user?.id,
          accessToken: currentSession?.access_token?.substring(0, 20) + '...',
          expiresAt: currentSession?.expires_at,
          tokenExpired: currentSession?.expires_at ? currentSession.expires_at < Date.now() / 1000 : 'unknown'
        });

        // Test database auth context by calling a simple function
        const { data: authTest, error: authTestError } = await supabase.rpc('is_super_admin', { _user_id: user?.id });
        console.log('🔍 Database Auth Context Test:', {
          isSuperAdmin: authTest,
          error: authTestError,
          note: 'This calls a function that uses auth.uid() to check if you are eli@shybird.com'
        });

        // Save user message
        const { data: insertedMessage } = await supabase
          .from("chat_messages")
          .insert({
            conversation_id: convId,
            role: "user",
            content: messageText,
            user_id: user?.id,
          })
          .select()
          .single();

        // Process mentions asynchronously (exclude system mentions like @shyloh and @notion)
        if (insertedMessage) {
          // Filter out system mentions before processing user mentions
          const contentForMentions = messageText.replace(/@shyloh|@ai|\/ask|\/shyloh|@notion|\/notion/gi, '');
          
          // Only process if there are remaining @ mentions (actual user mentions)
          if (contentForMentions.includes('@')) {
            supabase.functions.invoke('process-mentions', {
              body: {
                messageId: insertedMessage.id,
                content: contentForMentions,
                conversationId: convId,
                restaurantId: id,
                senderId: user?.id
              }
            }).then(({ data, error }) => {
              if (error) {
                console.error('Error processing mentions:', error);
              } else {
                console.log('Mentions processed:', data);
                
                if (data?.mentionsFound > 0 && data?.notificationsCreated === 0) {
                  toast.error("We couldn't notify anyone. Try selecting from the @mention picker.");
                } else if (data?.unmatchedMentions && data.unmatchedMentions.length > 0) {
                  const unmatchedList = data.unmatchedMentions.map((m: string) => `@${m}`).join(', ');
                  toast.warning(`Some mentions weren't delivered: ${unmatchedList}. Try selecting from the picker or type more of the name.`);
                }
              }
            });
          }
        }

        // Update conversation metadata
        await supabase
          .from("chat_conversations")
          .update({
            message_count: (await supabase
              .from("chat_messages")
              .select("id", { count: 'exact', head: true })
              .eq("conversation_id", convId)).count || 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", convId);

      } catch (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
      }
      
      return; // Exit early - no AI call
    }

    const userMessage: ChatMessage = { role: "user", content: cleanedMessage };
    setMessages((prev) => [...prev, userMessage]);
    setCurrentInput("");
    setNotionMentioned(false);
    setIsTyping(true);

    try {
      // Create or update conversation
      let convId = currentConversationId;
      
      if (!convId) {
        // Verify session before creating conversation
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          toast.error("Your session expired. Please refresh the page.");
          return;
        }
        
        // Get current auth user for comparison
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        const insertParams = {
          restaurant_id: id,
          title: messageText.substring(0, 50) + (messageText.length > 50 ? "..." : ""),
          message_count: 1,
          created_by: session.user.id,
          visibility: 'private',
        };
        
        // Create new conversation via edge function
        const { data, error: convError } = await supabase.functions.invoke('create-conversation', {
          body: {
            restaurant_id: id,
            title: messageText.substring(0, 50) + (messageText.length > 50 ? "..." : ""),
            visibility: 'private',
          }
        });

        if (convError || !data?.conversation) {
          console.error('Conversation creation error:', convError);
          toast.error(`Failed to create conversation: ${convError?.message || 'Unknown error'}`);
          throw convError || new Error('Failed to create conversation');
        }
        
        convId = data.conversation.id;
        setCurrentConversationId(convId);
        setCurrentConversationVisibility('private');
      } else {
        // Verify user can access this conversation (participant OR team member for team conversations)
        if (user?.id) {
          const { data: conversation } = await supabase
            .from('chat_conversations')
            .select('visibility')
            .eq('id', convId)
            .single();

          const { data: existingParticipant } = await supabase
            .from('chat_conversation_participants')
            .select('id')
            .eq('conversation_id', convId)
            .eq('user_id', user.id)
            .maybeSingle();

          const canAccess = existingParticipant || (conversation?.visibility === 'team');

          if (!canAccess) {
            throw new Error("You don't have access to this conversation");
          }
        }
      }

      // Save user message
      const { data: insertedMessage } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: convId,
          role: "user",
          content: messageText,
          user_id: user?.id,
        })
        .select()
        .single();

      // Process mentions asynchronously (exclude system mentions like @shyloh and @notion)
      if (insertedMessage) {
        // Filter out system mentions before processing user mentions
        const contentForMentions = messageText.replace(/@shyloh|@ai|\/ask|\/shyloh|@notion|\/notion/gi, '');
        
        // Only process if there are remaining @ mentions (actual user mentions)
        if (contentForMentions.includes('@')) {
          supabase.functions.invoke('process-mentions', {
            body: {
              messageId: insertedMessage.id,
              content: contentForMentions,
              conversationId: convId,
              restaurantId: id,
              senderId: user?.id
            }
          }).then(({ data, error }) => {
            if (error) {
              console.error('Error processing mentions:', error);
            } else {
              console.log('Mentions processed:', data);
              
              // Show feedback if mentions didn't resolve
              if (data?.mentionsFound > 0 && data?.notificationsCreated === 0) {
                toast.error("We couldn't notify anyone. Try selecting from the @mention picker.");
              } else if (data?.unmatchedMentions && data.unmatchedMentions.length > 0) {
                const unmatchedList = data.unmatchedMentions.map((m: string) => `@${m}`).join(', ');
                toast.warning(`Some mentions weren't delivered: ${unmatchedList}. Try selecting from the picker or type more of the name.`);
              }
            }
          });
        }
      }

      // Get user's JWT for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-shyloh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            restaurantData: data,
            kpiData: kpiData,
            restaurantId: id,
            useNotion: useNotion,
            hardMode: useHardMode,
            conversationId: convId,
            tuningProfile: data?.tuning_profile,
            debugMode: showDebugInfo,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `AI request failed with status ${response.status}`;
        console.error('AI Error:', errorMsg, errorData);
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (response.status === 402) {
          throw new Error('Payment required. Please add credits to your workspace.');
        }
        
        throw new Error(errorMsg);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream');
      }

      const decoder = new TextDecoder();
      let assistantMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantMessage += chunk;

        // Check if this is a debug response
        if (showDebugInfo && assistantMessage.includes('__DEBUG_START__')) {
          const debugStart = assistantMessage.indexOf('__DEBUG_START__') + 15;
          const debugEnd = assistantMessage.indexOf('__DEBUG_END__');
          
          if (debugEnd !== -1) {
            const debugJson = assistantMessage.substring(debugStart, debugEnd);
            const debugData = JSON.parse(debugJson);
            setDebugInfo(debugData);
            setIsTyping(false);
            
            // Add a debug info message to the chat
            const debugMsg = {
              role: 'assistant' as const,
              content: '**DEBUG MODE ENABLED**\n\nDebug information captured. Check the debug panel above for full details.'
            };
            setMessages((prev) => [...prev, debugMsg]);
            return;
          }
        }

        // Update the last message or add new assistant message (only if not in debug mode)
        if (!showDebugInfo) {
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.role === 'assistant') {
              return [...prev.slice(0, -1), { ...lastMsg, content: assistantMessage }];
            }
            return [...prev, { role: 'assistant', content: assistantMessage }];
          });
        }
      }

      // Save assistant message
      if (assistantMessage && convId) {
        // Socratic pro tip constant
        const SOCRATIC_PRO_TIP = "\n\n**Quick reminder:** I'm Socratic by default—I'll ask what *you* think first before jumping to answers. Builds your intuition over time. If you just want the answer, tell me to skip the questions.";
        
        let finalContent = assistantMessage;
        
        // 5-10% chance (7.5%) to append Socratic reminder
        const shouldShowTip = Math.random() < 0.075;
        
        if (shouldShowTip) {
          // Check conversation metadata to ensure we haven't shown it too recently
          const { data: convData } = await supabase
            .from('chat_conversations')
            .select('conversation_state')
            .eq('id', convId)
            .single();
          
          const lastTipIndex = convData?.conversation_state?.last_socratic_tip_index || 0;
          const messagesSinceLastTip = messages.length - lastTipIndex;
          
          // Only show if at least 10 messages have passed
          if (messagesSinceLastTip >= 10) {
            finalContent += SOCRATIC_PRO_TIP;
            
            // Update conversation state to track when we last showed it
            await supabase
              .from('chat_conversations')
              .update({
                conversation_state: {
                  ...convData?.conversation_state,
                  last_socratic_tip_index: messages.length + 1
                }
              })
              .eq('id', convId);
            
            // Update the displayed message with the tip
            setMessages((prev) => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg?.role === 'assistant') {
                return [...prev.slice(0, -1), { ...lastMsg, content: finalContent }];
              }
              return prev;
            });
          }
        }
        
        await supabase.from("chat_messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: finalContent,
          user_id: null, // Assistant messages have no user_id
          hard_mode_used: useHardMode,
        });

        // Track Hard Mode usage if enabled
        if (useHardMode && convId) {
          try {
            await supabase.from('chat_hard_mode_usage').insert({
              conversation_id: convId,
              restaurant_id: id,
              user_id: user?.id,
              model_used: 'claude-opus-4-1-20250805',
              tokens_used: null, // We don't have token count on frontend
            });
            console.log('✅ Hard Mode usage tracked');
          } catch (error) {
            console.error('❌ Error tracking Hard Mode usage:', error);
          }
        }

        // Update conversation message count and updated_at
        await supabase
          .from("chat_conversations")
          .update({
            message_count: messages.length + 2, // +2 for user and assistant messages
            updated_at: new Date().toISOString(),
          })
          .eq("id", convId);

        loadConversations();
        
        // KPI Nudge: Every 25 messages if KPIs incomplete
        if (!hasCompletedKPIs && data?.tuning_completed) {
          const totalMessages = messages.length + 2; // +2 for current user + AI messages
          
          if (totalMessages % 25 === 0) {
            const nudgeMessages = [
              "By the way, I'd be much more helpful if you completed your KPIs. Things like your average weekly sales, food cost goal, and labor cost goal help me give you better recommendations. Want to set those up now?",
              "Quick reminder: Completing your restaurant settings (like sales targets and cost goals) will unlock more personalized insights. It only takes a minute! Should we do that?",
              "I notice you haven't filled in your KPIs yet. Knowing your food cost goal, labor target, and average sales helps me provide much more relevant advice. Ready to add those?"
            ];
            
            const randomNudge = nudgeMessages[Math.floor(Math.random() * nudgeMessages.length)];
            
            // Delay nudge slightly after AI response
            setTimeout(() => {
              setMessages((prev) => [...prev, {
                role: "assistant",
                content: randomNudge
              }]);
              
              // Save nudge to database
              supabase.from("chat_messages").insert({
                conversation_id: convId,
                role: "assistant",
                content: randomNudge,
                user_id: null,
                hard_mode_used: false,
              });
            }, 2000);
          }
        }
        
        // Balance Reminder: Don't let tech tools take too much attention (every 75 messages)
        if (data?.tuning_completed) {
          const totalMessages = messages.length + 2; // +2 for current user + AI messages
          
          if (totalMessages % 75 === 0) {
            const balanceReminder = "Hey! Before we dive into anything- quick reminder: Tech tools like Shyloh have their place but ultimately it's what's happening in the restaurant that really matters. We all need to recognize these tools can easily take too much of our time and attention- including the tools themselves. Gut check for both of us- is this a good time to be mentally out of service?";
            
            // Delay reminder slightly after AI response
            setTimeout(() => {
              setMessages((prev) => [...prev, {
                role: "assistant",
                content: balanceReminder
              }]);
              
              // Save reminder to database
              supabase.from("chat_messages").insert({
                conversation_id: convId,
                role: "assistant",
                content: balanceReminder,
                user_id: null,
                hard_mode_used: false,
              });
            }, 2500); // Slightly longer delay than KPI nudge
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response from AI');
    } finally {
      setIsTyping(false);
    }
  };

  const handleEdit = (fieldName: string, currentValue: string) => {
    setEditingField(fieldName);
    setEditValue(currentValue);
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleSave = async (fieldName: string) => {
    if (!data) return;

    if (!editValue.trim()) {
      toast.error("Description cannot be empty");
      return;
    }

    if (editValue.length > 2000) {
      toast.error("Description must be less than 2000 characters");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ [fieldName]: editValue.trim() })
        .eq('id', data.id);

      if (error) throw error;

      toast.success("Changes saved successfully");
      setData({ ...data, [fieldName]: editValue.trim() });
      setEditingField(null);
      setEditValue("");
    } catch (error) {
      console.error('Error saving:', error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleEditReggi = (field: string, currentValue: string) => {
    setEditingReggi(field);
    setReggiEditValue(currentValue);
  };

  const handleCancelReggi = () => {
    setEditingReggi(null);
    setReggiEditValue("");
  };

  const handleSaveReggi = async () => {
    if (!editingReggi || !data) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ [editingReggi]: reggiEditValue.trim() })
        .eq('id', data.id);

      if (error) throw error;

      toast.success("REGGI dimension updated");
      setData({ ...data, [editingReggi]: reggiEditValue.trim() });
      setEditingReggi(null);
      setReggiEditValue("");
    } catch (error) {
      console.error('Error updating REGGI:', error);
      toast.error("Failed to update REGGI dimension");
    } finally {
      setSaving(false);
    }
  };

  const handleEditKPI = (kpiName: string, currentValue: number | null) => {
    setEditingKPI(kpiName);
    setKpiEditValue(currentValue?.toString() || "");
  };

  const handleCancelKPI = () => {
    setEditingKPI(null);
    setKpiEditValue("");
  };

  const handleSaveKPI = async (kpiName: string) => {
    if (!data) return;

    const numValue = parseFloat(kpiEditValue);
    if (isNaN(numValue)) {
      toast.error("Please enter a valid number");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('restaurant_kpis')
        .update({ [kpiName]: numValue })
        .eq('restaurant_id', data.id);

      if (error) throw error;

      toast.success("KPI updated successfully");
      setKPIData({ ...kpiData, [kpiName]: numValue });
      setEditingKPI(null);
      setKpiEditValue("");
    } catch (error) {
      console.error('Error saving KPI:', error);
      toast.error("Failed to save KPI");
    } finally {
      setSaving(false);
    }
  };

  const handleEditTool = (toolName: string, currentValue: string | null) => {
    setEditingTool(toolName);
    setToolEditValue(currentValue || "");
  };

  const handleCancelTool = () => {
    setEditingTool(null);
    setToolEditValue("");
  };

  const handleSaveTool = async (toolName: string) => {
    if (!data) return;

    const value = toolEditValue.trim();

    setSaving(true);
    try {
      // Check if tools record exists
      const { data: existingTools } = await supabase
        .from('restaurant_tools')
        .select('id')
        .eq('restaurant_id', data.id)
        .maybeSingle();

      if (existingTools) {
        // Update existing
        const { error } = await supabase
          .from('restaurant_tools')
          .update({ [toolName]: value || null })
          .eq('restaurant_id', data.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('restaurant_tools')
          .insert({
            restaurant_id: data.id,
            [toolName]: value || null,
          });

        if (error) throw error;
      }

      toast.success("Tool updated successfully");
      setToolsData({ ...toolsData, [toolName]: value || null });
      setEditingTool(null);
      setToolEditValue("");
    } catch (error) {
      console.error('Error saving tool:', error);
      toast.error("Failed to save tool");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveKnowledge = async () => {
    if (!id) return;

    if (!knowledgeForm.title.trim() || !knowledgeForm.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setSaving(true);
    try {
      if (editingKnowledge) {
        // Update existing
        const { error } = await supabase
          .from("restaurant_custom_knowledge")
          .update({
            title: knowledgeForm.title.trim(),
            content: knowledgeForm.content.trim(),
            category: knowledgeForm.category.trim() || null,
          })
          .eq("id", editingKnowledge);

        if (error) throw error;
        toast.success("Rule updated successfully");
      } else {
        // Create new
        const { error } = await supabase
          .from("restaurant_custom_knowledge")
          .insert({
            restaurant_id: id,
            title: knowledgeForm.title.trim(),
            content: knowledgeForm.content.trim(),
            category: knowledgeForm.category.trim() || null,
            is_active: true,
          });

        if (error) throw error;
        toast.success("Rule added successfully");
      }

      setKnowledgeForm({ title: "", content: "", category: "" });
      setShowAddKnowledge(false);
      setEditingKnowledge(null);
      loadCustomKnowledge();
    } catch (error) {
      console.error("Error saving knowledge:", error);
      toast.error("Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  const handleEditKnowledge = (knowledge: any) => {
    setKnowledgeForm({
      title: knowledge.title,
      content: knowledge.content,
      category: knowledge.category || "",
    });
    setEditingKnowledge(knowledge.id);
    setShowAddKnowledge(true);
  };

  const handleDeleteKnowledge = async (knowledgeId: string) => {
    try {
      const { error } = await supabase
        .from("restaurant_custom_knowledge")
        .delete()
        .eq("id", knowledgeId);

      if (error) throw error;

      toast.success("Rule deleted");
      loadCustomKnowledge();
    } catch (error) {
      console.error("Error deleting knowledge:", error);
      toast.error("Failed to delete rule");
    }
  };

  const handleToggleKnowledge = async (knowledgeId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("restaurant_custom_knowledge")
        .update({ is_active: !currentState })
        .eq("id", knowledgeId);

      if (error) throw error;

      toast.success(currentState ? "Rule deactivated" : "Rule activated");
      loadCustomKnowledge();
    } catch (error) {
      console.error("Error toggling knowledge:", error);
      toast.error("Failed to update rule");
    }
  };

  const handleCancelKnowledge = () => {
    setShowAddKnowledge(false);
    setEditingKnowledge(null);
    setKnowledgeForm({ title: "", content: "", category: "" });
  };

  // Prompt Library handlers
  const handleSavePrompt = async () => {
    if (!id) return;

    if (!promptForm.prompt_text.trim()) {
      toast.error("Prompt text is required");
      return;
    }

    setSaving(true);
    try {
      if (editingPrompt) {
        // Update existing
        const { error } = await supabase
          .from("restaurant_saved_prompts")
          .update({
            title: promptForm.title.trim() || null,
            prompt_text: promptForm.prompt_text.trim(),
            category: promptForm.category.trim() || null,
          })
          .eq("id", editingPrompt);

        if (error) throw error;
        toast.success("Prompt updated");
      } else {
        // Create new (always restaurant-specific, never global)
        const { error } = await supabase
          .from("restaurant_saved_prompts")
          .insert({
            restaurant_id: id,
            title: promptForm.title.trim() || null,
            prompt_text: promptForm.prompt_text.trim(),
            category: promptForm.category.trim() || null,
            is_global: false, // Always create restaurant-specific prompts
          });

        if (error) throw error;
        toast.success("Prompt saved");
      }

      setPromptForm({ title: "", prompt_text: "", category: "" });
      setShowAddPrompt(false);
      setEditingPrompt(null);
      loadSavedPrompts();
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast.error("Failed to save prompt");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    try {
      const { error } = await supabase
        .from("restaurant_saved_prompts")
        .delete()
        .eq("id", promptId);

      if (error) throw error;

      toast.success("Prompt deleted");
      loadSavedPrompts();
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast.error("Failed to delete prompt");
    }
  };

  const handleEditPrompt = (prompt: any) => {
    setPromptForm({
      title: prompt.title || "",
      prompt_text: prompt.prompt_text,
      category: prompt.category || "",
    });
    setEditingPrompt(prompt.id);
    setShowAddPrompt(true);
  };

  const handleCopyPromptToInput = (promptText: string) => {
    setCurrentInput(promptText);
    inputRef.current?.focus();
    toast.success("Prompt copied to input");
  };

  const handleCancelPrompt = () => {
    setShowAddPrompt(false);
    setEditingPrompt(null);
    setPromptForm({ title: "", prompt_text: "", category: "" });
  };

  const handlePinSubmit = async (pin: string) => {
    if (!id) return;

    setPinLoading(true);
    try {
      if (pinMode === "set") {
        // Set new PIN
        const { error } = await supabase
          .from("restaurants")
          .update({ tuning_pin: pin })
          .eq("id", id);

        if (error) throw error;

        setData(prev => prev ? { ...prev, tuning_pin: pin } : null);
        toast.success("PIN set successfully!");
        setPinDialogOpen(false);
        setTuningSheetOpen(true);
      } else {
        // Verify PIN
        if (data?.tuning_pin === pin) {
          toast.success("PIN verified!");
          setPinDialogOpen(false);
          setTuningSheetOpen(true);
        } else {
          toast.error("Incorrect PIN");
        }
      }
    } catch (error) {
      console.error("Error with PIN:", error);
      toast.error("Failed to process PIN");
    } finally {
      setPinLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const dimensions = [
    {
      title: "Culinary & Beverage",
      code: data.culinary_beverage_code,
      description: data.culinary_beverage_description,
    },
    {
      title: "Vibe & Energy",
      code: data.vibe_energy_code,
      description: data.vibe_energy_description,
    },
    {
      title: "Social Context",
      code: data.social_context_code,
      description: data.social_context_description,
    },
    {
      title: "Time & Occasion",
      code: data.time_occasion_code,
      description: data.time_occasion_description,
    },
    {
      title: "Operational Execution",
      code: data.operational_execution_code,
      description: data.operational_execution_description,
    },
    {
      title: "Hospitality Approach",
      code: data.hospitality_approach_code,
      description: data.hospitality_approach_description,
    },
  ];

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col">
        <MobileHeader
          restaurantName={data?.name || 'Restaurant'}
          location={data?.location}
          onLogout={signOut}
          showMenuButton={mobileTab === 'chat' && !showConversationThread}
          onMenuClick={() => setNavigationMenuOpen(true)}
          title={
            mobileTab === 'chat' && showConversationThread && currentConversationId 
              ? conversations.find(c => c.id === currentConversationId)?.title 
              : mobileTab === 'chat' && showConversationThread
              ? 'New Chat'
              : mobileTab === 'chat'
              ? currentNavSection === 'agents'
                ? 'Agents'
                : currentNavSection === 'tasks'
                ? 'Tasks'
                : currentNavSection === 'manager-log'
                ? 'Manager Log'
                : 'Chats'
              : undefined
          }
          showBackButton={mobileTab === 'chat' && showConversationThread}
          onBackClick={() => setShowConversationThread(false)}
        />
        
        <div className="flex-1 min-h-0 overflow-hidden pb-[calc(env(safe-area-inset-bottom)+64px)] mobile-tab-transition">
          {mobileTab === 'voice' && (
            <div className="h-full bg-background flex flex-col items-center p-6">
              <VoiceCapture 
                restaurantId={id || ""}
                shiftDate={format(new Date(), 'yyyy-MM-dd')}
                shiftType="dinner"
                isMobile={true}
              />
            </div>
          )}
          
          {mobileTab === 'chat' && (
            <div className="h-full flex flex-col bg-background">
              {currentNavSection === 'agents' && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <Bot className="h-16 w-16 text-muted-foreground mb-6" />
                  <h2 className="text-2xl font-semibold mb-3">Agents</h2>
                  <p className="text-muted-foreground max-w-sm">
                    AI agents feature coming soon. Create specialized agents to help with specific restaurant tasks.
                  </p>
                </div>
              )}
              
              {currentNavSection === 'tasks' && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <CheckSquare className="h-16 w-16 text-muted-foreground mb-6" />
                  <h2 className="text-2xl font-semibold mb-3">Tasks</h2>
                  <p className="text-muted-foreground max-w-sm">
                    Task management feature coming soon. Create, assign, and track tasks for your team.
                  </p>
                </div>
              )}
              
              {currentNavSection === 'manager-log' && (
                <div className="h-full bg-background flex flex-col items-center p-6">
                  <VoiceCapture 
                    restaurantId={id || ""}
                    shiftDate={format(new Date(), 'yyyy-MM-dd')}
                    shiftType="dinner"
                    isMobile={true}
                  />
                </div>
              )}
              
              {currentNavSection === 'chats' && !showConversationThread && (
                <div className="h-full flex flex-col">
                  {/* Conversation List View */}
                  <div className="p-3 border-b border-border/50">
                    <Button 
                      onClick={() => {
                        if ('vibrate' in navigator) navigator.vibrate(30);
                        handleNewConversation();
                        setShowConversationThread(true);
                      }}
                      className="w-full mobile-tap-target"
                      size="lg"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      New Chat
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
                        <MessageSquare className="h-16 w-16 text-muted-foreground mb-6" />
                        <h2 className="text-2xl font-semibold mb-3">Welcome to Shyloh AI</h2>
                        <p className="text-muted-foreground mb-4 max-w-sm">
                          Start your first conversation to get insights, ask questions, and manage your restaurant with AI assistance.
                        </p>
                      </div>
                    ) : (
                      <div className="px-3 py-2">
                        {conversations.map((conv) => {
                          const isActive = conv.id === currentConversationId;
                          const fileCount = files.filter(f => f.conversation_id === conv.id).length;
                          const lastMessage = lastMessagePreviews[conv.id] || "";
                          const preview = lastMessage.length > 60 
                            ? lastMessage.substring(0, 60) + "..." 
                            : lastMessage;

                          return (
                            <button
                              key={conv.id}
                              onClick={() => {
                                if ('vibrate' in navigator) navigator.vibrate(30);
                                handleLoadConversation(conv.id);
                                setShowConversationThread(true);
                              }}
                              className={`w-full text-left p-3 rounded-lg transition-colors mobile-tap-target mb-2 ${
                                isActive 
                                  ? 'bg-accent/50' 
                                  : 'hover:bg-accent/20 active:bg-accent/30'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium truncate text-sm">{conv.title}</h4>
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
                                    <p className="text-xs text-muted-foreground truncate mb-1">
                                      {preview}
                                    </p>
                                  )}
                                  
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}</span>
                                    {conv.message_count > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{conv.message_count} msgs</span>
                                      </>
                                    )}
                                    {fileCount > 0 && (
                                      <>
                                        <span>•</span>
                                        <Paperclip className="h-3 w-3 inline" />
                                        <span>{fileCount}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {currentNavSection === 'chats' && showConversationThread && (
                <>
                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="px-4 py-8 space-y-6">
                      {messages.map((message, idx) => {
                        const renderMessageContent = (content: string) => {
                          const processedContent = content.replace(
                            /(@[A-Za-z0-9\s\-_.]+?)(?=\s|$|[.,!?])/g,
                            '<span class="bg-accent/30 text-accent-foreground font-medium px-1.5 py-0.5 rounded">$1</span>'
                          );
                          
                          return (
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                              {processedContent}
                            </ReactMarkdown>
                          );
                        };

                        const isAI = message.role === 'assistant';
                        const isCurrentUser = message.user_id === user?.id;

                        return (
                          <div
                            key={idx}
                            className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} animate-fade-in`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                isAI
                                  ? "bg-[hsl(354,70%,35%)] text-white"
                                  : "bg-green-600 text-white"
                              }`}
                            >
                              {isAI && (
                                <div className="flex items-center gap-2 mb-1">
                                  <Bot className="w-4 h-4" />
                                  <span className="text-xs font-medium">Shyloh AI</span>
                                </div>
                              )}
                              <div className="text-sm leading-relaxed">
                                {renderMessageContent(message.content)}
                              </div>
                            </div>
                          </div>
                        );
                       })}
                      {debugInfo && (
                        <div className="flex justify-start animate-fade-in">
                          <div className="max-w-full rounded-2xl bg-blue-900/20 border border-blue-500/30 p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <ClipboardList className="w-5 h-5 text-blue-400" />
                              <span className="text-sm font-semibold text-blue-400">Debug Information</span>
                            </div>
                            <div className="space-y-4 text-xs">
                              <div>
                                <p className="font-semibold text-blue-300 mb-1">Model</p>
                                <p className="text-white/80 font-mono">{debugInfo.model}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-blue-300 mb-1">Estimated Tokens</p>
                                <p className="text-white/80">{debugInfo.estimatedTokens?.toLocaleString()} tokens ({debugInfo.totalContextChars?.toLocaleString()} chars)</p>
                              </div>
                              <div>
                                <p className="font-semibold text-blue-300 mb-1">Context Flags</p>
                                <div className="grid grid-cols-2 gap-2 text-white/70">
                                  <p>• Toast Data: {debugInfo.context?.hasToastData ? '✓' : '✗'}</p>
                                  <p>• Documents: {debugInfo.context?.hasDocuments ? '✓' : '✗'}</p>
                                  <p>• Custom Knowledge: {debugInfo.context?.hasCustomKnowledge ? '✓' : '✗'}</p>
                                  <p>• Feedback Insights: {debugInfo.context?.hasFeedbackInsights ? '✓' : '✗'}</p>
                                  <p>• Notion: {debugInfo.context?.notionEnabled ? '✓' : '✗'}</p>
                                  <p>• Hard Mode: {debugInfo.context?.hardModeEnabled ? '✓' : '✗'}</p>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-semibold text-blue-300">System Prompt</p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowPromptDialog(true)}
                                    className="text-xs border-blue-500/30 hover:bg-blue-500/20"
                                  >
                                    Show Full Prompt
                                  </Button>
                                </div>
                                <p className="text-white/60 text-[10px]">{debugInfo.systemPrompt?.length?.toLocaleString()} characters</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
                                  toast.success('Debug info copied to clipboard');
                                }}
                                className="mt-2 border-blue-500/30 hover:bg-blue-500/20"
                              >
                                Copy Full Debug Info
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      {isTyping && (
                        <div className="flex justify-start animate-fade-in">
                          <div className="bg-background/50 backdrop-blur-sm border border-accent/20 rounded-2xl p-4">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-primary-foreground/60 animate-bounce [animation-delay:-0.3s]"></div>
                              <div className="w-2 h-2 rounded-full bg-primary-foreground/60 animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="w-2 h-2 rounded-full bg-primary-foreground/60 animate-bounce"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                  
                  {/* Mobile Input Area */}
                  <div className="sticky bottom-0 border-t border-accent/20 bg-background/95 backdrop-blur-sm p-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFileUpload(e.target.files);
                        }
                      }}
                      className="hidden"
                      multiple
                    />
                    
                    {/* Top row: Paperclip and Filter */}
                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        className="shrink-0"
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <ChatToolsPopover
                        restaurantId={id || ""}
                        hardModeEnabled={hardModeEnabled}
                        onHardModeToggle={() => setHardModeEnabled(!hardModeEnabled)}
                        notionEnabled={notionEnabled}
                        onNotionToggle={() => setNotionEnabled(!notionEnabled)}
                        debugMode={showDebugInfo}
                        onDebugModeToggle={() => setShowDebugInfo(!showDebugInfo)}
                      />
                      <div className="flex-1" />
                    </div>
                    
                    {/* Bottom row: Input and Send */}
                    <div className="flex items-center gap-2">
                      <MentionInput
                        restaurantId={id || ""}
                        value={currentInput}
                        onChange={setCurrentInput}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        disabled={isTyping}
                        placeholder="Message Shyloh..."
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleSendMessage()}
                        disabled={!currentInput.trim() || isTyping}
                        size="icon"
                        className="shrink-0"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          {mobileTab === 'text' && (
            <div className="h-full overflow-auto p-4">
              <ShiftLogEntry
                restaurantId={id || ""}
                shiftDate={format(new Date(), 'yyyy-MM-dd')}
                shiftType="dinner"
              />
            </div>
          )}
        </div>
        
        <MobileBottomNav 
          activeTab={mobileTab} 
          onTabChange={(tab) => {
            // If tapping Chat tab while already on chat and viewing a thread, go back to list
            if (tab === 'chat' && mobileTab === 'chat' && showConversationThread) {
              setShowConversationThread(false);
            } else {
              setMobileTab(tab);
            }
          }} 
        />
        
        <MobileConversationDrawer
          open={conversationDrawerOpen}
          onOpenChange={setConversationDrawerOpen}
          conversations={conversations}
          currentConversationId={currentConversationId}
          onLoadConversation={handleLoadConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          lastMessages={lastMessagePreviews}
        />
        
        <MobileNavigationMenu
          open={navigationMenuOpen}
          onOpenChange={setNavigationMenuOpen}
          currentSection={currentNavSection}
          onNavigate={(section) => {
            setCurrentNavSection(section);
            if (section === 'chats') {
              setShowConversationThread(false);
            }
            // TODO: Handle navigation to other sections (agents, tasks, manager-log)
          }}
        />
        
        {/* Dialogs */}
        <PinInput
          open={pinDialogOpen}
          onOpenChange={setPinDialogOpen}
          onPinSubmit={handlePinSubmit}
          mode={pinMode}
          isLoading={pinLoading}
        />
        <TuningSheet 
          open={tuningSheetOpen} 
          onOpenChange={setTuningSheetOpen}
          restaurantId={id!}
          onSave={refreshRestaurantData}
        />
        <InstallPrompt />

        {/* Debug Prompt Dialog */}
        <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>System Prompt</DialogTitle>
              <DialogDescription>
                {debugInfo?.systemPrompt?.length?.toLocaleString()} characters
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto mt-4">
              <pre className="text-xs p-4 bg-muted rounded-lg whitespace-pre-wrap break-words">
                {debugInfo?.systemPrompt || 'No prompt available'}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Desktop Layout
  return (
    <SidebarProvider>
      <ResizablePanelGroup direction="horizontal" className="min-h-screen bg-gradient-hero w-full">
        {/* Left Sidebar - Chat History & Files - Resizable */}
        {!leftPanelCollapsed && !isMobile && (
          <>
            <ResizablePanel defaultSize={20} minSize={15} maxSize={40} id="chat-files-panel">
              <ChatSidebar
                restaurantId={id || ""}
                conversations={conversations}
                currentConversationId={currentConversationId}
                onNewConversation={handleNewConversation}
                onLoadConversation={handleLoadConversation}
                onDeleteConversation={handleDeleteConversation}
                onRefreshConversations={loadConversations}
                onToggleVisibility={handleToggleVisibility}
                onOpenShareSettings={(conversationId, visibility) => {
                  setCurrentConversationId(conversationId);
                  setCurrentConversationVisibility(visibility);
                  setShowConversationSettings(true);
                }}
              />
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-border hover:bg-primary/20 transition-colors" />
          </>
        )}

        {/* Main Chat Interface */}
        <ResizablePanel defaultSize={sidebarOpen ? 55 : 80} minSize={40} id="main-chat-panel">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="border-b border-accent/20 bg-background/80 backdrop-blur-sm">
              <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                      className="text-primary-foreground hover:bg-background/20"
                      title={leftPanelCollapsed ? "Show chat history" : "Hide chat history"}
                    >
                      {leftPanelCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                    </Button>
                    <div>
                      <h1 className="text-lg font-bold text-primary-foreground">{data.name}</h1>
                      <p className="text-xs text-primary-foreground/60">{data.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRefreshChat}
                      className="text-primary-foreground hover:bg-background/20"
                      title="Refresh chat"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    
                    <NotificationBell
                      restaurantId={id || ""}
                      onNavigate={(conversationId) => {
                        handleLoadConversation(conversationId);
                      }}
                    />
                    {currentConversationId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowConversationSettings(true)}
                        className="text-primary-foreground hover:bg-background/20"
                        title="Share conversation"
                      >
                        <Users className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={signOut}
                      className="text-primary-foreground hover:bg-background/20"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="bg-background/10 backdrop-blur-sm border-primary-foreground/20 text-primary-foreground hover:bg-background/20"
                    >
                      {sidebarOpen ? <PanelLeftClose className="w-4 h-4 mr-2" /> : <PanelLeft className="w-4 h-4 mr-2" />}
                      Settings
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* View Toggle */}
            <div className="border-b border-accent/20 bg-background/50 backdrop-blur-sm">
              <div className="container mx-auto px-4">
                <div className="flex gap-1 -mb-px">
                  <button
                    onClick={() => setCenterView('chat')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                      centerView === 'chat'
                        ? 'border-accent text-accent-foreground bg-background/80'
                        : 'border-transparent text-muted-foreground hover:text-primary-foreground hover:bg-background/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      Chat
                    </div>
                  </button>
                  <button
                    onClick={() => setCenterView('shift-log')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                      centerView === 'shift-log'
                        ? 'border-accent text-accent-foreground bg-background/80'
                        : 'border-transparent text-muted-foreground hover:text-primary-foreground hover:bg-background/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      Manager Log
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Conditional Content Rendering */}
            {centerView === 'chat' ? (
              <>
            {/* Onboarding Progress */}
            {(isOnboarding || (!hasCompletedKPIs && !data?.tuning_completed && onboardingPhase !== 'hook')) && (
              <OnboardingProgress 
                steps={isOnboarding ? onboardingSteps : quickWinProgress.steps} 
                currentStep={isOnboarding ? onboardingStep : quickWinProgress.currentStep} 
              />
            )}

            {/* Incomplete Settings Alert Banner */}
            {!hasCompletedKPIs && data?.tuning_completed && (
              <Alert className="mx-4 my-3 border-accent/30 bg-accent/10">
                <AlertCircle className="h-4 w-4 text-accent-foreground" />
                <AlertTitle className="text-foreground font-semibold">Complete Your Setup</AlertTitle>
                <AlertDescription className="text-foreground/90">
                  <p className="mb-2">
                    You can chat freely, but I'll be more helpful once you complete your KPIs 
                    (Sales, Food Cost, Labor Cost goals).
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSidebarOpen(true);
                      toast.info("Scroll to the 'KPIs' section in the settings panel");
                    }}
                    className="mt-1 bg-accent hover:bg-accent-glow text-accent-foreground border-accent"
                  >
                    Complete KPIs Now
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Collapsible Quick Start Prompts - Hidden during onboarding */}
            {!isOnboarding && (
              <Collapsible 
                open={promptsVisible} 
                onOpenChange={setPromptsVisible}
                className="border-b border-accent/20 bg-background/50 backdrop-blur-sm"
              >
                <div className="container mx-auto px-4 py-3 max-w-4xl">
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors mb-3">
                    {promptsVisible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Quick Start Prompts
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="flex flex-wrap gap-2">
                      {samplePrompts.map((prompt, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="rounded-full px-4 py-2 h-auto bg-background/80 border-accent/20 text-primary-foreground/80 hover:bg-background hover:text-primary-foreground hover:border-accent/40 transition-all"
                          onClick={() => handlePromptClick(prompt)}
                        >
                          {prompt}
                        </Button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )}

            {/* Participant Tags */}
            <ParticipantTags />

            {/* Conversation File Header */}
            <ConversationFileHeader
              conversationTitle={conversations.find(c => c.id === currentConversationId)?.title}
              fileCount={files.length}
              isOpen={filePanelOpen}
              onToggle={() => setFilePanelOpen(!filePanelOpen)}
              hasConversation={!!currentConversationId}
            />

            {/* Conversation File Panel */}
            <ConversationFilePanel
              files={files}
              conversationId={currentConversationId}
              isOpen={filePanelOpen}
              onClose={() => setFilePanelOpen(false)}
              onFileDelete={handleDeleteFile}
              onFileUpload={handleFileUpload}
              onMoveToKnowledgeBase={handleMoveToKnowledgeBase}
            />

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Conversation State Indicators */}
                {conversationState.conversation_state?.awaiting_upload && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>Upload when ready:</strong> Click the 📎 paperclip icon below to share your files
                    </p>
                  </div>
                )}
                
                {conversationState.current_topic && conversationState.current_topic !== 'general_chat' && (
                  <div className="mb-4 text-xs text-primary-foreground/50">
                    Current focus: {conversationState.current_topic.replace(/_/g, ' ')}
                  </div>
                )}

                <div className="space-y-6">
                  {messages.map((message, idx) => {
                    // Render message with @mention highlighting and markdown
                    const renderMessageContent = (content: string) => {
                      // Process @mentions to add custom styling
                      const processedContent = content.replace(
                        /(@[A-Za-z0-9\s\-_.]+?)(?=\s|$|[.,!?])/g,
                        '<span class="bg-accent/30 text-accent-foreground font-medium px-1.5 py-0.5 rounded">$1</span>'
                      );
                      
                      return (
                        <ReactMarkdown
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            // Custom styling for markdown elements
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-base font-bold mb-2">{children}</h3>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="ml-2">{children}</li>,
                            code: ({ children, className }) => {
                              const isInline = !className;
                              return isInline ? (
                                <code className="bg-accent/50 px-1 py-0.5 rounded text-xs">{children}</code>
                              ) : (
                                <code className="block bg-accent/50 p-2 rounded text-xs overflow-x-auto">{children}</code>
                              );
                            },
                            a: ({ children, href }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {processedContent}
                        </ReactMarkdown>
                      );
                    };

                    const isAI = message.role === 'assistant';
                    const isCurrentUser = message.user_id === user?.id;
                    const canDelete = isCurrentUser || isAI || currentConversationId; // Can delete own messages, AI messages, or any message if conversation owner
                    const userColorScheme = !isCurrentUser && !isAI && message.user_id 
                      ? getUserColor(message.user_id)
                      : null;

                    return (
                      <div
                        key={idx}
                        className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} animate-fade-in group`}
                      >
                        <div className="relative flex items-start gap-2">
                          {/* User Avatar - only for other users */}
                          {!isCurrentUser && !isAI && message.display_name && userColorScheme && (
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarFallback className={`${userColorScheme.avatar} text-white text-xs font-semibold`}>
                                {getInitials(message.display_name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={!isCurrentUser && !isAI ? 'flex-1' : ''}>
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                                isAI
                                  ? "bg-[hsl(354,70%,35%)] text-white"
                                  : isCurrentUser
                                  ? "bg-green-600 text-white"
                                  : userColorScheme
                                  ? `${userColorScheme.bg} text-white border-l-4 ${userColorScheme.border}`
                                  : "bg-green-600 text-white"
                              }`}
                            >
                              {/* Sender Name for non-current-user messages */}
                              {!isCurrentUser && !isAI && message.display_name && (
                                <div className="text-xs font-semibold mb-1 opacity-95">
                                  {message.display_name}
                                </div>
                              )}
                            {isAI && (
                              <div className="flex items-center gap-2 mb-1">
                                <Bot className="w-4 h-4" />
                                <span className="text-xs font-medium">Shyloh AI</span>
                              </div>
                            )}
                            <div className="text-sm leading-relaxed">
                              {renderMessageContent(message.content)}
                            </div>
                            
                            {isAI && message.hard_mode_used && (
                              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                                <Zap className="w-3 h-3 text-orange-500" />
                                <span className="text-xs text-orange-500 font-medium">Hard Mode</span>
                              </div>
                            )}
                            
                            {message.role === "assistant" && !isOnboarding && (
                              <FeedbackEmojis
                                messageIndex={idx}
                                currentRating={messageFeedback[idx]}
                                onRate={(rating) => handleMessageFeedback(idx, rating)}
                              />
                              )}
                            </div>
                          
                            {/* Delete button - shows on hover */}
                            {canDelete && message.id && (
                              <button
                                onClick={() => handleDeleteMessage(message.id!, idx)}
                                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                                title="Delete message"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isTyping && (
                    <div className="flex justify-start animate-fade-in">
                      <div className="bg-background/50 backdrop-blur-sm border border-accent/20 rounded-2xl p-4">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-primary-foreground/60 animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 rounded-full bg-primary-foreground/60 animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 rounded-full bg-primary-foreground/60 animate-bounce"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Objective Selection Cards */}
                  {showObjectives && (
                    <div className="flex justify-start animate-fade-in">
                      <div className="bg-background/50 backdrop-blur-sm border border-accent/20 rounded-2xl p-4 max-w-md">
                        <p className="text-sm text-primary-foreground/80 mb-3">Got it! What's the priority today?</p>
                        <div className="grid grid-cols-2 gap-2">
                          {objectives.map((objective) => (
                            <button
                              key={objective.id}
                              onClick={() => handleObjectiveClick(objective)}
                              className="flex items-center gap-2 px-4 py-3 bg-accent/10 hover:bg-accent/20 text-accent-foreground rounded-lg text-sm transition-all hover:scale-105 text-left"
                            >
                              <span className="text-lg">{objective.icon}</span>
                              <span className="flex-1">{objective.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Strategy Session Area Selection */}
                  {showCoachingOptions && (
                    <div className="flex justify-start animate-fade-in">
                      <div className="bg-background/50 backdrop-blur-sm border border-accent/20 rounded-2xl p-4 max-w-md">
                        <p className="text-sm text-primary-foreground/80 mb-3">Select up to 2 areas:</p>
                        <div className="space-y-2">
                          {[
                            { id: "grow_sales", label: "Grow my sales" },
                            { id: "lower_costs", label: "Lower my costs" },
                            { id: "better_dining", label: "Make this a better place to eat" },
                            { id: "better_workplace", label: "Make this a better place to work" }
                          ].map((area) => (
                            <button
                              key={area.id}
                              onClick={() => handleCoachingAreaToggle(area.id)}
                              className={`w-full px-4 py-3 rounded-lg text-sm transition-all text-left ${
                                selectedCoachingAreas.includes(area.id)
                                  ? "bg-accent text-accent-foreground"
                                  : "bg-accent/10 hover:bg-accent/20 text-primary-foreground"
                              }`}
                            >
                              {area.label}
                            </button>
                          ))}
                        </div>
                        {selectedCoachingAreas.length > 0 && (
                          <button
                            onClick={handleCoachingAreasSubmit}
                            className="w-full mt-3 px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-sm font-medium transition-all"
                          >
                            Continue with {selectedCoachingAreas.length} area{selectedCoachingAreas.length > 1 ? 's' : ''}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>


            {/* Input Area - Sticky at bottom */}
            <div className="sticky bottom-0 z-50 border-t border-accent/20 bg-background/95 backdrop-blur-sm">
              <div className="container mx-auto px-4 py-4 max-w-4xl">
                <div className="space-y-2">
                  {/* Hard Mode Badge Indicator */}
                  {hardModeEnabled && (
                    <div className="flex items-center gap-2 text-xs text-orange-500">
                      <Zap className="w-3 h-3 animate-pulse" />
                      <span className="font-medium">Hard Mode Active - Deep reasoning enabled</span>
                    </div>
                  )}
                  
                  {/* Uploaded Files Indicator */}
                  {(uploadingFiles.length > 0 || showFileNotification) && (
                    <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 animate-fade-in">
                      <div className="flex items-start gap-2">
                        <Paperclip className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-accent-foreground mb-1">
                            {uploadingFiles.length > 0 ? 'Uploading files...' : 'Files attached'}
                          </p>
                          <div className="space-y-1">
                            {uploadingFiles.map((fileName, idx) => (
                              <div key={`uploading-${idx}`} className="flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin text-accent" />
                                <span className="text-xs text-muted-foreground truncate">{fileName}</span>
                              </div>
                            ))}
                            {files && files.slice(0, 3).map((file) => (
                              <div key={file.id} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-xs text-muted-foreground truncate">{file.file_name}</span>
                              </div>
                            ))}
                            {files && files.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                + {files.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-3 relative">
                    {/* Vertical stack of tool buttons */}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isTyping}
                        className="relative z-50 h-10 w-10 text-foreground hover:bg-accent"
                        title="Upload files"
                      >
                        <Paperclip className="w-5 h-5" />
                      </Button>
                      <ChatToolsPopover
                        hardModeEnabled={hardModeEnabled}
                        notionEnabled={notionEnabled}
                        debugMode={showDebugInfo}
                        onDebugModeToggle={() => setShowDebugInfo(!showDebugInfo)}
                        onHardModeToggle={handleHardModeToggle}
                        onNotionToggle={async (enabled) => {
                          setNotionEnabled(enabled);
                          if (currentConversationId) {
                            try {
                              await supabase
                                .from('chat_conversations')
                                .update({ notion_enabled: enabled })
                                .eq('id', currentConversationId);
                              toast.success(enabled ? 'Notion enabled' : 'Notion disabled');
                            } catch (error) {
                              setNotionEnabled(!enabled);
                              toast.error('Failed to update Notion setting');
                            }
                          } else {
                            toast.info(enabled ? 'Notion will be used once you start a conversation' : 'Notion disabled');
                          }
                        }}
                        restaurantId={id!}
                        conversationId={currentConversationId || undefined}
                        userId={user?.id}
                      />
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFileUpload(e.target.files);
                        }
                      }}
                    />
                    <MentionInput
                      value={currentInput}
                      onChange={setCurrentInput}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !isTyping) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ask me anything about your restaurant... (use @ to mention)"
                      disabled={isTyping}
                      restaurantId={id || ""}
                      className="h-12"
                    />
                    <Button
                      onClick={() => handleSendMessage()}
                      disabled={isTyping || !currentInput.trim()}
                      size="icon"
                      className="h-10 w-10"
                    >
                      {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  {/* AI Availability Hint */}
                  <div className="text-xs text-muted-foreground px-1 mt-1">
                    💡 Type <span className="font-medium">@Shyloh</span> or <span className="font-medium">/ask</span> to get AI help
                  </div>
                  
                  {/* Debug Info Display */}
                  {showDebugInfo && debugInfo && (
                    <div className="mt-4 p-4 bg-muted/50 border border-border rounded-lg max-h-[400px] overflow-y-auto">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-foreground">Debug: Full Context Sent to Claude</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
                            toast.success("Debug info copied to clipboard");
                          }}
                          className="text-xs"
                        >
                          Copy JSON
                        </Button>
                      </div>
                      <div className="space-y-3 text-xs">
                        <div>
                          <div className="font-medium text-foreground mb-1">Model:</div>
                          <div className="text-muted-foreground">{debugInfo.model}</div>
                        </div>
                        <div>
                          <div className="font-medium text-foreground mb-1">Estimated Tokens:</div>
                          <div className="text-muted-foreground">{debugInfo.estimatedTokens?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="font-medium text-foreground mb-1">Total Context Characters:</div>
                          <div className="text-muted-foreground">{debugInfo.totalContextChars?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="font-medium text-foreground mb-1">System Prompt:</div>
                          <pre className="text-muted-foreground whitespace-pre-wrap bg-background/50 p-2 rounded max-h-[200px] overflow-y-auto">
                            {debugInfo.systemPrompt}
                          </pre>
                        </div>
                        <div>
                          <div className="font-medium text-foreground mb-1">Messages ({debugInfo.messages?.length}):</div>
                          <pre className="text-muted-foreground whitespace-pre-wrap bg-background/50 p-2 rounded max-h-[200px] overflow-y-auto">
                            {JSON.stringify(debugInfo.messages, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <div className="font-medium text-foreground mb-1">Context Flags:</div>
                          <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                            <div>Hard Mode: {debugInfo.context?.hardMode ? '✅' : '❌'}</div>
                            <div>Notion: {debugInfo.context?.notionEnabled ? '✅' : '❌'}</div>
                            <div>Onboarding: {debugInfo.context?.onboardingMode ? '✅' : '❌'}</div>
                            <div>Custom Knowledge: {debugInfo.context?.hasCustomKnowledge ? '✅' : '❌'}</div>
                            <div>Toast Metrics: {debugInfo.context?.hasToastMetrics ? '✅' : '❌'}</div>
                            <div>Files: {debugInfo.context?.filesCount || 0}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
              </>
            ) : (
              <ShiftLogPanel restaurantId={id || ""} />
            )}
          </div>
        </ResizablePanel>

        {/* Right Sidebar - Restaurant Details - Resizable */}
        {sidebarOpen && !isMobile && (
          <>
            <ResizableHandle withHandle className="bg-border hover:bg-primary/20 transition-colors" />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
              <div className="h-full border-l border-accent/20 bg-background/95 backdrop-blur-sm overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* KPIs Section */}
            <Collapsible open={kpisOpen} onOpenChange={setKpisOpen}>
              <div className="space-y-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full group">
                  <h3 className="text-sm font-semibold text-primary-foreground uppercase tracking-wide">KPIs</h3>
                  {kpisOpen ? <ChevronUp className="w-4 h-4 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" /> : <ChevronDown className="w-4 h-4 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-3">
                    {hasCompletedKPIs && (
                      <>
                        <Card className="bg-background/50 border-accent/20 p-4 space-y-3">
                          {/* Average Weekly Sales */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-primary-foreground">Avg Weekly Sales</p>
                              {editingKPI !== "avg_weekly_sales" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditKPI("avg_weekly_sales", kpiData.avg_weekly_sales)}
                                  className="text-accent hover:text-accent-foreground hover:bg-accent/20 h-6 text-xs p-1"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                            {editingKPI === "avg_weekly_sales" ? (
                              <div className="space-y-2">
                                <Input
                                  type="number"
                                  value={kpiEditValue}
                                  onChange={(e) => setKpiEditValue(e.target.value)}
                                  className="bg-background/20 border-accent/30 text-primary-foreground h-8 text-sm"
                                  autoFocus
                                  disabled={saving}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveKPI("avg_weekly_sales")}
                                    disabled={saving}
                                    className="bg-accent hover:bg-accent/90 text-xs h-6"
                                  >
                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelKPI}
                                    disabled={saving}
                                    className="text-xs h-6 bg-background/10 border-primary-foreground/20"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-primary-foreground/90 text-sm">${kpiData.avg_weekly_sales?.toLocaleString() || "N/A"}</p>
                            )}
                          </div>

                          {/* Food Cost Goal */}
                          <div className="space-y-1 pt-2 border-t border-accent/10">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-primary-foreground">Food Cost Goal</p>
                              {editingKPI !== "food_cost_goal" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditKPI("food_cost_goal", kpiData.food_cost_goal)}
                                  className="text-accent hover:text-accent-foreground hover:bg-accent/20 h-6 text-xs p-1"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                            {editingKPI === "food_cost_goal" ? (
                              <div className="space-y-2">
                                <Input
                                  type="number"
                                  value={kpiEditValue}
                                  onChange={(e) => setKpiEditValue(e.target.value)}
                                  className="bg-background/20 border-accent/30 text-primary-foreground h-8 text-sm"
                                  autoFocus
                                  disabled={saving}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveKPI("food_cost_goal")}
                                    disabled={saving}
                                    className="bg-accent hover:bg-accent/90 text-xs h-6"
                                  >
                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelKPI}
                                    disabled={saving}
                                    className="text-xs h-6 bg-background/10 border-primary-foreground/20"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-primary-foreground/90 text-sm">{kpiData.food_cost_goal}%</p>
                            )}
                          </div>

                          {/* Labor Cost Goal */}
                          <div className="space-y-1 pt-2 border-t border-accent/10">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-primary-foreground">Labor Cost Goal</p>
                              {editingKPI !== "labor_cost_goal" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditKPI("labor_cost_goal", kpiData.labor_cost_goal)}
                                  className="text-accent hover:text-accent-foreground hover:bg-accent/20 h-6 text-xs p-1"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                            {editingKPI === "labor_cost_goal" ? (
                              <div className="space-y-2">
                                <Input
                                  type="number"
                                  value={kpiEditValue}
                                  onChange={(e) => setKpiEditValue(e.target.value)}
                                  className="bg-background/20 border-accent/30 text-primary-foreground h-8 text-sm"
                                  autoFocus
                                  disabled={saving}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveKPI("labor_cost_goal")}
                                    disabled={saving}
                                    className="bg-accent hover:bg-accent/90 text-xs h-6"
                                  >
                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelKPI}
                                    disabled={saving}
                                    className="text-xs h-6 bg-background/10 border-primary-foreground/20"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-primary-foreground/90 text-sm">{kpiData.labor_cost_goal}%</p>
                            )}
                          </div>

                          {/* Sales Mix - Editable */}
                          <div className="space-y-2 pt-2 border-t border-accent/10">
                            <p className="text-xs font-medium text-primary-foreground">Sales Mix</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                              {SALES_MIX_FIELDS.map(field => {
                                const isFullWidth = field.key === 'sales_mix_na_bev' || 
                                                   field.key === 'sales_mix_retail' || 
                                                   field.key === 'sales_mix_room_fees';
                                
                                return (
                                  <div key={field.key} className={isFullWidth ? 'col-span-2' : ''}>
                                    <div className="flex justify-between items-center">
                                      <span className="text-primary-foreground/70 whitespace-nowrap">{field.label}:</span>
                                      {editingKPI === field.key ? (
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            value={kpiEditValue}
                                            onChange={(e) => setKpiEditValue(e.target.value)}
                                            className="w-16 h-6 text-xs bg-background/20 border-accent/30"
                                            autoFocus
                                          />
                                          <Button
                                            onClick={() => handleSaveKPI(field.key)}
                                            disabled={saving}
                                            className="text-xs h-6 px-2 bg-accent hover:bg-accent/90"
                                          >
                                            Save
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            onClick={handleCancelKPI}
                                            disabled={saving}
                                            className="text-xs h-6 px-2"
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <span className="text-primary-foreground">
                                            {kpiData[field.key as keyof typeof kpiData]}%
                                          </span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditKPI(field.key, kpiData[field.key as keyof typeof kpiData] as any)}
                                            className="h-5 w-5 p-0 text-primary-foreground/60 hover:text-primary-foreground"
                                          >
                                            <Edit className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                          </div>
                        </Card>
                      </>
                    )}
                    {!hasCompletedKPIs && (
                      <Card className="bg-background/50 border-accent/20 p-4">
                        <div className="space-y-4">
                          <p className="text-xs text-primary-foreground/80 font-medium">
                            Set Your KPI Targets
                          </p>
                          
                          {/* Average Weekly Sales */}
                          <div className="space-y-1">
                            <Label className="text-xs text-primary-foreground/70">Average Weekly Sales ($)</Label>
                            <Input
                              type="number"
                              placeholder="e.g., 50000"
                              value={manualKPIEntry.avg_weekly_sales}
                              onChange={(e) => setManualKPIEntry(prev => ({...prev, avg_weekly_sales: e.target.value}))}
                              className="bg-background/20 border-accent/30 h-8 text-sm"
                            />
                            {kpiFormErrors.avg_weekly_sales && (
                              <p className="text-xs text-red-400">{kpiFormErrors.avg_weekly_sales}</p>
                            )}
                          </div>
                          
                          {/* Food Cost Goal */}
                          <div className="space-y-1">
                            <Label className="text-xs text-primary-foreground/70">Food Cost Goal (%)</Label>
                            <Input
                              type="number"
                              placeholder="e.g., 28"
                              value={manualKPIEntry.food_cost_goal}
                              onChange={(e) => setManualKPIEntry(prev => ({...prev, food_cost_goal: e.target.value}))}
                              className="bg-background/20 border-accent/30 h-8 text-sm"
                            />
                            {kpiFormErrors.food_cost_goal && (
                              <p className="text-xs text-red-400">{kpiFormErrors.food_cost_goal}</p>
                            )}
                          </div>
                          
                          {/* Labor Cost Goal */}
                          <div className="space-y-1">
                            <Label className="text-xs text-primary-foreground/70">Labor Cost Goal (%) - Salaries & Wages</Label>
                            <Input
                              type="number"
                              placeholder="e.g., 30"
                              value={manualKPIEntry.labor_cost_goal}
                              onChange={(e) => setManualKPIEntry(prev => ({...prev, labor_cost_goal: e.target.value}))}
                              className="bg-background/20 border-accent/30 h-8 text-sm"
                            />
                            {kpiFormErrors.labor_cost_goal && (
                              <p className="text-xs text-red-400">{kpiFormErrors.labor_cost_goal}</p>
                            )}
                          </div>
                          
                          {/* Sales Mix Section */}
                          <div className="space-y-2 pt-2 border-t border-accent/10">
                            <Label className="text-xs text-primary-foreground/70 font-medium">Mix of Sales by % (must total 100%)</Label>
                            
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                              {SALES_MIX_FIELDS.map(field => {
                                const isFullWidth = field.key === 'sales_mix_na_bev' || 
                                                   field.key === 'sales_mix_retail' || 
                                                   field.key === 'sales_mix_room_fees';
                                
                                return (
                                  <div key={field.key} className={isFullWidth ? 'col-span-2' : ''}>
                                    <div className="space-y-1">
                                      <Label className="text-xs text-primary-foreground/60 whitespace-nowrap">{field.label}</Label>
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        value={manualKPIEntry[field.key as keyof typeof manualKPIEntry]}
                                        onChange={(e) => setManualKPIEntry(prev => ({
                                          ...prev, 
                                          [field.key]: e.target.value
                                        }))}
                                        className="bg-background/20 border-accent/30 h-8 text-sm"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            
                            {kpiFormErrors.sales_mix_total && (
                              <p className="text-xs text-red-400">{kpiFormErrors.sales_mix_total}</p>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 pt-2">
                            <Button
                              onClick={handleSaveManualKPIs}
                              disabled={savingManualKPIs}
                              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-8 text-sm"
                            >
                              {savingManualKPIs ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                              Save KPIs
                            </Button>
                            
                            <Button
                              onClick={handleKPIHelp}
                              variant="outline"
                              className="w-full bg-background/10 border-primary-foreground/20 text-primary-foreground hover:bg-background/20 h-8 text-sm"
                            >
                              Help Me with These
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Toast POS Metrics Section */}
            {toolsData?.pos_system === 'Toast' && data?.restaurant_guid && (
              <Collapsible defaultOpen={true}>
                <div className="space-y-3">
                  <CollapsibleTrigger className="flex items-center justify-between w-full group">
                    <h3 className="text-sm font-semibold text-primary-foreground uppercase tracking-wide">Today's Metrics</h3>
                    <ChevronUp className="w-4 h-4 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors ui-state-closed:rotate-180 transition-transform" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-3">
                      {loadingToastData ? (
                        <Card className="bg-background/50 border-accent/20 p-4">
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-primary-foreground/60" />
                          </div>
                        </Card>
                      ) : toastData ? (
                        <Card className="bg-background/50 border-accent/20 p-4 space-y-3">
                          <div className="flex items-center justify-between text-xs text-primary-foreground/60">
                            <span>Live from Toast POS</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={fetchToastData}
                              className="h-6 px-2 text-xs"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Refresh
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-primary-foreground/70">Daily Sales:</span>
                              <span className="text-sm font-semibold text-primary-foreground">
                                ${toastData.dailySales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center pt-2 border-t border-accent/10">
                              <span className="text-xs text-primary-foreground/70">Guest Count:</span>
                              <span className="text-sm font-semibold text-primary-foreground">
                                {toastData.guestCount}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center pt-2 border-t border-accent/10">
                              <span className="text-xs text-primary-foreground/70">Avg Check:</span>
                              <span className="text-sm font-semibold text-primary-foreground">
                                ${toastData.avgCheck.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center pt-2 border-t border-accent/10">
                              <span className="text-xs text-primary-foreground/70">Orders:</span>
                              <span className="text-sm font-semibold text-primary-foreground">
                                {toastData.orderCount}
                              </span>
                            </div>
                          </div>
                        </Card>
                      ) : (
                        <Card className="bg-background/50 border-accent/20 p-4">
                          <p className="text-xs text-primary-foreground/60 text-center py-2">
                            No data available
                          </p>
                        </Card>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )}

            {/* Dimensions Section */}
            <Collapsible open={dimensionsOpen} onOpenChange={setDimensionsOpen}>
              <div className="space-y-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full group">
                  <h3 className="text-sm font-semibold text-primary-foreground uppercase tracking-wide">Dimensions</h3>
                  {dimensionsOpen ? <ChevronUp className="w-4 h-4 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" /> : <ChevronDown className="w-4 h-4 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-3">
                    {dimensions.map((dimension, index) => {
                      const descriptionFieldName = `${dimension.title.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')}_description`;
                      const isEditing = editingField === descriptionFieldName;
                      
                      return (
                        <Card
                          key={index}
                          className="bg-background/50 border-accent/20 p-4 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-primary-foreground">
                              {dimension.title}
                            </h4>
                            <span className="text-accent font-mono text-xs">
                              {dimension.code}
                            </span>
                          </div>
                          
                          {isEditing ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="bg-background/20 border-accent/30 text-primary-foreground min-h-[80px] text-sm"
                                autoFocus
                                disabled={saving}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSave(descriptionFieldName)}
                                  disabled={saving}
                                  className="bg-accent hover:bg-accent/90 text-xs h-7"
                                >
                                  {saving ? (
                                    <>
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    "Save"
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancel}
                                  disabled={saving}
                                  className="text-xs h-7 bg-background/10 border-primary-foreground/20"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-primary-foreground/70 text-xs leading-relaxed">
                                {dimension.description || "No description provided"}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(descriptionFieldName, dimension.description || "")}
                                className="text-accent hover:text-accent-foreground hover:bg-accent/20 -ml-2 text-xs h-7"
                              >
                                <Pencil className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            </>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* REGGI Codes Section */}
            <Collapsible open={reggiOpen} onOpenChange={setReggiOpen}>
              <div className="space-y-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full group">
                  <h3 className="text-sm font-semibold text-primary-foreground uppercase tracking-wide">REGGI Codes</h3>
                  {reggiOpen ? <ChevronUp className="w-4 h-4 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" /> : <ChevronDown className="w-4 h-4 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  {/* Hex Codes */}
                  <Card className="bg-background/50 border-accent/20 p-4 space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Hex Code</p>
                      <p className="text-lg font-mono text-accent">{data.hex_code}</p>
                    </div>
                    <div className="pt-2 border-t border-accent/10">
                      <p className="text-xs text-muted-foreground">Augmented</p>
                      <p className="text-lg font-mono text-accent">{data.augmented_hex_code}</p>
                    </div>
                  </Card>

                  {/* Editable REGGI Dimensions */}
                  <div className="space-y-3">
                    {[
                      { field: 'culinary_beverage_description', label: 'Culinary/Beverage', icon: UtensilsCrossed },
                      { field: 'vibe_energy_description', label: 'Vibe/Energy', icon: Sparkles },
                      { field: 'social_context_description', label: 'Social Context', icon: Users },
                      { field: 'time_occasion_description', label: 'Time/Occasion', icon: Clock },
                      { field: 'operational_execution_description', label: 'Operational Execution', icon: Settings },
                      { field: 'hospitality_approach_description', label: 'Hospitality Approach', icon: Heart },
                    ].map(({ field, label, icon: Icon }) => (
                      <Card key={field} className="bg-background/50 border-accent/20 p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <Icon className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-primary-foreground mb-1">{label}</p>
                            {editingReggi === field ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={reggiEditValue}
                                  onChange={(e) => setReggiEditValue(e.target.value)}
                                  className="bg-background/20 border-accent/30 text-primary-foreground text-sm min-h-[60px]"
                                  autoFocus
                                  disabled={saving}
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleSaveReggi} disabled={saving} className="bg-accent hover:bg-accent/90 text-xs h-6">
                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={handleCancelReggi} disabled={saving} className="text-xs h-6 bg-background/10 border-primary-foreground/20">
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm text-primary-foreground/70 leading-relaxed">
                                  {data[field as keyof typeof data] as string || 'Not set'}
                                </p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditReggi(field, data[field as keyof typeof data] as string || '')}
                                  className="text-accent hover:text-accent-foreground hover:bg-accent/20 -ml-2 text-xs h-6 mt-1"
                                >
                                  <Pencil className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Tech Stack Section */}
            <Collapsible open={toolsOpen} onOpenChange={setToolsOpen}>
              <div className="space-y-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full group">
                  <h3 className="text-sm font-semibold text-primary-foreground uppercase tracking-wide">Tech Stack</h3>
                  {toolsOpen ? <ChevronUp className="w-4 h-4 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" /> : <ChevronDown className="w-4 h-4 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-3">
                    {[
                      { key: 'pos_system', label: 'POS System', icon: '💳' },
                      { key: 'reservation_system', label: 'Reservations', icon: '📅' },
                      { key: 'payroll_system', label: 'Payroll', icon: '💰' },
                      { key: 'accounting_system', label: 'Accounting', icon: '📊' },
                      { key: 'inventory_system', label: 'Inventory', icon: '📦' },
                      { key: 'scheduling_system', label: 'Scheduling', icon: '⏰' },
                      { key: 'marketing_tools', label: 'Marketing', icon: '📣' },
                    ].map((tool) => {
                      const isEditing = editingTool === tool.key;
                      const value = toolsData[tool.key as keyof typeof toolsData];
                      
                      return (
                        <Card
                          key={tool.key}
                          className="bg-background/50 border-accent/20 p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{tool.icon}</span>
                              <p className="text-xs font-medium text-primary-foreground">{tool.label}</p>
                            </div>
                          </div>
                          
                          {isEditing ? (
                            <div className="space-y-2">
                              <Input
                                value={toolEditValue}
                                onChange={(e) => setToolEditValue(e.target.value)}
                                className="bg-background/20 border-accent/30 text-primary-foreground h-8 text-sm"
                                placeholder={`e.g., ${tool.label === 'POS System' ? 'Toast' : tool.label === 'Reservations' ? 'Resy' : tool.label === 'Payroll' ? 'Gusto' : 'QuickBooks'}`}
                                autoFocus
                                disabled={saving}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveTool(tool.key)}
                                  disabled={saving}
                                  className="bg-accent hover:bg-accent/90 text-xs h-6"
                                >
                                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelTool}
                                  disabled={saving}
                                  className="text-xs h-6 bg-background/10 border-primary-foreground/20"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-primary-foreground/90 text-sm">
                                {value || <span className="text-primary-foreground/50 text-xs">Not set</span>}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditTool(tool.key, value)}
                                className="text-accent hover:text-accent-foreground hover:bg-accent/20 -ml-2 text-xs h-6"
                              >
                                <Pencil className="w-3 h-3 mr-1" />
                                {value ? 'Edit' : 'Add'}
                              </Button>
                            </>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Custom Knowledge Section */}
            <Collapsible open={knowledgeOpen} onOpenChange={setKnowledgeOpen}>
              <div className="space-y-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full group">
                  <h3 className="text-sm font-semibold text-primary-foreground uppercase tracking-wide">Custom Rules</h3>
                  {knowledgeOpen ? <ChevronUp className="w-4 h-4 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" /> : <ChevronDown className="w-4 h-4 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-3">
                    {!showAddKnowledge && (
                      <Button
                        onClick={() => setShowAddKnowledge(true)}
                        size="sm"
                        className="w-full bg-accent hover:bg-accent/90 text-xs h-8"
                      >
                        + Add New Rule
                      </Button>
                    )}

                    {showAddKnowledge && (
                      <Card className="bg-background/50 border-accent/20 p-4 space-y-3">
                        <Input
                          placeholder="Rule title (e.g., 'Friday Night Protocol')"
                          value={knowledgeForm.title}
                          onChange={(e) => setKnowledgeForm({ ...knowledgeForm, title: e.target.value })}
                          className="bg-background/20 border-accent/30 text-primary-foreground h-8 text-sm"
                          disabled={saving}
                        />
                        <Input
                          placeholder="Category (optional, e.g., 'Operations')"
                          value={knowledgeForm.category}
                          onChange={(e) => setKnowledgeForm({ ...knowledgeForm, category: e.target.value })}
                          className="bg-background/20 border-accent/30 text-primary-foreground h-8 text-sm"
                          disabled={saving}
                        />
                        <Textarea
                          placeholder="Enter the rule or concept details..."
                          value={knowledgeForm.content}
                          onChange={(e) => setKnowledgeForm({ ...knowledgeForm, content: e.target.value })}
                          className="bg-background/20 border-accent/30 text-primary-foreground min-h-[100px] text-sm"
                          disabled={saving}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveKnowledge}
                            disabled={saving || !knowledgeForm.title.trim() || !knowledgeForm.content.trim()}
                            size="sm"
                            className="bg-accent hover:bg-accent/90 text-xs h-7"
                          >
                            {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                            {editingKnowledge ? "Update" : "Save"}
                          </Button>
                          <Button
                            onClick={handleCancelKnowledge}
                            disabled={saving}
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 bg-background/10 border-primary-foreground/20"
                          >
                            Cancel
                          </Button>
                        </div>
                      </Card>
                    )}

                    {customKnowledge.length === 0 && !showAddKnowledge && (
                      <Card className="bg-background/50 border-accent/20 p-4">
                        <p className="text-xs text-primary-foreground/60 text-center">
                          No custom rules yet. Add rules that Shyloh should remember about your restaurant.
                        </p>
                      </Card>
                    )}

                    {customKnowledge.map((knowledge) => (
                      <Card
                        key={knowledge.id}
                        className={`bg-background/50 border-accent/20 p-4 space-y-2 ${!knowledge.is_active ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-primary-foreground">
                                {knowledge.title}
                              </h4>
                              {knowledge.category && (
                                <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">
                                  {knowledge.category}
                                </span>
                              )}
                            </div>
                            <p className="text-primary-foreground/70 text-xs leading-relaxed mt-1">
                              {knowledge.content}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleKnowledge(knowledge.id, knowledge.is_active)}
                              className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-accent/20 h-6 w-6 p-0"
                              title={knowledge.is_active ? "Deactivate" : "Activate"}
                            >
                              {knowledge.is_active ? "✓" : "○"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditKnowledge(knowledge)}
                              className="text-accent hover:text-accent-foreground hover:bg-accent/20 h-6 w-6 p-0"
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteKnowledge(knowledge.id)}
                              className="text-destructive hover:text-destructive-foreground hover:bg-destructive/20 h-6 w-6 p-0"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Knowledge Base Section */}
            <Collapsible open={knowledgeBaseOpen} onOpenChange={setKnowledgeBaseOpen}>
              <div className="space-y-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full group">
                  <h3 className="text-sm font-semibold text-primary-foreground uppercase tracking-wide">Knowledge Base</h3>
                  {knowledgeBaseOpen ? <ChevronUp className="w-4 h-4 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" /> : <ChevronDown className="w-4 h-4 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-3">
                    <Button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.onchange = (e) => {
                          const target = e.target as HTMLInputElement;
                          if (target.files) {
                            const description = prompt("Add a description for this file (optional):");
                            handleFileUpload(target.files, 'permanent', description || undefined);
                          }
                        };
                        input.click();
                      }}
                      className="w-full bg-accent hover:bg-accent/90 text-xs h-8"
                    >
                      Upload to Knowledge Base
                    </Button>
                    
                    {permanentFiles.length === 0 ? (
                      <Card className="bg-background/50 border-accent/20 p-4">
                        <p className="text-xs text-primary-foreground/60">No permanent files yet. Upload files here to include them in all conversations.</p>
                      </Card>
                    ) : (
                      <div className="space-y-2">
                        {permanentFiles.map((file) => (
                          <Card key={file.id} className="bg-background/50 border-accent/20 p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-primary-foreground truncate">{file.file_name}</p>
                                <p className="text-xs text-primary-foreground/50">{(file.file_size / 1024).toFixed(1)} KB • {new Date(file.uploaded_at).toLocaleDateString()}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteFile(file.id)}
                                className="text-destructive hover:text-destructive-foreground hover:bg-destructive/20 h-6 text-xs p-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            {/* Tags Section */}
                            {editingFileTags === file.id ? (
                              <div className="space-y-2">
                                <TagSelector
                                  selectedTags={fileTagsValue}
                                  onTagsChange={setFileTagsValue}
                                  customTags={customTags}
                                  onAddCustomTag={handleAddCustomTag}
                                  newTagInput={newTagInput}
                                  setNewTagInput={setNewTagInput}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateFileTags(file.id, fileTagsValue)}
                                    className="bg-accent hover:bg-accent/90 text-xs h-6"
                                  >
                                    Save Tags
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingFileTags(null)}
                                    className="text-xs h-6 bg-background/10 border-primary-foreground/20"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {file.tags && file.tags.length > 0 ? (
                                    file.tags.map((tag: string) => (
                                      <span key={tag} className="text-xs px-2 py-0.5 bg-accent/20 text-accent rounded-full">
                                        {tag}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-xs text-primary-foreground/40 italic">No tags</span>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingFileTags(file.id);
                                    setFileTagsValue(file.tags || []);
                                  }}
                                  className="text-accent hover:text-accent-foreground hover:bg-accent/20 h-6 text-xs p-1"
                                >
                                  <Tag className="w-3 h-3 mr-1" />
                                  Edit Tags
                                </Button>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Prompt Library Section */}
            <Collapsible open={promptsOpen} onOpenChange={setPromptsOpen}>
              <div className="space-y-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full group">
                  <h3 className="text-sm font-semibold text-primary-foreground uppercase tracking-wide">
                    Prompt Library
                  </h3>
                  {promptsOpen ? (
                    <ChevronUp className="w-4 h-4 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" />
                  )}
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="space-y-4">
                    {/* Shyloh Quick Prompts (Global - Read-only) */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-primary-foreground/80">🌟 Shyloh Quick Prompts</h4>
                      {globalPrompts.length === 0 ? (
                        <Card className="bg-background/30 border-accent/10 p-3">
                          <p className="text-xs text-primary-foreground/40 text-center">
                            No global prompts available.
                          </p>
                        </Card>
                      ) : (
                        <div className="space-y-2">
                          {globalPrompts.map((prompt) => (
                            <Card
                              key={prompt.id}
                              className="bg-background/30 border-accent/20 p-3 hover:border-accent/40 transition-colors cursor-pointer"
                              onClick={() => handleCopyPromptToInput(prompt.prompt_text)}
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-1">
                                  {prompt.title && (
                                    <div className="flex items-center gap-2 mb-1">
                                      <h5 className="text-sm font-medium text-primary-foreground">
                                        {prompt.title}
                                      </h5>
                                      {prompt.category && (
                                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                          {prompt.category}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <p className="text-primary-foreground/60 text-xs leading-relaxed line-clamp-2">
                                    {prompt.prompt_text}
                                  </p>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* My Quick Prompts (Restaurant-Specific - Editable) */}
                    <Collapsible open={myPromptsOpen} onOpenChange={setMyPromptsOpen}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <CollapsibleTrigger className="flex items-center gap-2 group">
                            <h4 className="text-xs font-semibold text-primary-foreground/80">📝 My Quick Prompts</h4>
                            {myPromptsOpen ? (
                              <ChevronUp className="w-3 h-3 text-primary-foreground/40 group-hover:text-primary-foreground/60 transition-colors" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-primary-foreground/40 group-hover:text-primary-foreground/60 transition-colors" />
                            )}
                          </CollapsibleTrigger>
                          {!showAddPrompt && (
                            <Button
                              onClick={() => setShowAddPrompt(true)}
                              size="sm"
                              className="bg-accent hover:bg-accent/90 text-xs h-6"
                            >
                              + Save
                            </Button>
                          )}
                        </div>

                        <CollapsibleContent>
                          <div className="space-y-2">
                            {/* Add/Edit Prompt Form */}
                            {showAddPrompt && (
                              <Card className="bg-background/50 border-accent/20 p-3 space-y-2">
                                <Input
                                  placeholder="Title (optional)"
                                  value={promptForm.title}
                                  onChange={(e) => setPromptForm({ ...promptForm, title: e.target.value })}
                                  className="bg-background/20 border-accent/30 text-primary-foreground h-7 text-xs"
                                  disabled={saving}
                                />
                                <Input
                                  placeholder="Category (optional)"
                                  value={promptForm.category}
                                  onChange={(e) => setPromptForm({ ...promptForm, category: e.target.value })}
                                  className="bg-background/20 border-accent/30 text-primary-foreground h-7 text-xs"
                                  disabled={saving}
                                />
                                <Textarea
                                  placeholder="Type your prompt..."
                                  value={promptForm.prompt_text}
                                  onChange={(e) => setPromptForm({ ...promptForm, prompt_text: e.target.value })}
                                  className="bg-background/20 border-accent/30 text-primary-foreground min-h-[80px] text-xs"
                                  disabled={saving}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleSavePrompt}
                                    disabled={saving || !promptForm.prompt_text.trim()}
                                    size="sm"
                                    className="bg-accent hover:bg-accent/90 text-xs h-6"
                                  >
                                    {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                                    {editingPrompt ? "Update" : "Save"}
                                  </Button>
                                  <Button
                                    onClick={handleCancelPrompt}
                                    disabled={saving}
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-6 bg-background/10 border-primary-foreground/20"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </Card>
                            )}

                            {/* Empty State */}
                            {myPrompts.length === 0 && !showAddPrompt && (
                              <Card className="bg-background/30 border-accent/10 p-3">
                                <p className="text-xs text-primary-foreground/40 text-center">
                                  No custom prompts yet. Click "Save" to create one.
                                </p>
                              </Card>
                            )}

                            {/* My Prompts List */}
                            {myPrompts.map((prompt) => (
                              <Card
                                key={prompt.id}
                                className="bg-background/50 border-accent/20 p-3 hover:border-accent/40 transition-colors cursor-pointer"
                                onClick={() => handleCopyPromptToInput(prompt.prompt_text)}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    {prompt.title && (
                                      <div className="flex items-center gap-2 mb-1">
                                        <h5 className="text-sm font-medium text-primary-foreground">
                                          {prompt.title}
                                        </h5>
                                        {prompt.category && (
                                          <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">
                                            {prompt.category}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    <p className="text-primary-foreground/60 text-xs leading-relaxed line-clamp-2">
                                      {prompt.prompt_text}
                                    </p>
                                  </div>
                                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditPrompt(prompt)}
                                      className="text-accent hover:text-accent-foreground hover:bg-accent/20 h-6 w-6 p-0"
                                      title="Edit"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeletePrompt(prompt.id)}
                                      className="text-destructive hover:text-destructive-foreground hover:bg-destructive/20 h-6 w-6 p-0"
                                      title="Delete"
                                    >
                                      ×
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Team Section */}
            <Collapsible open={teamOpen} onOpenChange={setTeamOpen}>
              <div className="space-y-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full group">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary-foreground/60" />
                    <h3 className="text-sm font-semibold text-primary-foreground uppercase tracking-wide">Team</h3>
                  </div>
                  {teamOpen ? <ChevronUp className="w-4 h-4 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" /> : <ChevronDown className="w-4 h-4 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-2">
                    <TeamManagement restaurantId={id!} />
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Advanced Settings Section */}
            <Collapsible open={advancedSettingsOpen} onOpenChange={setAdvancedSettingsOpen}>
              <div className="space-y-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full group">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary-foreground/60" />
                    <h3 className="text-sm font-semibold text-primary-foreground uppercase tracking-wide">Advanced Settings</h3>
                  </div>
                  {advancedSettingsOpen ? <ChevronUp className="w-4 h-4 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" /> : <ChevronDown className="w-4 h-4 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-2">
                    {/* Tuning Sub-section */}
                    <Collapsible open={tuningOpen} onOpenChange={setTuningOpen}>
                      <Card className="bg-background/50 border-accent/20 p-3">
                        <CollapsibleTrigger className="flex items-center justify-between w-full group">
                          <h4 className="text-sm font-medium text-primary-foreground">Tuning</h4>
                          {tuningOpen ? <ChevronUp className="w-3 h-3 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" /> : <ChevronDown className="w-3 h-3 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" />}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3">
                          <Button
                            onClick={() => {
                              // Check if PIN exists
                              if (data?.tuning_pin) {
                                setPinMode("verify");
                              } else {
                                setPinMode("set");
                              }
                              setPinDialogOpen(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="w-full text-xs border-accent/40 hover:bg-accent/10 hover:border-accent text-primary-foreground"
                          >
                            Set Your Priorities
                          </Button>
                          <p className="text-xs text-primary-foreground/60 mt-2">
                            Help Shyloh understand what matters most to your restaurant through visual sliders
                          </p>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>
        </div>
              </div>
            </ResizablePanel>
          </>
        )}
       </ResizablePanelGroup>
      
      {/* Mobile Sheets for Sidebars */}
      {isMobile && (
        <>
          {/* Left Sidebar Sheet - Mobile Only */}
          <Sheet open={!leftPanelCollapsed} onOpenChange={(open) => setLeftPanelCollapsed(!open)}>
            <SheetContent side="left" className="w-[85vw] p-0">
              <ChatSidebar
                restaurantId={id || ""}
                conversations={conversations}
                currentConversationId={currentConversationId}
                onNewConversation={handleNewConversation}
                onLoadConversation={handleLoadConversation}
                onDeleteConversation={handleDeleteConversation}
                onRefreshConversations={loadConversations}
              />
            </SheetContent>
          </Sheet>

          {/* Right Sidebar Sheet - Mobile Only - Content reused from desktop */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="right" className="w-[90vw] p-0">
              <div className="h-full border-l border-accent/20 bg-background/95 backdrop-blur-sm overflow-hidden">
                <div className="h-full overflow-y-auto">
                  <div className="p-6 space-y-6">
                    {/* This will render the same settings content as desktop - we'll need to extract it */}
                    <div className="text-center text-muted-foreground p-4">
                      Settings panel for mobile
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
      
      {/* Claim Restaurant Dialog */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim Restaurant</DialogTitle>
            <DialogDescription>
              Enter the PIN to claim ownership of {data?.name || 'this restaurant'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              type="text"
              placeholder="Enter PIN"
              value={claimPin}
              onChange={(e) => setClaimPin(e.target.value)}
              disabled={claiming}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowClaimDialog(false);
                  sessionStorage.removeItem('pending_claim');
                  navigate('/');
                }}
                disabled={claiming}
              >
                Cancel
              </Button>
              <Button
                onClick={handleClaimRestaurant}
                disabled={claiming || !claimPin.trim()}
              >
                {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : "Claim Restaurant"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <PinInput
        open={pinDialogOpen}
        onOpenChange={setPinDialogOpen}
        onPinSubmit={handlePinSubmit}
        mode={pinMode}
        isLoading={pinLoading}
      />
      
      <TuningSheet 
        open={tuningSheetOpen} 
        onOpenChange={setTuningSheetOpen}
        restaurantId={id!}
        onSave={refreshRestaurantData}
      />
      
      <ConversationSettings
        open={showConversationSettings}
        onOpenChange={setShowConversationSettings}
        conversationId={currentConversationId}
        restaurantId={id || ""}
        currentVisibility={currentConversationVisibility}
        onVisibilityChange={setCurrentConversationVisibility}
        onParticipantsChange={() => currentConversationId && loadCurrentConversationParticipants(currentConversationId)}
      />
      
      {/* Onboarding Tuning Flow */}
      {showTuningFlow && id && (
        <OnboardingTuningFlow
          restaurantId={id}
          onComplete={() => {
            setShowTuningFlow(false);
            
            if (!hasCompletedKPIs) {
              // KPIs not done - transition to free chat WITH nudges
              setOnboardingPhase('hook');  // Normal chat mode
              
              // Update progress: tuning complete, KPI step active but not blocking
              setQuickWinProgress(prev => ({
                ...prev,
                currentStep: 4,
                steps: prev.steps.map((step, idx) => ({
                  ...step,
                  completed: idx <= 2, // Tuning complete
                  active: idx === 3 // KPI step active but not blocking
                }))
              }));
              
              toast.success("Tuning profile saved! You can now chat freely. Complete your KPIs when ready for the full experience.");
            } else {
              // KPIs already done - just update tuning
              setOnboardingPhase('hook');
              
              // Mark all steps complete
              setQuickWinProgress(prev => ({
                ...prev,
                currentStep: 5,
                steps: prev.steps.map(step => ({ ...step, completed: true, active: false }))
              }));
              
              toast.success("Tuning profile updated!");
            }
          }}
          onBack={() => {
            setShowTuningFlow(false);
            setOnboardingPhase('quick_win');
          }}
        />
      )}
      
      {/* KPI Collection - Removed blocking modal, users access via settings panel */}
      
      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* User Status Indicator */}
      {user && (
        <div className="fixed bottom-2 right-2 z-50 pointer-events-none">
          <div className="text-[10px] text-muted-foreground/60 whitespace-nowrap text-right">
            Logged in as {user.user_metadata?.display_name || user.email} • {format(currentTime, "MMM d, yyyy • h:mm a")}
          </div>
        </div>
      )}

      {/* Debug Prompt Dialog */}
      <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>System Prompt</DialogTitle>
            <DialogDescription>
              {debugInfo?.systemPrompt?.length?.toLocaleString()} characters
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4">
            <pre className="text-xs p-4 bg-muted rounded-lg whitespace-pre-wrap break-words">
              {debugInfo?.systemPrompt || 'No prompt available'}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default RestaurantFindings;