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
      absences: {
        Row: {
          created_at: string
          ends_on: string
          household_id: string
          id: string
          note: string | null
          starts_on: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          household_id: string
          id?: string
          note?: string | null
          starts_on: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          household_id?: string
          id?: string
          note?: string | null
          starts_on?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "absences_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      chore_occurrences: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assignee_id: string | null
          chore_id: string
          created_at: string
          done_at: string | null
          done_by: string | null
          due_on: string
          household_id: string
          id: string
          manual: boolean
          pointer_before: number | null
          reopened_at: string | null
          reopened_by: string | null
          repaid_user: string | null
          skipped_users: string[]
          status: Database["public"]["Enums"]["chore_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assignee_id?: string | null
          chore_id: string
          created_at?: string
          done_at?: string | null
          done_by?: string | null
          due_on: string
          household_id: string
          id?: string
          manual?: boolean
          pointer_before?: number | null
          reopened_at?: string | null
          reopened_by?: string | null
          repaid_user?: string | null
          skipped_users?: string[]
          status?: Database["public"]["Enums"]["chore_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assignee_id?: string | null
          chore_id?: string
          created_at?: string
          done_at?: string | null
          done_by?: string | null
          due_on?: string
          household_id?: string
          id?: string
          manual?: boolean
          pointer_before?: number | null
          reopened_at?: string | null
          reopened_by?: string | null
          repaid_user?: string | null
          skipped_users?: string[]
          status?: Database["public"]["Enums"]["chore_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chore_occurrences_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chore_occurrences_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chore_occurrences_chore_id_fkey"
            columns: ["chore_id"]
            isOneToOne: false
            referencedRelation: "chores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chore_occurrences_done_by_fkey"
            columns: ["done_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chore_occurrences_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chore_occurrences_reopened_by_fkey"
            columns: ["reopened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chore_rotation: {
        Row: {
          chore_id: string
          owed: boolean
          position: number
          user_id: string
        }
        Insert: {
          chore_id: string
          owed?: boolean
          position: number
          user_id: string
        }
        Update: {
          chore_id?: string
          owed?: boolean
          position?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chore_rotation_chore_id_fkey"
            columns: ["chore_id"]
            isOneToOne: false
            referencedRelation: "chores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chore_rotation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chores: {
        Row: {
          active: boolean
          assignee_id: string | null
          assignment: Database["public"]["Enums"]["chore_assignment"]
          created_at: string
          created_by: string | null
          effort: number
          frequency: Database["public"]["Enums"]["chore_frequency"]
          generated_until: string | null
          household_id: string
          id: string
          interval_count: number
          notes: string | null
          requires_approval: boolean
          rotation_next: number
          starts_on: string
          title: string
          updated_at: string
          weekdays: number[] | null
        }
        Insert: {
          active?: boolean
          assignee_id?: string | null
          assignment: Database["public"]["Enums"]["chore_assignment"]
          created_at?: string
          created_by?: string | null
          effort?: number
          frequency: Database["public"]["Enums"]["chore_frequency"]
          generated_until?: string | null
          household_id: string
          id?: string
          interval_count?: number
          notes?: string | null
          requires_approval?: boolean
          rotation_next?: number
          starts_on: string
          title: string
          updated_at?: string
          weekdays?: number[] | null
        }
        Update: {
          active?: boolean
          assignee_id?: string | null
          assignment?: Database["public"]["Enums"]["chore_assignment"]
          created_at?: string
          created_by?: string | null
          effort?: number
          frequency?: Database["public"]["Enums"]["chore_frequency"]
          generated_until?: string | null
          household_id?: string
          id?: string
          interval_count?: number
          notes?: string | null
          requires_approval?: boolean
          rotation_next?: number
          starts_on?: string
          title?: string
          updated_at?: string
          weekdays?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "chores_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chores_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chores_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_reads: {
        Row: {
          conversation_id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_reads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          household_id: string | null
          id: string
          kind: Database["public"]["Enums"]["conversation_kind"]
        }
        Insert: {
          created_at?: string
          household_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["conversation_kind"]
        }
        Update: {
          created_at?: string
          household_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["conversation_kind"]
        }
        Relationships: [
          {
            foreignKeyName: "conversations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
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
      expense_items: {
        Row: {
          expense_id: string
          name: string
          position: number
          quantity: number
        }
        Insert: {
          expense_id: string
          name: string
          position: number
          quantity?: number
        }
        Update: {
          expense_id?: string
          name?: string
          position?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "expense_items_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
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
          recurring_charge: number | null
          recurring_id: string | null
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
          recurring_charge?: number | null
          recurring_id?: string | null
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
          recurring_charge?: number | null
          recurring_id?: string | null
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
          {
            foreignKeyName: "expenses_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurring_expenses"
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
      message_edits: {
        Row: {
          body: string
          id: string
          message_id: string
          replaced_at: string
          written_at: string
        }
        Insert: {
          body: string
          id?: string
          message_id: string
          replaced_at?: string
          written_at: string
        }
        Update: {
          body?: string
          id?: string
          message_id?: string
          replaced_at?: string
          written_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_edits_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_hidden: {
        Row: {
          hidden_at: string
          message_id: string
          user_id: string
        }
        Insert: {
          hidden_at?: string
          message_id: string
          user_id: string
        }
        Update: {
          hidden_at?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_hidden_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_hidden_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          edited_at: string | null
          id: string
          sender_id: string | null
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          sender_id?: string | null
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          category: Database["public"]["Enums"]["notification_category"]
          push: boolean
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["notification_category"]
          push?: boolean
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["notification_category"]
          push?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          data: Json
          dedupe_key: string | null
          household_id: string | null
          id: string
          in_app: boolean
          push_state: Database["public"]["Enums"]["push_state"]
          read_at: string | null
          ref_id: string | null
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          data?: Json
          dedupe_key?: string | null
          household_id?: string | null
          id?: string
          in_app?: boolean
          push_state?: Database["public"]["Enums"]["push_state"]
          read_at?: string | null
          ref_id?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          data?: Json
          dedupe_key?: string | null
          household_id?: string | null
          id?: string
          in_app?: boolean
          push_state?: Database["public"]["Enums"]["push_state"]
          read_at?: string | null
          ref_id?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_seen_at: string
          locale: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_seen_at?: string
          locale?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_seen_at?: string
          locale?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_expense_confirmations: {
        Row: {
          confirmed_at: string
          recurring_id: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string
          recurring_id: string
          user_id: string
        }
        Update: {
          confirmed_at?: string
          recurring_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_expense_confirmations_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurring_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expense_confirmations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_expense_shares: {
        Row: {
          recurring_id: string
          user_id: string
          weight: number | null
        }
        Insert: {
          recurring_id: string
          user_id: string
          weight?: number | null
        }
        Update: {
          recurring_id?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_expense_shares_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurring_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expense_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_expenses: {
        Row: {
          active: boolean
          amount_cents: number
          charges_made: number
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          description: string
          first_confirmed_at: string | null
          frequency: Database["public"]["Enums"]["recurring_frequency"]
          household_id: string
          id: string
          interval_count: number
          next_charge_on: string
          paid_by: string
          rejected_by: string | null
          rejected_reason: string | null
          split_method: Database["public"]["Enums"]["expense_split_method"]
          starts_on: string
          status: Database["public"]["Enums"]["triqui_status"]
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          active?: boolean
          amount_cents: number
          charges_made?: number
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          first_confirmed_at?: string | null
          frequency: Database["public"]["Enums"]["recurring_frequency"]
          household_id: string
          id?: string
          interval_count?: number
          next_charge_on: string
          paid_by: string
          rejected_by?: string | null
          rejected_reason?: string | null
          split_method: Database["public"]["Enums"]["expense_split_method"]
          starts_on: string
          status?: Database["public"]["Enums"]["triqui_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          active?: boolean
          amount_cents?: number
          charges_made?: number
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          first_confirmed_at?: string | null
          frequency?: Database["public"]["Enums"]["recurring_frequency"]
          household_id?: string
          id?: string
          interval_count?: number
          next_charge_on?: string
          paid_by?: string
          rejected_by?: string | null
          rejected_reason?: string | null
          split_method?: Database["public"]["Enums"]["expense_split_method"]
          starts_on?: string
          status?: Database["public"]["Enums"]["triqui_status"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_blocks: {
        Row: {
          created_at: string
          ends_at: string
          household_id: string
          id: string
          kind: Database["public"]["Enums"]["schedule_kind"]
          label: string | null
          starts_at: string
          updated_at: string
          user_id: string
          weekday: number
        }
        Insert: {
          created_at?: string
          ends_at: string
          household_id: string
          id?: string
          kind?: Database["public"]["Enums"]["schedule_kind"]
          label?: string | null
          starts_at: string
          updated_at?: string
          user_id: string
          weekday: number
        }
        Update: {
          created_at?: string
          ends_at?: string
          household_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["schedule_kind"]
          label?: string | null
          starts_at?: string
          updated_at?: string
          user_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      absence_check: {
        Args: {
          p_ends: string
          p_except: string
          p_household: string
          p_starts: string
          p_user: string
        }
        Returns: undefined
      }
      accept_legal_document: {
        Args: { p_document: string; p_version: string }
        Returns: undefined
      }
      add_schedule_blocks: {
        Args: {
          p_ends_at: string
          p_household: string
          p_kind: Database["public"]["Enums"]["schedule_kind"]
          p_label?: string
          p_starts_at: string
          p_user?: string
          p_weekdays: number[]
        }
        Returns: number
      }
      approve_chore: { Args: { p_occurrence: string }; Returns: undefined }
      can_access_triqui: { Args: { hid: string }; Returns: boolean }
      can_see_profile: { Args: { other: string }; Returns: boolean }
      cancel_payment: { Args: { p_settlement: string }; Returns: undefined }
      chat_can_access: { Args: { p_conversation: string }; Returns: boolean }
      chat_member: {
        Args: { p_conversation: string; p_user: string }
        Returns: boolean
      }
      chat_people: {
        Args: { p_conversation: string }
        Returns: {
          display_name: string
          is_member: boolean
          user_id: string
        }[]
      }
      chat_summary: {
        Args: { p_household: string }
        Returns: {
          conversation_id: string
          last_at: string
          last_body: string
          last_sender: string
          unread: number
        }[]
      }
      chore_check: {
        Args: {
          p_assignment: Database["public"]["Enums"]["chore_assignment"]
          p_check_start: boolean
          p_frequency: Database["public"]["Enums"]["chore_frequency"]
          p_household: string
          p_people: string[]
          p_starts_on: string
          p_weekdays: number[]
        }
        Returns: number[]
      }
      chore_is_absent: {
        Args: { p_day: string; p_household: string; p_user: string }
        Returns: boolean
      }
      chore_occurrence_for_update: {
        Args: { p_occurrence: string }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          assignee_id: string | null
          chore_id: string
          created_at: string
          done_at: string | null
          done_by: string | null
          due_on: string
          household_id: string
          id: string
          manual: boolean
          pointer_before: number | null
          reopened_at: string | null
          reopened_by: string | null
          repaid_user: string | null
          skipped_users: string[]
          status: Database["public"]["Enums"]["chore_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "chore_occurrences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      chore_occurs_on: {
        Args: {
          p_day: string
          p_frequency: Database["public"]["Enums"]["chore_frequency"]
          p_interval: number
          p_starts: string
          p_weekdays: number[]
        }
        Returns: boolean
      }
      chore_pick_rotation: {
        Args: { p_chore: string; p_day: string; p_household: string }
        Returns: Record<string, unknown>
      }
      chore_reset_from: {
        Args: { p_chore: string; p_from: string }
        Returns: undefined
      }
      chores_generate: { Args: { p_household: string }; Returns: number }
      chores_redo_rotations: {
        Args: { p_from: string; p_household: string }
        Returns: undefined
      }
      complete_chore: { Args: { p_occurrence: string }; Returns: undefined }
      confirm_expense: {
        Args: { p_expense: string; p_version: number }
        Returns: undefined
      }
      confirm_payment: { Args: { p_settlement: string }; Returns: undefined }
      confirm_recurring_expense: {
        Args: { p_recurring: string; p_version: number }
        Returns: undefined
      }
      copy_schedule: { Args: { p_from: string; p_to: string }; Returns: number }
      create_chore: {
        Args: {
          p_assignment: Database["public"]["Enums"]["chore_assignment"]
          p_effort: number
          p_frequency: Database["public"]["Enums"]["chore_frequency"]
          p_household: string
          p_interval: number
          p_notes?: string
          p_people: string[]
          p_requires_approval?: boolean
          p_starts_on: string
          p_title: string
          p_weekdays: number[]
        }
        Returns: string
      }
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
      create_expense_from_shopping: {
        Args: {
          p_amount_cents: number
          p_description: string
          p_household: string
          p_items: string[]
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
      create_recurring_expense: {
        Args: {
          p_amount_cents: number
          p_description: string
          p_frequency: Database["public"]["Enums"]["recurring_frequency"]
          p_household: string
          p_interval?: number
          p_paid_by: string
          p_shares: Json
          p_split_method: Database["public"]["Enums"]["expense_split_method"]
          p_starts_on: string
        }
        Returns: string
      }
      delete_absence: { Args: { p_absence: string }; Returns: undefined }
      delete_chore: { Args: { p_chore: string }; Returns: undefined }
      delete_expense: {
        Args: { p_expense: string; p_version: number }
        Returns: undefined
      }
      delete_push_subscription: {
        Args: { p_endpoint: string }
        Returns: undefined
      }
      delete_recurring_expense: {
        Args: { p_recurring: string; p_version: number }
        Returns: undefined
      }
      delete_schedule_block: { Args: { p_block: string }; Returns: undefined }
      depart_member: {
        Args: { p_household: string; p_successor?: string; p_user: string }
        Returns: undefined
      }
      edit_message: {
        Args: { p_body: string; p_message: string }
        Returns: {
          body: string
          conversation_id: string
          created_at: string
          edited_at: string | null
          id: string
          sender_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      force_confirm_expense: {
        Args: { p_expense: string; p_version: number }
        Returns: undefined
      }
      get_chat: {
        Args: { p_household: string }
        Returns: {
          conversation_id: string
          household_name: string
          is_resident: boolean
          timezone: string
        }[]
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
      hide_message: { Args: { p_message: string }; Returns: undefined }
      household_has_resident: {
        Args: { p_household: string; p_user: string }
        Returns: boolean
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
      mark_chat_read: { Args: { p_conversation: string }; Returns: undefined }
      mark_notifications_read: {
        Args: { p_ids?: string[] }
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
      notification_category_of: {
        Args: { p_type: Database["public"]["Enums"]["notification_type"] }
        Returns: Database["public"]["Enums"]["notification_category"]
      }
      notifications_resolve: {
        Args: {
          p_ref: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_user?: string
        }
        Returns: undefined
      }
      notify: {
        Args: {
          p_actor: string
          p_data: Json
          p_dedupe?: string
          p_household: string
          p_in_app?: boolean
          p_ref: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_url: string
          p_user: string
        }
        Returns: string
      }
      push_claim: {
        Args: { p_limit?: number; p_secret: string }
        Returns: {
          auth: string
          data: Json
          endpoint: string
          locale: string
          notification_id: string
          p256dh: string
          ref_id: string
          type: Database["public"]["Enums"]["notification_type"]
          url: string
        }[]
      }
      push_endpoint_allowed: { Args: { p_endpoint: string }; Returns: boolean }
      push_forget: {
        Args: { p_endpoints: string[]; p_secret: string }
        Returns: undefined
      }
      push_secret_ok: { Args: { p_secret: string }; Returns: boolean }
      reassign_chore: {
        Args: { p_occurrence: string; p_user?: string }
        Returns: undefined
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
      recurring_charge_date: {
        Args: {
          p_frequency: Database["public"]["Enums"]["recurring_frequency"]
          p_interval?: number
          p_n: number
          p_start: string
        }
        Returns: string
      }
      recurring_check_start: {
        Args: { p_start: string; p_today: string }
        Returns: undefined
      }
      recurring_first_from: {
        Args: {
          p_frequency: Database["public"]["Enums"]["recurring_frequency"]
          p_from: string
          p_interval?: number
          p_n: number
          p_start: string
        }
        Returns: number
      }
      recurring_generate: { Args: { p_household: string }; Returns: number }
      recurring_generate_all: { Args: never; Returns: number }
      recurring_has_charges: { Args: { p_recurring: string }; Returns: boolean }
      recurring_is_participant: {
        Args: { p_recurring: string; p_user: string }
        Returns: boolean
      }
      recurring_refresh_status: {
        Args: { p_recurring: string }
        Returns: undefined
      }
      recurring_save_parts: {
        Args: {
          p_amount: number
          p_household: string
          p_method: Database["public"]["Enums"]["expense_split_method"]
          p_paid_by: string
          p_recurring: string
          p_shares: Json
        }
        Returns: undefined
      }
      regenerate_invite_code: { Args: { p_household: string }; Returns: string }
      reject_expense: {
        Args: { p_expense: string; p_reason?: string; p_version: number }
        Returns: undefined
      }
      reject_payment: { Args: { p_settlement: string }; Returns: undefined }
      reject_recurring_expense: {
        Args: { p_reason?: string; p_recurring: string; p_version: number }
        Returns: undefined
      }
      remove_member: {
        Args: { p_household: string; p_user: string }
        Returns: undefined
      }
      reopen_chore: { Args: { p_occurrence: string }; Returns: undefined }
      restore_household: { Args: { p_household: string }; Returns: undefined }
      save_absence: {
        Args: {
          p_absence?: string
          p_ends_on: string
          p_household: string
          p_note?: string
          p_starts_on: string
          p_user?: string
        }
        Returns: string
      }
      save_push_subscription: {
        Args: {
          p_auth: string
          p_endpoint: string
          p_locale?: string
          p_p256dh: string
        }
        Returns: undefined
      }
      schedule_can_edit: {
        Args: { p_household: string; p_user: string }
        Returns: boolean
      }
      schedule_check_block: {
        Args: {
          p_ends: string
          p_except: string
          p_household: string
          p_starts: string
          p_user: string
          p_weekday: number
        }
        Returns: undefined
      }
      schedule_lock_person: {
        Args: { p_household: string; p_user: string }
        Returns: undefined
      }
      send_message: {
        Args: { p_body: string; p_conversation: string }
        Returns: {
          body: string
          conversation_id: string
          created_at: string
          edited_at: string | null
          id: string
          sender_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_member_role: {
        Args: {
          p_household: string
          p_role: Database["public"]["Enums"]["household_role"]
          p_user: string
        }
        Returns: undefined
      }
      set_notification_preference: {
        Args: {
          p_category: Database["public"]["Enums"]["notification_category"]
          p_push: boolean
        }
        Returns: undefined
      }
      set_recurring_expense_active: {
        Args: { p_active: boolean; p_recurring: string }
        Returns: undefined
      }
      share_shopping_item: {
        Args: { p_household: string; p_item: string }
        Returns: undefined
      }
      shares_household_with: { Args: { other: string }; Returns: boolean }
      sync_chores: { Args: { p_household: string }; Returns: number }
      sync_recurring_expenses: {
        Args: { p_household: string }
        Returns: number
      }
      take_chore: { Args: { p_occurrence: string }; Returns: undefined }
      triqui_can_answer_payment: {
        Args: { st: Database["public"]["Tables"]["settlements"]["Row"] }
        Returns: boolean
      }
      triqui_check_date: { Args: { p_date: string }; Returns: undefined }
      triqui_household_today: { Args: { p_household: string }; Returns: string }
      triqui_is_current_adult: {
        Args: { p_household: string; p_user: string }
        Returns: boolean
      }
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
      unhide_message: { Args: { p_message: string }; Returns: undefined }
      update_chore: {
        Args: {
          p_assignment: Database["public"]["Enums"]["chore_assignment"]
          p_chore: string
          p_effort: number
          p_frequency: Database["public"]["Enums"]["chore_frequency"]
          p_interval: number
          p_notes?: string
          p_people: string[]
          p_requires_approval?: boolean
          p_starts_on: string
          p_title: string
          p_weekdays: number[]
        }
        Returns: undefined
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
      update_recurring_expense: {
        Args: {
          p_amount_cents: number
          p_description: string
          p_frequency: Database["public"]["Enums"]["recurring_frequency"]
          p_interval?: number
          p_paid_by: string
          p_recurring: string
          p_shares: Json
          p_split_method: Database["public"]["Enums"]["expense_split_method"]
          p_starts_on: string
          p_version: number
        }
        Returns: undefined
      }
      update_schedule_block: {
        Args: {
          p_block: string
          p_ends_at: string
          p_kind: Database["public"]["Enums"]["schedule_kind"]
          p_label?: string
          p_starts_at: string
          p_weekday: number
        }
        Returns: undefined
      }
    }
    Enums: {
      account_type: "resident" | "professional"
      chore_assignment: "fixed" | "rotation" | "free"
      chore_frequency: "once" | "daily" | "weekly" | "monthly"
      chore_status: "pending" | "review" | "done"
      conversation_kind: "tenants" | "landlord" | "listing"
      expense_source: "manual" | "shopping" | "recurring" | "landlord"
      expense_split_method: "equal" | "shares" | "exact"
      household_kind: "shared_flat" | "student_flat" | "couple" | "family"
      household_role: "admin" | "member" | "minor" | "landlord"
      notification_category: "expenses" | "shopping" | "chores" | "chat"
      notification_type:
        | "expense_to_confirm"
        | "expense_rejected"
        | "payment_to_confirm"
        | "recurring_to_confirm"
        | "shopping_added"
        | "chore_reassigned"
        | "chore_reopened"
        | "chore_to_approve"
        | "chore_approved"
        | "message"
      push_state: "none" | "pending" | "sent" | "failed"
      recurring_frequency: "weekly" | "monthly" | "yearly"
      schedule_kind: "class" | "work" | "away"
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
      chore_assignment: ["fixed", "rotation", "free"],
      chore_frequency: ["once", "daily", "weekly", "monthly"],
      chore_status: ["pending", "review", "done"],
      conversation_kind: ["tenants", "landlord", "listing"],
      expense_source: ["manual", "shopping", "recurring", "landlord"],
      expense_split_method: ["equal", "shares", "exact"],
      household_kind: ["shared_flat", "student_flat", "couple", "family"],
      household_role: ["admin", "member", "minor", "landlord"],
      notification_category: ["expenses", "shopping", "chores", "chat"],
      notification_type: [
        "expense_to_confirm",
        "expense_rejected",
        "payment_to_confirm",
        "recurring_to_confirm",
        "shopping_added",
        "chore_reassigned",
        "chore_reopened",
        "chore_to_approve",
        "chore_approved",
        "message",
      ],
      push_state: ["none", "pending", "sent", "failed"],
      recurring_frequency: ["weekly", "monthly", "yearly"],
      schedule_kind: ["class", "work", "away"],
      triqui_status: ["pending", "confirmed", "rejected"],
    },
  },
} as const
