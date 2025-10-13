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
      chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          message_count: number | null
          restaurant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_count?: number | null
          restaurant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message_count?: number | null
          restaurant_id?: string
          title?: string
          updated_at?: string | null
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
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
