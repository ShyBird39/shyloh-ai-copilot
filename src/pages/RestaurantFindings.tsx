import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { LogOut, MapPin, Tag, Pencil, Loader2, Send, PanelLeftClose, PanelLeft, ChevronDown, ChevronUp, RotateCcw, Paperclip } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ChatSidebar } from "@/components/ChatSidebar";
import { OnboardingProgress } from "@/components/OnboardingProgress";

interface KPIData {
  avg_weekly_sales: number | null;
  food_cost_goal: number | null;
  labor_cost_goal: number | null;
  sales_mix_food: number | null;
  sales_mix_liquor: number | null;
  sales_mix_wine: number | null;
  sales_mix_beer: number | null;
  sales_mix_na_bev: number | null;
}

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
  type?: "question" | "confirmation" | "input";
}

const RestaurantFindings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [kpisOpen, setKpisOpen] = useState(false);
  const [dimensionsOpen, setDimensionsOpen] = useState(false);
  const [reggiOpen, setReggiOpen] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [editingKPI, setEditingKPI] = useState<string | null>(null);
  const [kpiEditValue, setKpiEditValue] = useState("");
  
  // Custom knowledge state
  const [customKnowledge, setCustomKnowledge] = useState<any[]>([]);
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState<string | null>(null);
  const [knowledgeForm, setKnowledgeForm] = useState({
    title: "",
    content: "",
    category: "",
  });
  
  // Prompt library state
  const [promptsOpen, setPromptsOpen] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState<any[]>([]);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [promptForm, setPromptForm] = useState({
    title: "",
    prompt_text: "",
    category: "",
  });
  
  // Chat state
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [promptsVisible, setPromptsVisible] = useState(true);
  const [hasCompletedKPIs, setHasCompletedKPIs] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [notionMentioned, setNotionMentioned] = useState(false);
  const [showObjectives, setShowObjectives] = useState(false);
  const [kpiData, setKPIData] = useState<KPIData>({
    avg_weekly_sales: null,
    food_cost_goal: null,
    labor_cost_goal: null,
    sales_mix_food: null,
    sales_mix_liquor: null,
    sales_mix_wine: null,
    sales_mix_beer: null,
    sales_mix_na_bev: null,
  });
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New state for chat history and files
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [cleanupAttempted, setCleanupAttempted] = useState(false);

  // Conversation state tracking
  const [conversationState, setConversationState] = useState<{
    current_topic: string | null;
    intent_classification: string | null;
    wwahd_mode: boolean;
    topics_discussed: string[];
    last_question_asked: string | null;
    conversation_state?: {
      data_requested?: boolean;
      data_request_count?: number;
      awaiting_upload?: boolean;
      has_uploaded_data?: boolean;
    };
  }>({
    current_topic: null,
    intent_classification: null,
    wwahd_mode: false,
    topics_discussed: [],
    last_question_asked: null,
    conversation_state: {},
  });

  // Onboarding state
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [reggiDimensionsReviewed, setReggiDimensionsReviewed] = useState({
    culinary: false,
    vibe: false,
    social: false,
    time: false,
    operational: false,
    hospitality: false,
  });
  const [currentReggiDimension, setCurrentReggiDimension] = useState(0);
  const [onboardingSteps, setOnboardingSteps] = useState([
    { id: 'welcome', label: 'Welcome', completed: false, active: true },
    { id: 'reggi', label: 'Profile', completed: false, active: false },
    { id: 'kpis', label: 'KPIs', completed: false, active: false },
    { id: 'files', label: 'Files', completed: false, active: false },
    { id: 'rules', label: 'Rules', completed: false, active: false },
    { id: 'complete', label: 'Complete', completed: false, active: false },
  ]);

  const samplePrompts = [
    "I am here to...",
    "Check my vitals...",
    "WWAHD?",
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

  const startOnboarding = () => {
    setIsOnboarding(true);
    setOnboardingStep(1);
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

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages(hasCompletedKPIs ? [
      {
        role: "assistant",
        content: "Welcome back! I'm here to help you explore your restaurant's data and insights. What would you like to know?",
        type: "question",
      },
    ] : [
      {
        role: "assistant",
        content: "First things first, I am a restaurant intelligence tool. I don't have all the answers by any means, but through conversation, hopefully the two of us have more of them. I know a lot about restaurants but just a little bit about yours. This initial conversation is meant to help me learn more. That way I can be more helpful to you going forward.",
        type: "question",
      },
      {
        role: "assistant",
        content: "What are your average weekly sales $? (Feel free to round)",
        type: "question",
      },
    ]);
    setCurrentInput("");
    setShowObjectives(false);
  };

  const handleLoadConversation = async (conversationId: string) => {
    try {
      const { data: msgs, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch conversation state
      const { data: convMeta, error: metaError } = await supabase
        .from('chat_conversations')
        .select('conversation_state, current_topic, intent_classification, wwahd_mode, topics_discussed, last_question_asked')
        .eq('id', conversationId)
        .maybeSingle();

      if (!metaError && convMeta) {
        setConversationState({
          current_topic: convMeta.current_topic,
          intent_classification: convMeta.intent_classification,
          wwahd_mode: convMeta.wwahd_mode || false,
          topics_discussed: convMeta.topics_discussed || [],
          last_question_asked: convMeta.last_question_asked,
          conversation_state: convMeta.conversation_state || {},
        });
      }

      setCurrentConversationId(conversationId);
      setMessages(msgs.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })));
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from("chat_conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;

      if (currentConversationId === conversationId) {
        handleNewConversation();
      }
      loadConversations();
      toast.success("Conversation deleted");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    }
  };

  const handleFileUpload = async (fileList: FileList) => {
    if (!id) return;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const fileName = `${id}/${crypto.randomUUID()}/${file.name}`;

      try {
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("restaurant-documents")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Create database record
        const { error: dbError } = await supabase
          .from("restaurant_files")
          .insert({
            restaurant_id: id,
            file_name: file.name,
            file_path: fileName,
            file_size: file.size,
            file_type: file.type,
            processed: true,
            embeddings_generated: false,
          });

        if (dbError) throw dbError;

        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    loadFiles();
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

  const loadConversations = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("restaurant_id", id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
      
      // Check for onboarding completion - only on first load
      if (!isOnboarding && messages.length === 0) {
        const hasOnboarding = data?.some(conv => conv.conversation_type === 'onboarding');
        if (!hasOnboarding && data?.length === 0) {
          // First time user - start onboarding
          startOnboarding();
        }
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const loadFiles = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("restaurant_files")
        .select("*")
        .eq("restaurant_id", id)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error("Error loading files:", error);
    }
  };

  const loadSavedPrompts = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from("restaurant_saved_prompts")
        .select("*")
        .eq("restaurant_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedPrompts(data || []);
    } catch (error) {
      console.error("Error loading saved prompts:", error);
    }
  };

  const handleObjectiveClick = (objective: typeof objectives[0]) => {
    setShowObjectives(false);
    handleSendMessage(`I want to ${objective.label.toLowerCase()}`);
  };

  const handlePromptClick = async (promptText: string) => {
    if (promptText === "I am here to...") {
      setShowObjectives(true);
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
    
    setCurrentInput(promptText);
    // Auto-send the prompt
    setTimeout(() => {
      if (hasCompletedKPIs) {
        handleSendMessage(promptText);
      }
    }, 100);
  };


  const loadCustomKnowledge = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from("restaurant_custom_knowledge")
        .select("*")
        .eq("restaurant_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomKnowledge(data || []);
    } catch (error) {
      console.error("Error loading custom knowledge:", error);
    }
  };

  // Load conversations, files, and custom knowledge on mount
  useEffect(() => {
    loadConversations();
    loadFiles();
    loadCustomKnowledge();
    loadSavedPrompts();
  }, [id]);

  // One-time: auto-remove any stuck unprocessed upload for this restaurant
  useEffect(() => {
    if (!id || cleanupAttempted) return;
    setCleanupAttempted(true);
    deleteStuckFileIfAny();
  }, [id, cleanupAttempted]);


  // Fetch restaurant data and KPIs
  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!id) {
        navigate('/');
        return;
      }

      try {
        // Fetch restaurant data
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', id)
          .single();

        if (restaurantError) throw restaurantError;

        if (!restaurant) {
          toast.error("Restaurant not found");
          navigate('/');
          return;
        }

        setData(restaurant);

        // Check if KPIs exist
        const { data: existingKPIs, error: kpisError } = await supabase
          .from('restaurant_kpis')
          .select('*')
          .eq('restaurant_id', id)
          .maybeSingle();

        if (kpisError) {
          console.error('Error fetching KPIs:', kpisError);
        }

        if (existingKPIs) {
          // Returning user - has KPIs
          setHasCompletedKPIs(true);
          setKPIData({
            avg_weekly_sales: existingKPIs.avg_weekly_sales,
            food_cost_goal: existingKPIs.food_cost_goal,
            labor_cost_goal: existingKPIs.labor_cost_goal,
            sales_mix_food: existingKPIs.sales_mix_food,
            sales_mix_liquor: existingKPIs.sales_mix_liquor,
            sales_mix_wine: existingKPIs.sales_mix_wine,
            sales_mix_beer: existingKPIs.sales_mix_beer,
            sales_mix_na_bev: existingKPIs.sales_mix_na_bev,
          });
          setMessages([
            {
              role: "assistant",
              content: "Welcome back! I'm here to help you explore your restaurant's data and insights. What would you like to know?",
              type: "question",
            },
          ]);
        } else {
          // First-time user - no KPIs
          setHasCompletedKPIs(false);
          setMessages([
            {
              role: "assistant",
              content: "First things first, I am a restaurant intelligence tool. I don't have all the answers by any means, but through conversation, hopefully the two of us have more of them. I know a lot about restaurants but just a little bit about yours. This initial conversation is meant to help me learn more. That way I can be more helpful to you going forward.",
              type: "question",
            },
            {
              role: "assistant",
              content: "What are your average weekly sales $? (Feel free to round)",
              type: "question",
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        toast.error("Failed to load restaurant data");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [id, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

    // Step 1: Welcome - just confirm and move to REGGI
    if (onboardingStep === 1) {
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `Perfect! Let's take 5 minutes to make sure I've got your profile dialed in correctly. I've broken your restaurant down into 6 dimensions—the DNA of your concept. For each one, tell me if I'm on track or if we need to adjust. Ready?`,
        }]);
        setIsTyping(false);
        
        // Move to step 2 and start REGGI review
        setOnboardingStep(2);
        updateOnboardingProgress(2, true);
        
        // Show first REGGI dimension after short delay
        setTimeout(() => {
          showNextReggiDimension();
        }, 1000);
      }, 800);
      return;
    }

    // Step 2: REGGI Review
    if (onboardingStep === 2) {
      const dimensionKeys = ['culinary', 'vibe', 'social', 'time', 'operational', 'hospitality'] as const;
      const currentKey = dimensionKeys[currentReggiDimension];
      
      // If user wants to edit, save the edit
      if (messageText.toLowerCase() !== 'looks good' && messageText.toLowerCase() !== 'correct' && messageText.toLowerCase() !== 'yes') {
        const fieldMap = {
          culinary: 'culinary_beverage_description',
          vibe: 'vibe_energy_description',
          social: 'social_context_description',
          time: 'time_occasion_description',
          operational: 'operational_execution_description',
          hospitality: 'hospitality_approach_description',
        };

        try {
          await supabase
            .from('restaurants')
            .update({ [fieldMap[currentKey]]: messageText })
            .eq('id', id);
          
          setData({ ...data, [fieldMap[currentKey]]: messageText });
        } catch (error) {
          console.error('Error updating dimension:', error);
        }
      }

      // Mark this dimension as reviewed
      setReggiDimensionsReviewed(prev => ({ ...prev, [currentKey]: true }));
      
      setIsTyping(false);

      // Check if all dimensions reviewed
      const allReviewed = currentReggiDimension >= 5;
      
      if (allReviewed) {
        // REGGI complete, move to KPIs
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
        }, 800);
      } else {
        // Show next dimension
        setCurrentReggiDimension(prev => prev + 1);
        setTimeout(() => {
          showNextReggiDimension();
        }, 800);
      }
      return;
    }

    // Step 3: KPI Collection - simplified version
    if (onboardingStep === 3) {
      // This is a simplified flow - in production you'd want the full KPIInput flow
      // For now, just acknowledge and move to files
      setIsTyping(false);
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `Got it! For the full KPI setup, you can use the "Vitals" section in the sidebar anytime. Let's move on to getting you set up with data files.`,
        }]);
        
        setTimeout(() => {
          setMessages((prev) => [...prev, {
            role: "assistant",
            content: `You're dialed in! 🎉 One more thing to unlock my full potential—**real data**.\n\nI work way better when I have your actual numbers. Got any of these?\n- 📊 Sales reports (weekly/monthly)\n- ⏰ Labor/time entry reports\n- 🧾 Invoices or order guides\n- 📋 Menu pricing sheets\n- 📈 P&L statements\n\nYou can upload them now using the 📎 **paperclip icon** below, or just type "skip" to add them later. What works?`,
          }]);
        }, 1200);
        
        setOnboardingStep(4);
        updateOnboardingProgress(4, true);
      }, 800);
      return;
    }

    // Step 4: File upload prompt
    if (onboardingStep === 4) {
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
        
        setOnboardingStep(5);
        updateOnboardingProgress(5, true);
      }, 800);
      return;
    }

    // Step 5: Custom knowledge intro
    if (onboardingStep === 5) {
      setIsTyping(false);
      
      // Complete onboarding
      setTimeout(async () => {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `Alright, **${data.name}**—you're all set! ✅\n\nNow—what do you want to tackle first? I can help you:\n- 📊 **Check your vitals** (KPIs vs. benchmarks)\n- 📈 **Increase sales**\n- 💰 **Lower costs**\n- ✨ **Improve guest experience**\n- 👥 **Improve team experience**\n\nOr just ask me anything—I'm here.`,
        }]);
        
        setOnboardingStep(6);
        updateOnboardingProgress(6, true);
        setShowObjectives(true);
        
        // Create onboarding conversation record
        try {
          const { data: newConv, error } = await supabase
            .from("chat_conversations")
            .insert({
              restaurant_id: id,
              title: "Onboarding",
              message_count: messages.length + 2,
              conversation_type: 'onboarding',
            })
            .select()
            .single();

          if (error) throw error;

          // Save all messages to this conversation
          const messagesToSave = [...messages, userMessage].map((msg, idx) => ({
            conversation_id: newConv.id,
            role: msg.role,
            content: msg.content,
            created_at: new Date(Date.now() + idx * 1000).toISOString(),
          }));

          await supabase.from("chat_messages").insert(messagesToSave);
          
          setCurrentConversationId(newConv.id);
          loadConversations();
          
          // End onboarding
          setIsOnboarding(false);
        } catch (error) {
          console.error('Error saving onboarding conversation:', error);
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

  const handleSendMessage = async (messageOverride?: string) => {
    const messageText = messageOverride || currentInput;
    if (!messageText.trim() || !id) return;

    // Route to onboarding handler if in onboarding mode
    if (isOnboarding) {
      return handleOnboardingMessage(messageText);
    }

    // Hide objectives when sending a message
    setShowObjectives(false);

    // Detect Notion mention and strip it from the message
    const useNotion = /@notion|\/notion/i.test(messageText);
    const cleanedMessage = messageText.replace(/@notion|\/notion/gi, '').trim();

    const userMessage: ChatMessage = { role: "user", content: cleanedMessage };
    setMessages((prev) => [...prev, userMessage]);
    setCurrentInput("");
    setNotionMentioned(false);
    setIsTyping(true);

    try {
      // Create or update conversation
      let convId = currentConversationId;
      
      if (!convId) {
        // Create new conversation with a temporary title
        const { data: newConv, error: convError } = await supabase
          .from("chat_conversations")
          .insert({
            restaurant_id: id,
            title: messageText.substring(0, 50) + (messageText.length > 50 ? "..." : ""),
            message_count: 1,
          })
          .select()
          .single();

        if (convError) throw convError;
        convId = newConv.id;
        setCurrentConversationId(convId);
      }

      // Save user message
      await supabase.from("chat_messages").insert({
        conversation_id: convId,
        role: "user",
        content: messageText,
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-shyloh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            restaurantData: data,
            kpiData: kpiData,
            restaurantId: id,
            useNotion: useNotion,
            conversationId: convId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get AI response');
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

        // Update the last message or add new assistant message
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === 'assistant') {
            return [...prev.slice(0, -1), { ...lastMsg, content: assistantMessage }];
          }
          return [...prev, { role: 'assistant', content: assistantMessage }];
        });
      }

      // Save assistant message
      if (assistantMessage && convId) {
        await supabase.from("chat_messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: assistantMessage,
        });

        // Update conversation message count and updated_at
        await supabase
          .from("chat_conversations")
          .update({
            message_count: messages.length + 2, // +2 for user and assistant messages
            updated_at: new Date().toISOString(),
          })
          .eq("id", convId);

        loadConversations();
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
        // Create new
        const { error } = await supabase
          .from("restaurant_saved_prompts")
          .insert({
            restaurant_id: id,
            title: promptForm.title.trim() || null,
            prompt_text: promptForm.prompt_text.trim(),
            category: promptForm.category.trim() || null,
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

  return (
    <SidebarProvider>
      <ResizablePanelGroup direction="horizontal" className="min-h-screen bg-gradient-hero w-full">
        {/* Left Sidebar - Chat History & Files - Resizable */}
        {!leftPanelCollapsed && (
          <>
            <ResizablePanel defaultSize={20} minSize={15} maxSize={40} id="chat-files-panel">
              <ChatSidebar
                restaurantId={id || ""}
                conversations={conversations}
                files={files}
                currentConversationId={currentConversationId}
                onNewConversation={handleNewConversation}
                onLoadConversation={handleLoadConversation}
                onDeleteConversation={handleDeleteConversation}
                onFileUpload={handleFileUpload}
                onDeleteFile={handleDeleteFile}
                onRefreshConversations={loadConversations}
                onRefreshFiles={loadFiles}
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
              <div className="container mx-auto px-4 py-4">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/')}
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
                      Vitals
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Onboarding Progress */}
            {isOnboarding && (
              <OnboardingProgress steps={onboardingSteps} currentStep={onboardingStep} />
            )}

            {/* Collapsible Quick Start Prompts */}
            <Collapsible 
              open={promptsVisible && !isOnboarding} 
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

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Conversation State Indicators */}
                {conversationState.wwahd_mode && (
                  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-900 dark:text-amber-100">
                      🎯 <strong>WWAHD Mode Active</strong> - Channeling Andrew Holden's operational philosophy
                    </p>
                  </div>
                )}

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
                  {messages.map((message, idx) => (
                    <div
                      key={idx}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl p-4 ${
                          message.role === "user"
                            ? "bg-accent text-accent-foreground"
                            : "bg-background/50 backdrop-blur-sm border border-accent/20 text-primary-foreground"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
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
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Input Area - Sticky at bottom */}
            <div className="sticky bottom-0 z-10 border-t border-accent/20 bg-background/95 backdrop-blur-sm">
              <div className="container mx-auto px-4 py-4 max-w-4xl">
                <div className="space-y-2">
                  <div className="flex gap-3">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isTyping}
                      className="h-10 w-10 text-muted-foreground hover:text-foreground"
                      title="Upload files"
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    <Input
                      ref={inputRef}
                      type="text"
                      value={currentInput}
                      onChange={handleInputChange}
                      onKeyDown={(e) => e.key === "Enter" && !isTyping && handleSendMessage()}
                      placeholder="Ask me anything about your restaurant..."
                      disabled={isTyping}
                      className="flex-1 bg-background/50 border-accent/30 text-foreground placeholder:text-muted-foreground"
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
                  
                  {/* Notion Mention Indicator */}
                  {notionMentioned && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-lg animate-fade-in">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-accent/20 flex items-center justify-center">
                          <span className="text-[10px] font-semibold text-accent-foreground">N</span>
                        </div>
                        <span className="text-xs font-medium text-accent-foreground">Notion enabled</span>
                      </div>
                      <span className="text-xs text-muted-foreground">I'll search your Notion workspace</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        {/* Right Sidebar - Restaurant Details - Resizable */}
        {sidebarOpen && (
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

                          {/* Sales Mix */}
                          <div className="space-y-2 pt-2 border-t border-accent/10">
                            <p className="text-xs font-medium text-primary-foreground">Sales Mix</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-primary-foreground/70">Food:</span>
                                <span className="text-primary-foreground">{kpiData.sales_mix_food}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-primary-foreground/70">Liquor:</span>
                                <span className="text-primary-foreground">{kpiData.sales_mix_liquor}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-primary-foreground/70">Wine:</span>
                                <span className="text-primary-foreground">{kpiData.sales_mix_wine}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-primary-foreground/70">Beer:</span>
                                <span className="text-primary-foreground">{kpiData.sales_mix_beer}%</span>
                              </div>
                              <div className="flex justify-between col-span-2">
                                <span className="text-primary-foreground/70">NA Beverages:</span>
                                <span className="text-primary-foreground">{kpiData.sales_mix_na_bev}%</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </>
                    )}
                    {!hasCompletedKPIs && (
                      <Card className="bg-background/50 border-accent/20 p-4">
                        <p className="text-xs text-primary-foreground/60">Complete the initial conversation to set your KPIs</p>
                      </Card>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

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
                <CollapsibleContent>
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
                  <div className="space-y-3">
                    {/* Add New Prompt Button */}
                    {!showAddPrompt && (
                      <Button
                        onClick={() => setShowAddPrompt(true)}
                        size="sm"
                        className="w-full bg-accent hover:bg-accent/90 text-xs h-8"
                      >
                        + Save a Prompt
                      </Button>
                    )}

                    {/* Add/Edit Prompt Form */}
                    {showAddPrompt && (
                      <Card className="bg-background/50 border-accent/20 p-4 space-y-3">
                        <Input
                          placeholder="Title (optional, e.g., 'Cost Analysis')"
                          value={promptForm.title}
                          onChange={(e) => setPromptForm({ ...promptForm, title: e.target.value })}
                          className="bg-background/20 border-accent/30 text-primary-foreground h-8 text-sm"
                          disabled={saving}
                        />
                        <Input
                          placeholder="Category (optional, e.g., 'Operations')"
                          value={promptForm.category}
                          onChange={(e) => setPromptForm({ ...promptForm, category: e.target.value })}
                          className="bg-background/20 border-accent/30 text-primary-foreground h-8 text-sm"
                          disabled={saving}
                        />
                        <Textarea
                          placeholder="Paste or type your prompt here..."
                          value={promptForm.prompt_text}
                          onChange={(e) => setPromptForm({ ...promptForm, prompt_text: e.target.value })}
                          className="bg-background/20 border-accent/30 text-primary-foreground min-h-[100px] text-sm"
                          disabled={saving}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSavePrompt}
                            disabled={saving || !promptForm.prompt_text.trim()}
                            size="sm"
                            className="bg-accent hover:bg-accent/90 text-xs h-7"
                          >
                            {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                            {editingPrompt ? "Update" : "Save"}
                          </Button>
                          <Button
                            onClick={handleCancelPrompt}
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

                    {/* Empty State */}
                    {savedPrompts.length === 0 && !showAddPrompt && (
                      <Card className="bg-background/50 border-accent/20 p-4">
                        <p className="text-xs text-primary-foreground/60 text-center">
                          No saved prompts yet. Save prompts you use often for quick access.
                        </p>
                      </Card>
                    )}

                    {/* Saved Prompts List */}
                    {savedPrompts.map((prompt) => (
                      <Card
                        key={prompt.id}
                        className="bg-background/50 border-accent/20 p-4 space-y-2 hover:border-accent/40 transition-colors cursor-pointer"
                        onClick={() => handleCopyPromptToInput(prompt.prompt_text)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            {prompt.title && (
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold text-primary-foreground">
                                  {prompt.title}
                                </h4>
                                {prompt.category && (
                                  <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">
                                    {prompt.category}
                                  </span>
                                )}
                              </div>
                            )}
                            <p className="text-primary-foreground/70 text-xs leading-relaxed line-clamp-3">
                              {prompt.prompt_text}
                            </p>
                            <p className="text-primary-foreground/40 text-xs mt-2">
                              Click to copy to input
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
        </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </SidebarProvider>
  );
};

export default RestaurantFindings;