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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          organization_id: string
          rate_limit: number
          scopes: string[] | null
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          organization_id: string
          rate_limit?: number
          scopes?: string[] | null
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          organization_id?: string
          rate_limit?: number
          scopes?: string[] | null
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bond_transactions: {
        Row: {
          amount: number
          bond_id: string
          counterparty: string | null
          created_at: string
          id: string
          metadata: Json | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount: number
          bond_id: string
          counterparty?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          bond_id?: string
          counterparty?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bond_transactions_bond_id_fkey"
            columns: ["bond_id"]
            isOneToOne: false
            referencedRelation: "sovereign_bonds"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          api_key_name: string | null
          auto_sync_enabled: boolean | null
          created_at: string
          cron_schedule: string | null
          data_type: string | null
          endpoint_url: string | null
          id: string
          last_sync: string | null
          metadata: Json | null
          name: string
          region_id: string | null
          source_type: string
          status: string
          sync_interval_minutes: number | null
          updated_at: string
        }
        Insert: {
          api_key_name?: string | null
          auto_sync_enabled?: boolean | null
          created_at?: string
          cron_schedule?: string | null
          data_type?: string | null
          endpoint_url?: string | null
          id?: string
          last_sync?: string | null
          metadata?: Json | null
          name: string
          region_id?: string | null
          source_type: string
          status?: string
          sync_interval_minutes?: number | null
          updated_at?: string
        }
        Update: {
          api_key_name?: string | null
          auto_sync_enabled?: boolean | null
          created_at?: string
          cron_schedule?: string | null
          data_type?: string | null
          endpoint_url?: string | null
          id?: string
          last_sync?: string | null
          metadata?: Json | null
          name?: string
          region_id?: string | null
          source_type?: string
          status?: string
          sync_interval_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sources_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "rci_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_tokens: {
        Row: {
          amount: number
          id: string
          metadata: Json | null
          minted_at: string
          minted_by: string
          region_id: string
          token_type: string
          transaction_hash: string | null
          verification_request_id: string
        }
        Insert: {
          amount: number
          id?: string
          metadata?: Json | null
          minted_at?: string
          minted_by: string
          region_id: string
          token_type: string
          transaction_hash?: string | null
          verification_request_id: string
        }
        Update: {
          amount?: number
          id?: string
          metadata?: Json | null
          minted_at?: string
          minted_by?: string
          region_id?: string
          token_type?: string
          transaction_hash?: string | null
          verification_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "impact_tokens_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "rci_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impact_tokens_verification_request_id_fkey"
            columns: ["verification_request_id"]
            isOneToOne: false
            referencedRelation: "verification_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscriptions: {
        Row: {
          email: string
          id: string
          is_active: boolean
          is_verified: boolean | null
          metadata: Json | null
          source: string | null
          subscribed_at: string
          verification_token: string | null
          verified_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          is_verified?: boolean | null
          metadata?: Json | null
          source?: string | null
          subscribed_at?: string
          verification_token?: string | null
          verified_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean | null
          metadata?: Json | null
          source?: string | null
          subscribed_at?: string
          verification_token?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          region_id: string | null
          severity: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          region_id?: string | null
          severity?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          region_id?: string | null
          severity?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "rci_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          completed_at: string | null
          completed_steps: Json
          created_at: string
          current_step: number
          first_action_completed: boolean
          id: string
          org_created: boolean
          role_selected: string | null
          tour_completed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: Json
          created_at?: string
          current_step?: number
          first_action_completed?: boolean
          id?: string
          org_created?: boolean
          role_selected?: string | null
          tour_completed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: Json
          created_at?: string
          current_step?: number
          first_action_completed?: boolean
          id?: string
          org_created?: boolean
          role_selected?: string | null
          tour_completed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_at: string | null
          invited_email: string | null
          organization_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_email?: string | null
          organization_id: string
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_email?: string | null
          organization_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          logo_url: string | null
          max_api_keys: number
          max_members: number
          metadata: Json | null
          name: string
          plan: string
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          logo_url?: string | null
          max_api_keys?: number
          max_members?: number
          metadata?: Json | null
          name: string
          plan?: string
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          logo_url?: string | null
          max_api_keys?: number
          max_members?: number
          metadata?: Json | null
          name?: string
          plan?: string
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          organization: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          organization?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          organization?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          keys: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          keys: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          keys?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rci_history: {
        Row: {
          circular_capacity: number | null
          human_capacity: number | null
          id: string
          land_capacity: number | null
          ocean_capacity: number | null
          rci_score: number
          recorded_at: string
          region_id: string
        }
        Insert: {
          circular_capacity?: number | null
          human_capacity?: number | null
          id?: string
          land_capacity?: number | null
          ocean_capacity?: number | null
          rci_score: number
          recorded_at?: string
          region_id: string
        }
        Update: {
          circular_capacity?: number | null
          human_capacity?: number | null
          id?: string
          land_capacity?: number | null
          ocean_capacity?: number | null
          rci_score?: number
          recorded_at?: string
          region_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rci_history_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "rci_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      rci_regions: {
        Row: {
          circular_capacity: number | null
          human_capacity: number | null
          id: string
          land_capacity: number | null
          last_updated: string | null
          ocean_capacity: number | null
          rci_score: number
          rci_trend: string | null
          region_code: string
          region_name: string
        }
        Insert: {
          circular_capacity?: number | null
          human_capacity?: number | null
          id?: string
          land_capacity?: number | null
          last_updated?: string | null
          ocean_capacity?: number | null
          rci_score?: number
          rci_trend?: string | null
          region_code: string
          region_name: string
        }
        Update: {
          circular_capacity?: number | null
          human_capacity?: number | null
          id?: string
          land_capacity?: number | null
          last_updated?: string | null
          ocean_capacity?: number | null
          rci_score?: number
          rci_trend?: string | null
          region_code?: string
          region_name?: string
        }
        Relationships: []
      }
      sovereign_analytics: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          metric_date: string
          metric_type: string
          metric_value: number
          region_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_date: string
          metric_type: string
          metric_value: number
          region_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_date?: string
          metric_type?: string
          metric_value?: number
          region_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sovereign_analytics_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "rci_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      sovereign_bonds: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bond_name: string
          bond_type: string
          coupon_rate: number
          created_at: string
          created_by: string
          id: string
          issue_date: string
          maturity_date: string
          metadata: Json | null
          principal_amount: number
          rci_linked: boolean
          rci_threshold: number | null
          region_id: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bond_name: string
          bond_type?: string
          coupon_rate?: number
          created_at?: string
          created_by: string
          id?: string
          issue_date?: string
          maturity_date: string
          metadata?: Json | null
          principal_amount: number
          rci_linked?: boolean
          rci_threshold?: number | null
          region_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bond_name?: string
          bond_type?: string
          coupon_rate?: number
          created_at?: string
          created_by?: string
          id?: string
          issue_date?: string
          maturity_date?: string
          metadata?: Json | null
          principal_amount?: number
          rci_linked?: boolean
          rci_threshold?: number | null
          region_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sovereign_bonds_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "rci_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          dashboard_density: string | null
          id: string
          notification_settings: Json | null
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dashboard_density?: string | null
          id?: string
          notification_settings?: Json | null
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dashboard_density?: string | null
          id?: string
          notification_settings?: Json | null
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_region_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          region_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          region_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          region_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_region_assignments_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "rci_regions"
            referencedColumns: ["id"]
          },
        ]
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
      verification_requests: {
        Row: {
          created_at: string
          created_by: string
          credit_amount: number
          credit_type: string
          description: string | null
          evidence_urls: string[] | null
          id: string
          region_id: string
          required_signatures: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          credit_amount: number
          credit_type: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          region_id: string
          required_signatures?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          credit_amount?: number
          credit_type?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          region_id?: string
          required_signatures?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "rci_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_signatures: {
        Row: {
          comment: string | null
          id: string
          request_id: string
          signature_type: string
          signed_at: string
          signer_id: string
        }
        Insert: {
          comment?: string | null
          id?: string
          request_id: string
          signature_type: string
          signed_at?: string
          signer_id: string
        }
        Update: {
          comment?: string | null
          id?: string
          request_id?: string
          signature_type?: string
          signed_at?: string
          signer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_signatures_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "verification_requests"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "sovereign" | "investor" | "scientist" | "community" | "admin"
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
      app_role: ["sovereign", "investor", "scientist", "community", "admin"],
    },
  },
} as const
