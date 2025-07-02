export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
  info: {
    Tables: {
      privacy_policy: {
        Row: {
          content: string
          created_at: string
          id: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          version?: number
        }
        Relationships: []
      }
      scripter_tos: {
        Row: {
          content: string
          created_at: string
          id: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          version?: number
        }
        Relationships: []
      }
      user_tos: {
        Row: {
          content: string
          created_at: string
          id: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          version?: number
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
  pgbouncer: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth: {
        Args: { p_usename: string }
        Returns: {
          username: string
          password: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  profiles: {
    Tables: {
      free_access: {
        Row: {
          date_end: string
          date_start: string
          id: string
          product: string
          user: string
        }
        Insert: {
          date_end?: string
          date_start?: string
          id?: string
          product: string
          user: string
        }
        Update: {
          date_end?: string
          date_start?: string
          id?: string
          product?: string
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "free_access_user_fkey"
            columns: ["user"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      free_access_old: {
        Row: {
          date_end: string
          date_start: string
          id: string
          product: string
          user: string
        }
        Insert: {
          date_end?: string
          date_start?: string
          id?: string
          product: string
          user: string
        }
        Update: {
          date_end?: string
          date_start?: string
          id?: string
          product?: string
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "free_access_old_user_fkey"
            columns: ["user"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string
          discord: string
          id: string
          role: Database["profiles"]["Enums"]["roles"] | null
          stripe: string
          username: string
        }
        Insert: {
          avatar: string
          discord: string
          id: string
          role?: Database["profiles"]["Enums"]["roles"] | null
          stripe: string
          username: string
        }
        Update: {
          avatar?: string
          discord?: string
          id?: string
          role?: Database["profiles"]["Enums"]["roles"] | null
          stripe?: string
          username?: string
        }
        Relationships: []
      }
      scripters: {
        Row: {
          content: string | null
          description: string | null
          github: string | null
          id: string
          paypal: string | null
          realname: string | null
          stripe: string
          url: string
        }
        Insert: {
          content?: string | null
          description?: string | null
          github?: string | null
          id: string
          paypal?: string | null
          realname?: string | null
          stripe: string
          url: string
        }
        Update: {
          content?: string | null
          description?: string | null
          github?: string | null
          id?: string
          paypal?: string | null
          realname?: string | null
          stripe?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "scripters_id_fkey"
            columns: ["id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel: boolean
          date_end: string
          date_start: string
          disabled: boolean
          id: string
          price: string
          product: string
          user: string
        }
        Insert: {
          cancel?: boolean
          date_end?: string
          date_start?: string
          disabled?: boolean
          id: string
          price: string
          product: string
          user?: string
        }
        Update: {
          cancel?: boolean
          date_end?: string
          date_start?: string
          disabled?: boolean
          id?: string
          price?: string
          product?: string
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_fkey"
            columns: ["user"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions_old: {
        Row: {
          cancel: boolean
          date_end: string
          date_start: string
          disabled: boolean
          id: string
          price: string
          product: string
          user: string
        }
        Insert: {
          cancel?: boolean
          date_end?: string
          date_start?: string
          disabled?: boolean
          id: string
          price: string
          product: string
          user?: string
        }
        Update: {
          cancel?: boolean
          date_end?: string
          date_start?: string
          disabled?: boolean
          id?: string
          price?: string
          product?: string
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_old_user_fkey"
            columns: ["user"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      random_scripters: {
        Row: {
          content: string | null
          description: string | null
          github: string | null
          id: string | null
          paypal: string | null
          realname: string | null
          stripe: string | null
          url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scripters_id_fkey"
            columns: ["id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_view_subscription: {
        Args: { accesser: string; owner: string; product: string }
        Returns: boolean
      }
      cron_update_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_avatar: {
        Args: { userid: string }
        Returns: string
      }
      get_discord_id: {
        Args: { userid: string }
        Returns: string
      }
      get_username: {
        Args: { userid: string }
        Returns: string
      }
      is_role: {
        Args: { target_role: Database["profiles"]["Enums"]["roles"] }
        Returns: boolean
      }
    }
    Enums: {
      roles:
        | "premium"
        | "vip"
        | "tester"
        | "scripter"
        | "moderator"
        | "administrator"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      [_ in never]: never
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
  scripts: {
    Tables: {
      bundles: {
        Row: {
          author: string
          id: string
          name: string
          scripts: string[]
        }
        Insert: {
          author: string
          id?: string
          name: string
          scripts: string[]
        }
        Update: {
          author?: string
          id?: string
          name?: string
          scripts?: string[]
        }
        Relationships: []
      }
      metadata: {
        Row: {
          categories: Database["scripts"]["Enums"]["category"][]
          id: string
          status: Database["scripts"]["Enums"]["status"]
          type: Database["scripts"]["Enums"]["type"]
          updated_at: string
        }
        Insert: {
          categories?: Database["scripts"]["Enums"]["category"][]
          id: string
          status?: Database["scripts"]["Enums"]["status"]
          type?: Database["scripts"]["Enums"]["type"]
          updated_at?: string
        }
        Update: {
          categories?: Database["scripts"]["Enums"]["category"][]
          id?: string
          status?: Database["scripts"]["Enums"]["status"]
          type?: Database["scripts"]["Enums"]["type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metadata_id_fkey"
            columns: ["id"]
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      protected: {
        Row: {
          author: string
          avatar: string
          created_at: string
          id: string
          revision: number
          updated_at: string
          username: string
        }
        Insert: {
          author: string
          avatar: string
          created_at?: string
          id: string
          revision?: number
          updated_at?: string
          username: string
        }
        Update: {
          author?: string
          avatar?: string
          created_at?: string
          id?: string
          revision?: number
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "protected_id_fkey"
            columns: ["id"]
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      scripts: {
        Row: {
          content: string
          description: string
          id: string
          published: boolean
          title: string
          url: string
        }
        Insert: {
          content: string
          description: string
          id?: string
          published?: boolean
          title: string
          url: string
        }
        Update: {
          content?: string
          description?: string
          id?: string
          published?: boolean
          title?: string
          url?: string
        }
        Relationships: []
      }
      stats_limits: {
        Row: {
          gp_max: number
          gp_min: number
          id: string
          xp_max: number
          xp_min: number
        }
        Insert: {
          gp_max?: number
          gp_min?: number
          id: string
          xp_max?: number
          xp_min?: number
        }
        Update: {
          gp_max?: number
          gp_min?: number
          id?: string
          xp_max?: number
          xp_min?: number
        }
        Relationships: [
          {
            foreignKeyName: "stats_limits_id_fkey"
            columns: ["id"]
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      author_scripts: {
        Row: {
          author: string | null
          premium: number | null
          scripts: string[] | null
          total: number | null
        }
        Relationships: []
      }
      featured: {
        Row: {
          id: string | null
          title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_revision: {
        Args: { script_id: string }
        Returns: number
      }
    }
    Enums: {
      category:
        | "combat"
        | "boss"
        | "minigame"
        | "moneymaker"
        | "tool"
        | "magic"
        | "prayer"
        | "mining"
        | "fishing"
        | "woodcutting"
        | "hunter"
        | "farming"
        | "cooking"
        | "smithing"
        | "fletching"
        | "firemaking"
        | "herblore"
        | "crafting"
        | "construction"
        | "agility"
        | "slayer"
        | "thieving"
        | "runecrafting"
      status: "official" | "community"
      type: "premium" | "free"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  stats: {
    Tables: {
      stats: {
        Row: {
          experience: number
          gold: number
          id: string
          levels: number
          runtime: number
          username: string | null
        }
        Insert: {
          experience?: number
          gold?: number
          id: string
          levels?: number
          runtime?: number
          username?: string | null
        }
        Update: {
          experience?: number
          gold?: number
          id?: string
          levels?: number
          runtime?: number
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      totals: {
        Row: {
          experience: number | null
          gold: number | null
          levels: number | null
          runtime: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_level: {
        Args: { experience: number }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; name: string; owner: string; metadata: Json }
        Returns: undefined
      }
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
        }
        Returns: {
          key: string
          id: string
          created_at: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          start_after?: string
          next_token?: string
        }
        Returns: {
          name: string
          id: string
          metadata: Json
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  stripe: {
    Tables: {
      accounts_ex: {
        Row: {
          attrs: Json | null
          business_type: string | null
          country: string | null
          created: string | null
          email: string | null
          id: string | null
          type: string | null
        }
        Insert: {
          attrs?: Json | null
          business_type?: string | null
          country?: string | null
          created?: string | null
          email?: string | null
          id?: string | null
          type?: string | null
        }
        Update: {
          attrs?: Json | null
          business_type?: string | null
          country?: string | null
          created?: string | null
          email?: string | null
          id?: string | null
          type?: string | null
        }
        Relationships: []
      }
      customers_ex: {
        Row: {
          attrs: Json | null
          created: string | null
          description: string | null
          email: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          attrs?: Json | null
          created?: string | null
          description?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          attrs?: Json | null
          created?: string | null
          description?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
      prices: {
        Row: {
          active: boolean
          amount: number
          currency: Database["stripe"]["Enums"]["currency"]
          id: string
          interval: Database["stripe"]["Enums"]["cycle"]
          product: string
        }
        Insert: {
          active?: boolean
          amount?: number
          currency?: Database["stripe"]["Enums"]["currency"]
          id: string
          interval?: Database["stripe"]["Enums"]["cycle"]
          product: string
        }
        Update: {
          active?: boolean
          amount?: number
          currency?: Database["stripe"]["Enums"]["currency"]
          id?: string
          interval?: Database["stripe"]["Enums"]["cycle"]
          product?: string
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_fkey"
            columns: ["product"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      prices_ex: {
        Row: {
          active: boolean | null
          attrs: Json | null
          created: string | null
          currency: string | null
          id: string | null
          product: string | null
          type: string | null
          unit_amount: number | null
        }
        Insert: {
          active?: boolean | null
          attrs?: Json | null
          created?: string | null
          currency?: string | null
          id?: string | null
          product?: string | null
          type?: string | null
          unit_amount?: number | null
        }
        Update: {
          active?: boolean | null
          attrs?: Json | null
          created?: string | null
          currency?: string | null
          id?: string | null
          product?: string | null
          type?: string | null
          unit_amount?: number | null
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          bundle: string | null
          id: string
          name: string
          script: string | null
          stripe: string
          user: string
        }
        Insert: {
          active?: boolean
          bundle?: string | null
          id: string
          name: string
          script?: string | null
          stripe: string
          user: string
        }
        Update: {
          active?: boolean
          bundle?: string | null
          id?: string
          name?: string
          script?: string | null
          stripe?: string
          user?: string
        }
        Relationships: []
      }
      products_ex: {
        Row: {
          active: boolean | null
          attrs: Json | null
          created: string | null
          default_price: string | null
          description: string | null
          id: string | null
          name: string | null
          updated: string | null
        }
        Insert: {
          active?: boolean | null
          attrs?: Json | null
          created?: string | null
          default_price?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          updated?: string | null
        }
        Update: {
          active?: boolean | null
          attrs?: Json | null
          created?: string | null
          default_price?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          updated?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          attrs: Json | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          customer: string | null
          id: string | null
        }
        Insert: {
          attrs?: Json | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer?: string | null
          id?: string | null
        }
        Update: {
          attrs?: Json | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer?: string | null
          id?: string | null
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
      currency: "EUR" | "USD" | "CAD" | "AUD"
      cycle: "week" | "month" | "year"
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
  graphql_public: {
    Enums: {},
  },
  info: {
    Enums: {},
  },
  pgbouncer: {
    Enums: {},
  },
  profiles: {
    Enums: {
      roles: [
        "premium",
        "vip",
        "tester",
        "scripter",
        "moderator",
        "administrator",
      ],
    },
  },
  public: {
    Enums: {},
  },
  scripts: {
    Enums: {
      category: [
        "combat",
        "boss",
        "minigame",
        "moneymaker",
        "tool",
        "magic",
        "prayer",
        "mining",
        "fishing",
        "woodcutting",
        "hunter",
        "farming",
        "cooking",
        "smithing",
        "fletching",
        "firemaking",
        "herblore",
        "crafting",
        "construction",
        "agility",
        "slayer",
        "thieving",
        "runecrafting",
      ],
      status: ["official", "community"],
      type: ["premium", "free"],
    },
  },
  stats: {
    Enums: {},
  },
  storage: {
    Enums: {},
  },
  stripe: {
    Enums: {
      currency: ["EUR", "USD", "CAD", "AUD"],
      cycle: ["week", "month", "year"],
    },
  },
} as const
