import { useState } from "react";

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
  };
};
