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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          id: string
          metadata: Json | null
          resource: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          resource?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          resource?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      data_deletion_requests: {
        Row: {
          created_at: string
          id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string | null
          created_at: string
          file_url: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_url?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_url?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_poll_votes: {
        Row: {
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "group_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      group_polls: {
        Row: {
          created_at: string
          created_by: string
          group_id: string
          id: string
          options: Json
          question: string
        }
        Insert: {
          created_at?: string
          created_by: string
          group_id: string
          id?: string
          options: Json
          question: string
        }
        Update: {
          created_at?: string
          created_by?: string
          group_id?: string
          id?: string
          options?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_polls_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          max_members: number
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          max_members?: number
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          max_members?: number
          name?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          news_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          news_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          news_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_comments_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      news_poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "news_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      news_polls: {
        Row: {
          created_at: string
          created_by: string
          id: string
          news_id: string
          options: Json
          question: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          news_id: string
          options: Json
          question: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          news_id?: string
          options?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_polls_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      news_reactions: {
        Row: {
          created_at: string
          id: string
          news_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          news_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          news_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_reactions_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          instagram_url: string | null
          serial_id: number
          snapchat_url: string | null
          telegram_url: string | null
          tiktok_url: string | null
          updated_at: string
          user_id: string
          whatsapp_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          instagram_url?: string | null
          serial_id: number
          snapchat_url?: string | null
          telegram_url?: string | null
          tiktok_url?: string | null
          updated_at?: string
          user_id: string
          whatsapp_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          instagram_url?: string | null
          serial_id?: number
          snapchat_url?: string | null
          telegram_url?: string | null
          tiktok_url?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_url?: string | null
        }
        Relationships: []
      }
      stages: {
        Row: {
          correct_answer: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          options: Json | null
          order_index: number
          passing_score: number
          question_text: string
          question_type: Database["public"]["Enums"]["stage_question_type"]
          questions: Json | null
          title: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          options?: Json | null
          order_index: number
          passing_score?: number
          question_text: string
          question_type: Database["public"]["Enums"]["stage_question_type"]
          questions?: Json | null
          title: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          options?: Json | null
          order_index?: number
          passing_score?: number
          question_text?: string
          question_type?: Database["public"]["Enums"]["stage_question_type"]
          questions?: Json | null
          title?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          answer_text: string | null
          answers: Json | null
          created_at: string
          feedback: string | null
          file_url: string | null
          id: string
          max_score: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          score: number | null
          stage_id: string
          status: Database["public"]["Enums"]["submission_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          answer_text?: string | null
          answers?: Json | null
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          id?: string
          max_score?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          stage_id: string
          status?: Database["public"]["Enums"]["submission_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          answer_text?: string | null
          answers?: Json | null
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          id?: string
          max_score?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          stage_id?: string
          status?: Database["public"]["Enums"]["submission_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          content: string | null
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          sender_id: string
          sender_role: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          sender_id: string
          sender_role: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          sender_id?: string
          sender_role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          accepted_disclaimer: boolean
          accepted_privacy: boolean
          accepted_terms: boolean
          created_at: string
          disclaimer_version: string
          id: string
          ip_address: string | null
          privacy_version: string
          terms_version: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_disclaimer?: boolean
          accepted_privacy?: boolean
          accepted_terms?: boolean
          created_at?: string
          disclaimer_version: string
          id?: string
          ip_address?: string | null
          privacy_version: string
          terms_version: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_disclaimer?: boolean
          accepted_privacy?: boolean
          accepted_terms?: boolean
          created_at?: string
          disclaimer_version?: string
          id?: string
          ip_address?: string | null
          privacy_version?: string
          terms_version?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_owner_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      stage_question_type: "mcq" | "truefalse" | "text" | "file"
      submission_status: "pending" | "passed" | "failed"
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
      app_role: ["admin", "user"],
      stage_question_type: ["mcq", "truefalse", "text", "file"],
      submission_status: ["pending", "passed", "failed"],
    },
  },
} as const
