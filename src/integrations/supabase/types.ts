export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chat_conversation_participants: {
        Row: {
          added_at: string | null
          added_by: string | null
          conversation_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          conversation_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          conversation_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          awaiting_user_response: boolean | null
          conversation_state: Json | null
          conversation_type: string | null
          created_at: string | null
          created_by: string | null
          current_topic: string | null
          id: string
          intent_classification: string | null
          last_question_asked: string | null
          message_count: number | null
          restaurant_id: string
          title: string
          topics_discussed: string[] | null
          updated_at: string | null
          visibility: string | null
          wwahd_mode: boolean | null
        }
        Insert: {
          awaiting_user_response?: boolean | null
          conversation_state?: Json | null
          conversation_type?: string | null
          created_at?: string | null
          created_by?: string | null
          current_topic?: string | null
          id?: string
          intent_classification?: string | null
          last_question_asked?: string | null
          message_count?: number | null
          restaurant_id: string
          title: string
          topics_discussed?: string[] | null
          updated_at?: string | null
          visibility?: string | null
          wwahd_mode?: boolean | null
        }
        Update: {
          awaiting_user_response?: boolean | null
          conversation_state?: Json | null
          conversation_type?: string | null
          created_at?: string | null
          created_by?: string | null
          current_topic?: string | null
          id?: string
          intent_classification?: string | null
          last_question_asked?: string | null
          message_count?: number | null
          restaurant_id?: string
          title?: string
          topics_discussed?: string[] | null
          updated_at?: string | null
          visibility?: string | null
          wwahd_mode?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          mentions: string[] | null
          role: string
          user_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          mentions?: string[] | null
          role: string
          user_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          mentions?: string[] | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          mentioned_by: string
          message_id: string
          read_at: string | null
          restaurant_id: string
          type: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          mentioned_by: string
          message_id: string
          read_at?: string | null
          restaurant_id: string
          type?: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          mentioned_by?: string
          message_id?: string
          read_at?: string | null
          restaurant_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_agents: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          restaurant_id: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          restaurant_id: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          restaurant_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      restaurant_custom_knowledge: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          restaurant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          restaurant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          restaurant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_files: {
        Row: {
          embeddings: Json | null
          embeddings_generated: boolean | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          processed: boolean | null
          restaurant_id: string
          uploaded_at: string | null
        }
        Insert: {
          embeddings?: Json | null
          embeddings_generated?: boolean | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          processed?: boolean | null
          restaurant_id: string
          uploaded_at?: string | null
        }
        Update: {
          embeddings?: Json | null
          embeddings_generated?: boolean | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          processed?: boolean | null
          restaurant_id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_files_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_kpis: {
        Row: {
          avg_weekly_sales: number | null
          created_at: string
          food_cost_goal: number | null
          id: string
          labor_cost_goal: number | null
          restaurant_id: string
          sales_mix_beer: number | null
          sales_mix_food: number | null
          sales_mix_liquor: number | null
          sales_mix_na_bev: number | null
          sales_mix_wine: number | null
          updated_at: string
        }
        Insert: {
          avg_weekly_sales?: number | null
          created_at?: string
          food_cost_goal?: number | null
          id?: string
          labor_cost_goal?: number | null
          restaurant_id: string
          sales_mix_beer?: number | null
          sales_mix_food?: number | null
          sales_mix_liquor?: number | null
          sales_mix_na_bev?: number | null
          sales_mix_wine?: number | null
          updated_at?: string
        }
        Update: {
          avg_weekly_sales?: number | null
          created_at?: string
          food_cost_goal?: number | null
          id?: string
          labor_cost_goal?: number | null
          restaurant_id?: string
          sales_mix_beer?: number | null
          sales_mix_food?: number | null
          sales_mix_liquor?: number | null
          sales_mix_na_bev?: number | null
          sales_mix_wine?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_kpis_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_members: {
        Row: {
          id: string
          invited_at: string
          invited_by: string | null
          restaurant_id: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_at?: string
          invited_by?: string | null
          restaurant_id: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          invited_at?: string
          invited_by?: string | null
          restaurant_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_members_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_saved_prompts: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          prompt_text: string
          restaurant_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          prompt_text: string
          restaurant_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          prompt_text?: string
          restaurant_id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_saved_prompts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tools: {
        Row: {
          accounting_system: string | null
          created_at: string
          id: string
          inventory_system: string | null
          marketing_tools: string | null
          other_tools: Json | null
          payroll_system: string | null
          pos_system: string | null
          reservation_system: string | null
          restaurant_id: string
          scheduling_system: string | null
          updated_at: string
        }
        Insert: {
          accounting_system?: string | null
          created_at?: string
          id?: string
          inventory_system?: string | null
          marketing_tools?: string | null
          other_tools?: Json | null
          payroll_system?: string | null
          pos_system?: string | null
          reservation_system?: string | null
          restaurant_id: string
          scheduling_system?: string | null
          updated_at?: string
        }
        Update: {
          accounting_system?: string | null
          created_at?: string
          id?: string
          inventory_system?: string | null
          marketing_tools?: string | null
          other_tools?: Json | null
          payroll_system?: string | null
          pos_system?: string | null
          reservation_system?: string | null
          restaurant_id?: string
          scheduling_system?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          augmented_hex_code: string
          category: string
          created_at: string | null
          culinary_beverage_code: string | null
          culinary_beverage_description: string | null
          hex_code: string
          hospitality_approach_code: string | null
          hospitality_approach_description: string | null
          id: string
          location: string
          name: string
          operational_execution_code: string | null
          operational_execution_description: string | null
          price_band: string | null
          social_context_code: string | null
          social_context_description: string | null
          time_occasion_code: string | null
          time_occasion_description: string | null
          updated_at: string | null
          vibe_energy_code: string | null
          vibe_energy_description: string | null
          zip_code: string | null
        }
        Insert: {
          augmented_hex_code: string
          category: string
          created_at?: string | null
          culinary_beverage_code?: string | null
          culinary_beverage_description?: string | null
          hex_code: string
          hospitality_approach_code?: string | null
          hospitality_approach_description?: string | null
          id: string
          location: string
          name: string
          operational_execution_code?: string | null
          operational_execution_description?: string | null
          price_band?: string | null
          social_context_code?: string | null
          social_context_description?: string | null
          time_occasion_code?: string | null
          time_occasion_description?: string | null
          updated_at?: string | null
          vibe_energy_code?: string | null
          vibe_energy_description?: string | null
          zip_code?: string | null
        }
        Update: {
          augmented_hex_code?: string
          category?: string
          created_at?: string | null
          culinary_beverage_code?: string | null
          culinary_beverage_description?: string | null
          hex_code?: string
          hospitality_approach_code?: string | null
          hospitality_approach_description?: string | null
          id?: string
          location?: string
          name?: string
          operational_execution_code?: string | null
          operational_execution_description?: string | null
          price_band?: string | null
          social_context_code?: string | null
          social_context_description?: string | null
          time_occasion_code?: string | null
          time_occasion_description?: string | null
          updated_at?: string | null
          vibe_energy_code?: string | null
          vibe_energy_description?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_conversation: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      get_user_role: {
        Args: { _restaurant_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _restaurant_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_restaurant_member: {
        Args: { _restaurant_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "member" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "admin", "member", "viewer"],
    },
  },
} as const
