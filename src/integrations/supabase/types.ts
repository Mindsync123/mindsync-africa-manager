export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      business_profiles: {
        Row: {
          business_email: string | null
          business_name: string
          created_at: string | null
          id: string
          industry: string | null
          logo_url: string | null
          paystack_connected: boolean | null
          phone: string
          plan_id: string
          tax_status: string | null
          updated_at: string | null
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          business_email?: string | null
          business_name: string
          created_at?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          paystack_connected?: boolean | null
          phone: string
          plan_id: string
          tax_status?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          business_email?: string | null
          business_name?: string
          created_at?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          paystack_connected?: boolean | null
          phone?: string
          plan_id?: string
          tax_status?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_name: string
          account_type: string | null
          business_id: string
          created_at: string | null
          id: string
          parent_id: string | null
        }
        Insert: {
          account_name: string
          account_type?: string | null
          business_id: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
        }
        Update: {
          account_name?: string
          account_type?: string | null
          business_id?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          balance: number | null
          business_id: string
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          balance?: number | null
          business_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          balance?: number | null
          business_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          id: string
          invoice_id: string
          product_id: string
          purchase_cost: number | null
          quantity: number
          total_amount: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          invoice_id: string
          product_id: string
          purchase_cost?: number | null
          quantity: number
          total_amount: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          invoice_id?: string
          product_id?: string
          purchase_cost?: number | null
          quantity?: number
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount_paid: number
          created_at: string | null
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number | null
          business_id: string
          created_at: string | null
          customer_id: string | null
          due_date: string | null
          id: string
          invoice_number: string
          paystack_payment_url: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          business_id: string
          created_at?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          paystack_payment_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          business_id?: string
          created_at?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          paystack_payment_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string | null
          features_list: string[] | null
          id: string
          monthly_price: number
          name: Database["public"]["Enums"]["plan_type"]
        }
        Insert: {
          created_at?: string | null
          features_list?: string[] | null
          id?: string
          monthly_price: number
          name: Database["public"]["Enums"]["plan_type"]
        }
        Update: {
          created_at?: string | null
          features_list?: string[] | null
          id?: string
          monthly_price?: number
          name?: Database["public"]["Enums"]["plan_type"]
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          business_id: string
          category_id: string | null
          created_at: string | null
          id: string
          name: string
          purchase_cost: number | null
          reorder_level: number | null
          sku: string | null
          stock_quantity: number | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          business_id: string
          category_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          purchase_cost?: number | null
          reorder_level?: number | null
          sku?: string | null
          stock_quantity?: number | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          business_id?: string
          category_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          purchase_cost?: number | null
          reorder_level?: number | null
          sku?: string | null
          stock_quantity?: number | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount_paid: number
          created_at: string | null
          id: string
          invoice_id: string
          payment_date: string
          payment_method: string | null
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          id?: string
          invoice_id: string
          payment_date: string
          payment_method?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          id?: string
          invoice_id?: string
          payment_date?: string
          payment_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          type: Database["public"]["Enums"]["stock_movement_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          type: Database["public"]["Enums"]["stock_movement_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          type?: Database["public"]["Enums"]["stock_movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          next_payment_due: string | null
          payment_status: string | null
          paystack_subscription_code: string | null
          plan_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          next_payment_due?: string | null
          payment_status?: string | null
          paystack_subscription_code?: string | null
          plan_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          next_payment_due?: string | null
          payment_status?: string | null
          paystack_subscription_code?: string | null
          plan_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          bank_account_id: string | null
          business_id: string
          category_id: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          reference_number: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          business_id: string
          category_id?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          reference_number?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          business_id?: string
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          reference_number?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          business_id: string
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_business_access: {
        Args: { _user_id: string; _business_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "storekeeper" | "accountant" | "sales"
      invoice_status: "paid" | "unpaid" | "part_paid"
      plan_type: "basic" | "standard" | "premium"
      stock_movement_type: "in" | "out" | "transfer"
      transaction_type: "income" | "expense" | "transfer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "storekeeper", "accountant", "sales"],
      invoice_status: ["paid", "unpaid", "part_paid"],
      plan_type: ["basic", "standard", "premium"],
      stock_movement_type: ["in", "out", "transfer"],
      transaction_type: ["income", "expense", "transfer"],
    },
  },
} as const
