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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          organization_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          organization_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          organization_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          cost_per_unit: number
          created_at: string
          current_stock: number
          id: string
          low_stock_threshold: number
          name: string
          organization_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          cost_per_unit?: number
          created_at?: string
          current_stock?: number
          id?: string
          low_stock_threshold?: number
          name: string
          organization_id: string
          unit?: string
          updated_at?: string
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          current_stock?: number
          id?: string
          low_stock_threshold?: number
          name?: string
          organization_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          gst_rate: number
          id: string
          image_url: string | null
          is_available: boolean
          is_veg: boolean
          name: string
          organization_id: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          gst_rate?: number
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_veg?: boolean
          name: string
          organization_id: string
          price: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          gst_rate?: number
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_veg?: boolean
          name?: string
          organization_id?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          gst_rate: number
          id: string
          item_name: string
          kot_sent_at: string | null
          kot_status: Database["public"]["Enums"]["kot_status"]
          menu_item_id: string
          modifiers: string | null
          notes: string | null
          order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          gst_rate: number
          id?: string
          item_name: string
          kot_sent_at?: string | null
          kot_status?: Database["public"]["Enums"]["kot_status"]
          menu_item_id: string
          modifiers?: string | null
          notes?: string | null
          order_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          gst_rate?: number
          id?: string
          item_name?: string
          kot_sent_at?: string | null
          kot_status?: Database["public"]["Enums"]["kot_status"]
          menu_item_id?: string
          modifiers?: string | null
          notes?: string | null
          order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cgst_amount: number
          created_at: string
          created_by: string | null
          customer_address: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number
          discount_reason: string | null
          id: string
          notes: string | null
          order_number: number
          order_type: Database["public"]["Enums"]["order_type"]
          organization_id: string
          sgst_amount: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          table_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          cgst_amount?: number
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          discount_reason?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          order_type?: Database["public"]["Enums"]["order_type"]
          organization_id: string
          sgst_amount?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          cgst_amount?: number
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          discount_reason?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          order_type?: Database["public"]["Enums"]["order_type"]
          organization_id?: string
          sgst_amount?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          gstin: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          organization_id: string | null
          pin_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          organization_id?: string | null
          pin_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          organization_id?: string | null
          pin_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          id: string
          inventory_item_id: string
          menu_item_id: string
          quantity_required: number
        }
        Insert: {
          id?: string
          inventory_item_id: string
          menu_item_id: string
          quantity_required: number
        }
        Update: {
          id?: string
          inventory_item_id?: string
          menu_item_id?: string
          quantity_required?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          capacity: number
          created_at: string
          floor: string | null
          id: string
          organization_id: string
          pos_x: number | null
          pos_y: number | null
          section: string | null
          status: Database["public"]["Enums"]["table_status"]
          table_number: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          floor?: string | null
          id?: string
          organization_id: string
          pos_x?: number | null
          pos_y?: number | null
          section?: string | null
          status?: Database["public"]["Enums"]["table_status"]
          table_number: string
        }
        Update: {
          capacity?: number
          created_at?: string
          floor?: string | null
          id?: string
          organization_id?: string
          pos_x?: number | null
          pos_y?: number | null
          section?: string | null
          status?: Database["public"]["Enums"]["table_status"]
          table_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          organization_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          processed_by: string | null
          reference_number: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_id: string
          organization_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          processed_by?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          organization_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          processed_by?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "cashier" | "waiter" | "kitchen_staff"
      kot_status: "pending" | "preparing" | "ready" | "served"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "served"
        | "completed"
        | "cancelled"
      order_type: "dine_in" | "takeaway" | "delivery"
      payment_method: "cash" | "card" | "upi"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      table_status: "vacant" | "occupied" | "dirty"
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
      app_role: ["admin", "manager", "cashier", "waiter", "kitchen_staff"],
      kot_status: ["pending", "preparing", "ready", "served"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "served",
        "completed",
        "cancelled",
      ],
      order_type: ["dine_in", "takeaway", "delivery"],
      payment_method: ["cash", "card", "upi"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      table_status: ["vacant", "occupied", "dirty"],
    },
  },
} as const
