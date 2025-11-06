import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export const useConversationState = (restaurantId: string | undefined, userId: string | undefined) => {
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
    } catch (error) {
      console.error("Error loading participants:", error);
      setCurrentParticipants([]);
    }
  };

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
  };
};
