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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      billing_customers: {
        Row: {
          created_at: string
          stripe_customer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          stripe_customer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          stripe_customer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_confirmations: {
        Row: {
          confirmed_at: string
          expense_id: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string
          expense_id: string
          user_id: string
        }
        Update: {
          confirmed_at?: string
          expense_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_confirmations_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_confirmations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_payers: {
        Row: {
          amount_cents: number
          expense_id: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          expense_id: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          expense_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_payers_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_payers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_shares: {
        Row: {
          amount_cents: number
          expense_id: string
          user_id: string
          weight: number | null
        }
        Insert: {
          amount_cents: number
          expense_id: string
          user_id: string
          weight?: number | null
        }
        Update: {
          amount_cents?: number
          expense_id?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_shares_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount_cents: number
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          deleted_by: string | null
          description: string
          household_id: string
          id: string
          rejected_by: string | null
          rejected_reason: string | null
          source: Database["public"]["Enums"]["expense_source"]
          spent_on: string
          split_method: Database["public"]["Enums"]["expense_split_method"]
          status: Database["public"]["Enums"]["triqui_status"]
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          amount_cents: number
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description: string
          household_id: string
          id?: string
          rejected_by?: string | null
          rejected_reason?: string | null
          source?: Database["public"]["Enums"]["expense_source"]
          spent_on?: string
          split_method: Database["public"]["Enums"]["expense_split_method"]
          status?: Database["public"]["Enums"]["triqui_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          amount_cents?: number
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string
          household_id?: string
          id?: string
          rejected_by?: string | null
          rejected_reason?: string | null
          source?: Database["public"]["Enums"]["expense_source"]
          spent_on?: string
          split_method?: Database["public"]["Enums"]["expense_split_method"]
          status?: Database["public"]["Enums"]["triqui_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      guardianships: {
        Row: {
          created_at: string
          guardian_id: string
          minor_id: string
        }
        Insert: {
          created_at?: string
          guardian_id: string
          minor_id: string
        }
        Update: {
          created_at?: string
          guardian_id?: string
          minor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardianships_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardianships_minor_id_fkey"
            columns: ["minor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          household_id: string
          joined_at: string
          left_at: string | null
          role: Database["public"]["Enums"]["household_role"]
          user_id: string
        }
        Insert: {
          household_id: string
          joined_at?: string
          left_at?: string | null
          role?: Database["public"]["Enums"]["household_role"]
          user_id: string
        }
        Update: {
          household_id?: string
          joined_at?: string
          left_at?: string | null
          role?: Database["public"]["Enums"]["household_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          currency: string
          id: string
          invite_code: string
          kind: Database["public"]["Enums"]["household_kind"]
          name: string
          timezone: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          invite_code?: string
          kind?: Database["public"]["Enums"]["household_kind"]
          name: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          invite_code?: string
          kind?: Database["public"]["Enums"]["household_kind"]
          name?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "households_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_consents: {
        Row: {
          accepted_at: string
          accepted_by: string
          document: string
          id: number
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          accepted_by: string
          document: string
          id?: never
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          accepted_by?: string
          document?: string
          id?: never
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_consents_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          display_name: string
          id: string
          is_minor: boolean
          locale: string
          timezone: string
          updated_at: string
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name: string
          id: string
          is_minor?: boolean
          locale?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          id?: string
          is_minor?: boolean
          locale?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      settlements: {
        Row: {
          amount_cents: number
          confirmed_at: string | null
          created_at: string
          from_user: string
          household_id: string
          id: string
          settled_on: string
          status: Database["public"]["Enums"]["triqui_status"]
          to_user: string
        }
        Insert: {
          amount_cents: number
          confirmed_at?: string | null
          created_at?: string
          from_user: string
          household_id: string
          id?: string
          settled_on?: string
          status?: Database["public"]["Enums"]["triqui_status"]
          to_user: string
        }
        Update: {
          amount_cents?: number
          confirmed_at?: string | null
          created_at?: string
          from_user?: string
          household_id?: string
          id?: string
          settled_on?: string
          status?: Database["public"]["Enums"]["triqui_status"]
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_items: {
        Row: {
          checked_at: string | null
          checked_by: string | null
          created_at: string
          household_id: string | null
          id: string
          name: string
          owner_id: string | null
          quantity: number
          requested_by: string | null
          updated_at: string
        }
        Insert: {
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          household_id?: string | null
          id?: string
          name: string
          owner_id?: string | null
          quantity?: number
          requested_by?: string | null
          updated_at?: string
        }
        Update: {
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          household_id?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          quantity?: number
          requested_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_items_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          price_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id: string
          price_id: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          price_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
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
      accept_legal_document: {
        Args: { p_document: string; p_version: string }
        Returns: undefined
      }
      can_access_triqui: { Args: { hid: string }; Returns: boolean }
      can_see_profile: { Args: { other: string }; Returns: boolean }
      cancel_payment: { Args: { p_settlement: string }; Returns: undefined }
      confirm_expense: {
        Args: { p_expense: string; p_version: number }
        Returns: undefined
      }
      confirm_payment: { Args: { p_settlement: string }; Returns: undefined }
      create_expense: {
        Args: {
          p_amount_cents: number
          p_description: string
          p_household: string
          p_payers: Json
          p_shares: Json
          p_spent_on: string
          p_split_method: Database["public"]["Enums"]["expense_split_method"]
        }
        Returns: string
      }
      create_household: {
        Args: {
          p_kind?: Database["public"]["Enums"]["household_kind"]
          p_name: string
        }
        Returns: string
      }
      delete_expense: {
        Args: { p_expense: string; p_version: number }
        Returns: undefined
      }
      depart_member: {
        Args: { p_household: string; p_successor?: string; p_user: string }
        Returns: undefined
      }
      force_confirm_expense: {
        Args: { p_expense: string; p_version: number }
        Returns: undefined
      }
      get_invite_preview: {
        Args: { p_code: string }
        Returns: {
          already_member: boolean
          household_id: string
          kind: Database["public"]["Enums"]["household_kind"]
          member_count: number
          name: string
        }[]
      }
      get_triqui_balances: {
        Args: { p_household: string }
        Returns: {
          display_name: string
          is_current: boolean
          net_cents: number
          user_id: string
        }[]
      }
      get_triqui_context: {
        Args: { p_household: string }
        Returns: {
          is_admin: boolean
          is_current: boolean
          name: string
          timezone: string
        }[]
      }
      is_guardian_of: { Args: { p_minor: string }; Returns: boolean }
      is_household_admin: { Args: { hid: string }; Returns: boolean }
      is_household_adult: { Args: { hid: string }; Returns: boolean }
      is_household_member: { Args: { hid: string }; Returns: boolean }
      is_household_resident: { Args: { hid: string }; Returns: boolean }
      is_valid_timezone: { Args: { tz: string }; Returns: boolean }
      join_household: { Args: { p_code: string }; Returns: string }
      leave_household: {
        Args: { p_household: string; p_successor?: string }
        Returns: undefined
      }
      my_archived_households: {
        Args: never
        Returns: {
          archived_at: string
          household_id: string
          name: string
        }[]
      }
      my_triqui_debts: {
        Args: never
        Returns: {
          household_id: string
          name: string
          net_cents: number
        }[]
      }
      record_payment: {
        Args: {
          p_amount_cents: number
          p_from: string
          p_household: string
          p_settled_on?: string
          p_to: string
        }
        Returns: string
      }
      regenerate_invite_code: { Args: { p_household: string }; Returns: string }
      reject_expense: {
        Args: { p_expense: string; p_reason?: string; p_version: number }
        Returns: undefined
      }
      reject_payment: { Args: { p_settlement: string }; Returns: undefined }
      remove_member: {
        Args: { p_household: string; p_user: string }
        Returns: undefined
      }
      restore_household: { Args: { p_household: string }; Returns: undefined }
      set_member_role: {
        Args: {
          p_household: string
          p_role: Database["public"]["Enums"]["household_role"]
          p_user: string
        }
        Returns: undefined
      }
      share_shopping_item: {
        Args: { p_household: string; p_item: string }
        Returns: undefined
      }
      shares_household_with: { Args: { other: string }; Returns: boolean }
      triqui_can_answer_payment: {
        Args: { st: Database["public"]["Tables"]["settlements"]["Row"] }
        Returns: boolean
      }
      triqui_check_date: { Args: { p_date: string }; Returns: undefined }
      triqui_is_participant: {
        Args: { p_expense: string; p_user: string }
        Returns: boolean
      }
      triqui_net_cents: {
        Args: { p_household: string; p_user: string }
        Returns: number
      }
      triqui_refresh_status: { Args: { p_expense: string }; Returns: undefined }
      triqui_save_parts: {
        Args: {
          p_expense: string
          p_household: string
          p_method: Database["public"]["Enums"]["expense_split_method"]
          p_payers: Json
          p_previous: string[]
          p_shares: Json
          p_total: number
        }
        Returns: undefined
      }
      triqui_split: {
        Args: {
          p_method: Database["public"]["Enums"]["expense_split_method"]
          p_shares: Json
          p_total: number
        }
        Returns: {
          amount_cents: number
          user_id: string
          weight: number
        }[]
      }
      update_expense: {
        Args: {
          p_amount_cents: number
          p_description: string
          p_expense: string
          p_payers: Json
          p_shares: Json
          p_spent_on: string
          p_split_method: Database["public"]["Enums"]["expense_split_method"]
          p_version: number
        }
        Returns: undefined
      }
    }
    Enums: {
      account_type: "resident" | "professional"
      expense_source: "manual" | "shopping" | "recurring" | "landlord"
      expense_split_method: "equal" | "shares" | "exact"
      household_kind: "shared_flat" | "student_flat" | "couple" | "family"
      household_role: "admin" | "member" | "minor" | "landlord"
      triqui_status: "pending" | "confirmed" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_type: ["resident", "professional"],
      expense_source: ["manual", "shopping", "recurring", "landlord"],
      expense_split_method: ["equal", "shares", "exact"],
      household_kind: ["shared_flat", "student_flat", "couple", "family"],
      household_role: ["admin", "member", "minor", "landlord"],
      triqui_status: ["pending", "confirmed", "rejected"],
    },
  },
} as const
