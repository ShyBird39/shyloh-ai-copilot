import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatMessage {
  id?: string;
  role: "assistant" | "user";
  content: string;
  type?: "question" | "confirmation" | "input";
  user_id?: string | null;
  display_name?: string | null;
  hard_mode_used?: boolean;
}

interface ConversationParticipant {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    email: string;
    display_name: string | null;
  };
}

interface ConversationStateType {
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
}

interface UseConversationStateParams {
  restaurantId: string | undefined;
  userId: string | undefined;
  restaurantData: any;
  setOnboardingPhase: (phase: 'hook' | 'pain_point' | 'quick_win' | 'tuning' | 'data_collection') => void;
  setCurrentInput: (input: string) => void;
  setShowObjectives: (show: boolean) => void;
}

export const useConversationState = ({
  restaurantId,
  userId,
  restaurantData,
  setOnboardingPhase,
  setCurrentInput,
  setShowObjectives,
}: UseConversationStateParams) => {
  // Conversation state
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentParticipants, setCurrentParticipants] = useState<ConversationParticipant[]>([]);
  const [conversationState, setConversationState] = useState<ConversationStateType>({
    current_topic: null,
    intent_classification: null,
    wwahd_mode: false,
    topics_discussed: [],
    last_question_asked: null,
    conversation_state: {},
  });
  
  // Conversation settings
  const [currentConversationVisibility, setCurrentConversationVisibility] = useState("private");
  const [notionEnabled, setNotionEnabled] = useState(false);
  const [hardModeEnabled, setHardModeEnabled] = useState(false);
  
  // Message interaction state
  const [messageFeedback, setMessageFeedback] = useState<Record<number, number>>({});
  const [lastMessagePreviews, setLastMessagePreviews] = useState<Record<string, string>>({});

  // Data loading functions
  const loadConversations = async () => {
    if (!restaurantId) return;
    
    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select(`
          *,
          participants:chat_conversation_participants(count)
        `)
        .eq("restaurant_id", restaurantId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      
      // Transform data to include participant_count
      const conversationsWithCount = (data || []).map(conv => ({
        ...conv,
        participant_count: conv.participants?.[0]?.count || 0
      }));
      
      setConversations(conversationsWithCount);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const loadCurrentConversationParticipants = async (conversationId: string) => {
    if (!conversationId) {
      setCurrentParticipants([]);
      return;
    }

    try {
      // Get participants
      const { data: participantData, error: participantError } = await supabase
        .from("chat_conversation_participants")
        .select("id, user_id, role")
        .eq("conversation_id", conversationId)
        .order("role", { ascending: true });

      if (participantError) throw participantError;

      if (!participantData || participantData.length === 0) {
        setCurrentParticipants([]);
        return;
      }

      // Get profiles for all participants
      const userIds = participantData.map(p => p.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .in("id", userIds);

      if (profileError) throw profileError;

      // Combine data
      const participantsWithProfiles = participantData.map(p => {
        const profile = profileData?.find(prof => prof.id === p.user_id);
        return {
          ...p,
          profiles: {
            email: profile?.email || '',
            display_name: profile?.display_name || null,
          }
        };
      });

      setCurrentParticipants(participantsWithProfiles);
      return participantsWithProfiles;
    } catch (error) {
      console.error("Error loading participants:", error);
      setCurrentParticipants([]);
      return [];
    }
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setCurrentParticipants([]);
    setNotionEnabled(false);
    setHardModeEnabled(false);
    
    // Check if tuning is complete
    const tuningComplete = restaurantData?.tuning_completed;
    
    if (tuningComplete) {
      // Tuning complete → free chat mode with rotating welcome messages
      const welcomeMessages = [
        {
          content: "Welcome back, I'm here to be helpful. I can't always be, but I'll try and I won't waste your time.",
          type: "question" as const,
        },
        {
          content: "Hi- what's on your mind?",
          type: "question" as const,
        },
        {
          content: "Shyloh Quick Tip: Did you know you could connect Toast, Square and other POS Systems to Shyloh? This lets me analyze your actual sales data and provide more relevant insights.",
          type: "question" as const,
        },
        {
          content: "Shyloh Quick Tip: Did you know Shyloh can help analyze and summarize data you give it and then discuss how to act on the insight? Feel free to share sales reports, inventory lists, or menu ideas.",
          type: "question" as const,
        },
        {
          content: "Shyloh Quick Tip: You can create custom rules like 'always keep BOH hourly labor under 8%' or 'when thinking about a new dish, keep in mind we don't have any entrees over $25'. This helps me give advice that fits your restaurant's specific constraints.",
          type: "question" as const,
        },
        {
          content: "Try asking me 'How's today going?'",
          type: "question" as const,
        },
      ];
      
      // Select random welcome message
      const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
      
      setMessages([{
        role: "assistant",
        content: randomWelcome.content,
        type: randomWelcome.type,
      }]);
      setOnboardingPhase('hook');
    } else {
      // Tuning not complete → trigger onboarding flow
      setMessages([
        {
          role: "assistant",
          content: "First things first, I am a restaurant intelligence tool. I don't have all the answers by any means, but through conversation, hopefully the two of us have more of them. I know a lot about restaurants but just a little bit about yours. This initial conversation is meant to help me learn more. That way I can be more helpful to you going forward.",
          type: "question",
        }
      ]);
      setOnboardingPhase('hook');
    }
    
    setCurrentInput("");
    setShowObjectives(false);
  };

  const handleLoadConversation = async (conversationId: string) => {
    try {
      const { data: msgs, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .is('deleted_at', null)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch conversation state and visibility
      const { data: convMeta, error: metaError } = await supabase
        .from('chat_conversations')
        .select('conversation_state, current_topic, intent_classification, wwahd_mode, topics_discussed, last_question_asked, visibility, notion_enabled, hard_mode_enabled')
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
        setCurrentConversationVisibility(convMeta.visibility || 'private');
        setNotionEnabled(convMeta.notion_enabled || false);
        setHardModeEnabled(convMeta.hard_mode_enabled || false);
      }

      // Verify user can access this conversation
      if (userId) {
        const { data: conversation } = await supabase
          .from('chat_conversations')
          .select('visibility')
          .eq('id', conversationId)
          .single();

        const { data: existingParticipant } = await supabase
          .from('chat_conversation_participants')
          .select('id')
          .eq('conversation_id', conversationId)
          .eq('user_id', userId)
          .maybeSingle();

        const canAccess = existingParticipant || (conversation?.visibility === 'team');

        if (!canAccess) {
          toast.error("You don't have access to this conversation");
          handleNewConversation();
          return;
        }
      }

      setCurrentConversationId(conversationId);
      setMessages(msgs.map(msg => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        user_id: msg.user_id,
        display_name: msg.profiles?.display_name || msg.profiles?.email || null,
        hard_mode_used: msg.hard_mode_used || false,
      })));

      // Load participants for this conversation
      loadCurrentConversationParticipants(conversationId);

      // Load feedback for this conversation
      if (userId) {
        const { data: feedbackData } = await supabase
          .from("chat_message_feedback")
          .select("message_id, rating")
          .eq("conversation_id", conversationId)
          .eq("user_id", userId);
        
        if (feedbackData) {
          const feedbackMap: Record<number, number> = {};
          const messageIds = msgs.map(m => m.id);
          
          feedbackData.forEach(fb => {
            const msgIndex = messageIds.indexOf(fb.message_id);
            if (msgIndex !== -1) {
              feedbackMap[msgIndex] = fb.rating;
            }
          });
          
          setMessageFeedback(feedbackMap);
        }
      }
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

  const handleToggleVisibility = async (conversationId: string, currentVisibility: string) => {
    try {
      const newVisibility = currentVisibility === 'private' ? 'team' : 'private';
      
      const { error } = await supabase
        .from("chat_conversations")
        .update({ visibility: newVisibility })
        .eq("id", conversationId);

      if (error) throw error;

      // Update local state
      if (conversationId === currentConversationId) {
        setCurrentConversationVisibility(newVisibility);
      }

      loadConversations();
      toast.success(`Conversation is now ${newVisibility}`);
    } catch (error) {
      console.error("Error toggling visibility:", error);
      toast.error("Failed to update visibility");
    }
  };

  // Realtime subscription for new messages
  useEffect(() => {
    if (!currentConversationId || !userId) return;

    const channel = supabase
      .channel(`messages-${currentConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${currentConversationId}`
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Don't add our own messages (already in state from optimistic update)
          if (newMessage.user_id === userId) {
            console.log('Skipping own message from realtime');
            return;
          }

          console.log('Received realtime message:', newMessage);

          // Fetch user profile for display name if it's a human message
          let displayName = null;
          if (newMessage.user_id && newMessage.role === 'user') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, email')
              .eq('id', newMessage.user_id)
              .single();
            
            displayName = profile?.display_name || profile?.email || 'Team Member';
          }

          // Add message to state
          setMessages(prev => {
            // Check if message already exists
            const exists = prev.some(m => 
              m.content === newMessage.content && 
              m.role === newMessage.role &&
              Math.abs(Date.now() - new Date(newMessage.created_at).getTime()) < 5000
            );
            
            if (exists) {
              console.log('Message already in state, skipping');
              return prev;
            }

            return [...prev, {
              role: newMessage.role,
              content: newMessage.content,
              user_id: newMessage.user_id,
              display_name: displayName,
            }];
          });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [currentConversationId, userId]);

  return {
    // State
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
    
    // Functions
    loadConversations,
    loadCurrentConversationParticipants,
    handleNewConversation,
    handleLoadConversation,
    handleDeleteConversation,
    handleToggleVisibility,
  };
};
