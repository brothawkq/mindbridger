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
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          clicked_at: string
          created_at: string
          deleted_at: string | null
          id: string
          ip_hash: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          affiliate_id: string
          clicked_at?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          ip_hash?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          affiliate_id?: string
          clicked_at?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          ip_hash?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_conversions: {
        Row: {
          affiliate_id: string
          commission_amount: number
          created_at: string
          deleted_at: string | null
          id: string
          musteri_id: string
          payment_id: string | null
          status: Database["public"]["Enums"]["affiliate_conv_status"]
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          commission_amount: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          musteri_id: string
          payment_id?: string | null
          status?: Database["public"]["Enums"]["affiliate_conv_status"]
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          musteri_id?: string
          payment_id?: string | null
          status?: Database["public"]["Enums"]["affiliate_conv_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_conversions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_musteri_id_fkey"
            columns: ["musteri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          commission_rate: number
          created_at: string
          deleted_at: string | null
          id: string
          platform_info: string | null
          profile_id: string
          referral_code: string
          status: Database["public"]["Enums"]["affiliate_status"]
          total_earned: number
          updated_at: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          platform_info?: string | null
          profile_id: string
          referral_code: string
          status?: Database["public"]["Enums"]["affiliate_status"]
          total_earned?: number
          updated_at?: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          platform_info?: string | null
          profile_id?: string
          referral_code?: string
          status?: Database["public"]["Enums"]["affiliate_status"]
          total_earned?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          deleted_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          deleted_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          deleted_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bekleme_listesi: {
        Row: {
          accepted_at: string | null
          created_at: string
          danisan_id: string
          deleted_at: string | null
          expires_at: string | null
          id: string
          musteri_id: string
          notified_at: string | null
          preferred_days: number[] | null
          preferred_times: string[] | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          danisan_id: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          musteri_id: string
          notified_at?: string | null
          preferred_days?: number[] | null
          preferred_times?: string[] | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          danisan_id?: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          musteri_id?: string
          notified_at?: string | null
          preferred_days?: number[] | null
          preferred_times?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bekleme_listesi_danisan_id_fkey"
            columns: ["danisan_id"]
            isOneToOne: false
            referencedRelation: "danisanlar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bekleme_listesi_musteri_id_fkey"
            columns: ["musteri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bildirim_tercihleri: {
        Row: {
          blog_email: boolean
          created_at: string
          deleted_at: string | null
          id: string
          marketing_email: boolean
          odeme_email: boolean
          randevu_email: boolean
          randevu_sms: boolean
          randevu_uygulama: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          blog_email?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          marketing_email?: boolean
          odeme_email?: boolean
          randevu_email?: boolean
          randevu_sms?: boolean
          randevu_uygulama?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          blog_email?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          marketing_email?: boolean
          odeme_email?: boolean
          randevu_email?: boolean
          randevu_sms?: boolean
          randevu_uygulama?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bildirim_tercihleri_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bildirimler: {
        Row: {
          body: string | null
          channel: Database["public"]["Enums"]["notif_channel"]
          created_at: string
          data: Json | null
          deleted_at: string | null
          delivery_status: Database["public"]["Enums"]["delivery_status"]
          id: string
          read_at: string | null
          retry_count: number
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          channel?: Database["public"]["Enums"]["notif_channel"]
          created_at?: string
          data?: Json | null
          deleted_at?: string | null
          delivery_status?: Database["public"]["Enums"]["delivery_status"]
          id?: string
          read_at?: string | null
          retry_count?: number
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          channel?: Database["public"]["Enums"]["notif_channel"]
          created_at?: string
          data?: Json | null
          deleted_at?: string | null
          delivery_status?: Database["public"]["Enums"]["delivery_status"]
          id?: string
          read_at?: string | null
          retry_count?: number
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bildirimler_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          content: string | null
          cover_image_url: string | null
          created_at: string
          danisan_id: string | null
          deleted_at: string | null
          excerpt: string | null
          id: string
          published_at: string | null
          rejection_reason: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["blog_status"]
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          danisan_id?: string | null
          deleted_at?: string | null
          excerpt?: string | null
          id?: string
          published_at?: string | null
          rejection_reason?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["blog_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          danisan_id?: string | null
          deleted_at?: string | null
          excerpt?: string | null
          id?: string
          published_at?: string | null
          rejection_reason?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["blog_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_danisan_id_fkey"
            columns: ["danisan_id"]
            isOneToOne: false
            referencedRelation: "danisanlar"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_rate_limits: {
        Row: {
          count: number
          ip_address: string
          updated_at: string
          window_start: string
        }
        Insert: {
          count?: number
          ip_address: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          count?: number
          ip_address?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          danisan_id: string
          deleted_at: string | null
          id: string
          last_message_at: string | null
          musteri_id: string
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          danisan_id: string
          deleted_at?: string | null
          id?: string
          last_message_at?: string | null
          musteri_id: string
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          danisan_id?: string
          deleted_at?: string | null
          id?: string
          last_message_at?: string | null
          musteri_id?: string
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_danisan_id_fkey"
            columns: ["danisan_id"]
            isOneToOne: false
            referencedRelation: "danisanlar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_musteri_id_fkey"
            columns: ["musteri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      danisan_izin: {
        Row: {
          created_at: string
          danisan_id: string
          date: string
          deleted_at: string | null
          id: string
          reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          danisan_id: string
          date: string
          deleted_at?: string | null
          id?: string
          reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          danisan_id?: string
          date?: string
          deleted_at?: string | null
          id?: string
          reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "danisan_izin_danisan_id_fkey"
            columns: ["danisan_id"]
            isOneToOne: false
            referencedRelation: "danisanlar"
            referencedColumns: ["id"]
          },
        ]
      }
      danisan_musaitlik: {
        Row: {
          created_at: string
          danisan_id: string
          day_of_week: number
          deleted_at: string | null
          end_time: string
          id: string
          is_active: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          danisan_id: string
          day_of_week: number
          deleted_at?: string | null
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          danisan_id?: string
          day_of_week?: number
          deleted_at?: string | null
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "danisan_musaitlik_danisan_id_fkey"
            columns: ["danisan_id"]
            isOneToOne: false
            referencedRelation: "danisanlar"
            referencedColumns: ["id"]
          },
        ]
      }
      danisan_paketler: {
        Row: {
          created_at: string
          danisan_id: string
          deleted_at: string | null
          discount_percent: number
          id: string
          is_active: boolean
          name: string
          price: number
          session_count: number
          updated_at: string
          validity_days: number
        }
        Insert: {
          created_at?: string
          danisan_id: string
          deleted_at?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          name: string
          price: number
          session_count: number
          updated_at?: string
          validity_days: number
        }
        Update: {
          created_at?: string
          danisan_id?: string
          deleted_at?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          session_count?: number
          updated_at?: string
          validity_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "danisan_paketler_danisan_id_fkey"
            columns: ["danisan_id"]
            isOneToOne: false
            referencedRelation: "danisanlar"
            referencedColumns: ["id"]
          },
        ]
      }
      danisanlar: {
        Row: {
          age_groups: string[] | null
          approach: string[] | null
          average_rating: number
          bank_account_name: string | null
          bank_iban: string | null
          bank_name: string | null
          bio: string | null
          buffer_minutes: number
          city: string | null
          created_at: string
          deleted_at: string | null
          diploma_url: string | null
          district: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          id_document_url: string | null
          intro_session_duration: number
          intro_session_enabled: boolean
          is_in_person: boolean
          is_online: boolean
          is_supervisor: boolean
          languages: string[] | null
          price_async: number | null
          price_group: number | null
          price_individual: number | null
          profile_completion_percent: number
          profile_id: string
          profile_published: boolean
          rejection_reason: string | null
          session_duration: number | null
          sliding_scale: boolean
          sliding_scale_price: number | null
          slug: string
          specialties: string[] | null
          title: string | null
          total_reviews: number
          total_sessions: number
          updated_at: string
        }
        Insert: {
          age_groups?: string[] | null
          approach?: string[] | null
          average_rating?: number
          bank_account_name?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          bio?: string | null
          buffer_minutes?: number
          city?: string | null
          created_at?: string
          deleted_at?: string | null
          diploma_url?: string | null
          district?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          id_document_url?: string | null
          intro_session_duration?: number
          intro_session_enabled?: boolean
          is_in_person?: boolean
          is_online?: boolean
          is_supervisor?: boolean
          languages?: string[] | null
          price_async?: number | null
          price_group?: number | null
          price_individual?: number | null
          profile_completion_percent?: number
          profile_id: string
          profile_published?: boolean
          rejection_reason?: string | null
          session_duration?: number | null
          sliding_scale?: boolean
          sliding_scale_price?: number | null
          slug: string
          specialties?: string[] | null
          title?: string | null
          total_reviews?: number
          total_sessions?: number
          updated_at?: string
        }
        Update: {
          age_groups?: string[] | null
          approach?: string[] | null
          average_rating?: number
          bank_account_name?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          bio?: string | null
          buffer_minutes?: number
          city?: string | null
          created_at?: string
          deleted_at?: string | null
          diploma_url?: string | null
          district?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          id_document_url?: string | null
          intro_session_duration?: number
          intro_session_enabled?: boolean
          is_in_person?: boolean
          is_online?: boolean
          is_supervisor?: boolean
          languages?: string[] | null
          price_async?: number | null
          price_group?: number | null
          price_individual?: number | null
          profile_completion_percent?: number
          profile_id?: string
          profile_published?: boolean
          rejection_reason?: string | null
          session_duration?: number | null
          sliding_scale?: boolean
          sliding_scale_price?: number | null
          slug?: string
          specialties?: string[] | null
          title?: string | null
          total_reviews?: number
          total_sessions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "danisanlar_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      degerlendirmeler: {
        Row: {
          comment: string | null
          created_at: string
          danisan_id: string
          deleted_at: string | null
          id: string
          is_visible: boolean
          musteri_id: string
          randevu_id: string
          rating: number
          reply_at: string | null
          review_reply: string | null
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          danisan_id: string
          deleted_at?: string | null
          id?: string
          is_visible?: boolean
          musteri_id: string
          randevu_id: string
          rating: number
          reply_at?: string | null
          review_reply?: string | null
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          danisan_id?: string
          deleted_at?: string | null
          id?: string
          is_visible?: boolean
          musteri_id?: string
          randevu_id?: string
          rating?: number
          reply_at?: string | null
          review_reply?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "degerlendirmeler_danisan_id_fkey"
            columns: ["danisan_id"]
            isOneToOne: false
            referencedRelation: "danisanlar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "degerlendirmeler_musteri_id_fkey"
            columns: ["musteri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "degerlendirmeler_randevu_id_fkey"
            columns: ["randevu_id"]
            isOneToOne: true
            referencedRelation: "randevular"
            referencedColumns: ["id"]
          },
        ]
      }
      faq: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          order: number
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          order?: number
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          order?: number
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      grup_seans_katilimcilar: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          min_participant_met: boolean
          musteri_id: string
          payment_id: string | null
          randevu_id: string
          status: Database["public"]["Enums"]["group_session_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          min_participant_met?: boolean
          musteri_id: string
          payment_id?: string | null
          randevu_id: string
          status?: Database["public"]["Enums"]["group_session_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          min_participant_met?: boolean
          musteri_id?: string
          payment_id?: string | null
          randevu_id?: string
          status?: Database["public"]["Enums"]["group_session_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grup_seans_katilimcilar_musteri_id_fkey"
            columns: ["musteri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grup_seans_katilimcilar_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grup_seans_katilimcilar_randevu_id_fkey"
            columns: ["randevu_id"]
            isOneToOne: false
            referencedRelation: "randevular"
            referencedColumns: ["id"]
          },
        ]
      }
      gunluk_kayitlar: {
        Row: {
          created_at: string
          date: string
          deleted_at: string | null
          id: string
          intensity: number | null
          mood: number | null
          mood_emoji: string | null
          musteri_id: string
          note: string | null
          shared_with_danisan_id: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          deleted_at?: string | null
          id?: string
          intensity?: number | null
          mood?: number | null
          mood_emoji?: string | null
          musteri_id: string
          note?: string | null
          shared_with_danisan_id?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          deleted_at?: string | null
          id?: string
          intensity?: number | null
          mood?: number | null
          mood_emoji?: string | null
          musteri_id?: string
          note?: string | null
          shared_with_danisan_id?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gunluk_kayitlar_musteri_id_fkey"
            columns: ["musteri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gunluk_kayitlar_shared_with_danisan_id_fkey"
            columns: ["shared_with_danisan_id"]
            isOneToOne: false
            referencedRelation: "danisanlar"
            referencedColumns: ["id"]
          },
        ]
      }
      haftalik_hedefler: {
        Row: {
          completed_mood_logs: number
          completed_sessions: number
          created_at: string
          deleted_at: string | null
          id: string
          musteri_id: string
          target_mood_logs: number
          target_sessions: number
          updated_at: string
          week_start: string
        }
        Insert: {
          completed_mood_logs?: number
          completed_sessions?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          musteri_id: string
          target_mood_logs?: number
          target_sessions?: number
          updated_at?: string
          week_start: string
        }
        Update: {
          completed_mood_logs?: number
          completed_sessions?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          musteri_id?: string
          target_mood_logs?: number
          target_sessions?: number
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "haftalik_hedefler_musteri_id_fkey"
            columns: ["musteri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_blacklist: {
        Row: {
          banned_until: string | null
          created_at: string
          deleted_at: string | null
          failed_attempts: number
          id: string
          ip_address: string
          last_attempt_at: string | null
          locked_until: string | null
          updated_at: string
        }
        Insert: {
          banned_until?: string | null
          created_at?: string
          deleted_at?: string | null
          failed_attempts?: number
          id?: string
          ip_address: string
          last_attempt_at?: string | null
          locked_until?: string | null
          updated_at?: string
        }
        Update: {
          banned_until?: string | null
          created_at?: string
          deleted_at?: string | null
          failed_attempts?: number
          id?: string
          ip_address?: string
          last_attempt_at?: string | null
          locked_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      kaynaklar: {
        Row: {
          category: string[] | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          file_url: string | null
          id: string
          is_active: boolean
          title: string
          type: Database["public"]["Enums"]["resource_type"]
          updated_at: string
        }
        Insert: {
          category?: string[] | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          title: string
          type: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
        }
        Update: {
          category?: string[] | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          title?: string
          type?: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kaynaklar_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kriz_kelimeleri: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          severity: Database["public"]["Enums"]["crisis_severity"]
          updated_at: string
          word: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          severity?: Database["public"]["Enums"]["crisis_severity"]
          updated_at?: string
          word: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          severity?: Database["public"]["Enums"]["crisis_severity"]
          updated_at?: string
          word?: string
        }
        Relationships: []
      }
      kullanici_rozetleri: {
        Row: {
          created_at: string
          deleted_at: string | null
          earned_at: string
          id: string
          musteri_id: string
          rozet_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          earned_at?: string
          id?: string
          musteri_id: string
          rozet_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          earned_at?: string
          id?: string
          musteri_id?: string
          rozet_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kullanici_rozetleri_musteri_id_fkey"
            columns: ["musteri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kullanici_rozetleri_rozet_id_fkey"
            columns: ["rozet_id"]
            isOneToOne: false
            referencedRelation: "rozetler_tanim"
            referencedColumns: ["id"]
          },
        ]
      }
      kurumsal_hesaplar: {
        Row: {
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          default_monthly_budget: number
          deleted_at: string | null
          id: string
          invite_code: string
          license_count: number
          price_per_user: number | null
          status: Database["public"]["Enums"]["corporate_status"]
          subscription_end: string | null
          subscription_start: string | null
          updated_at: string
        }
        Insert: {
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          default_monthly_budget?: number
          deleted_at?: string | null
          id?: string
          invite_code: string
          license_count?: number
          price_per_user?: number | null
          status?: Database["public"]["Enums"]["corporate_status"]
          subscription_end?: string | null
          subscription_start?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          default_monthly_budget?: number
          deleted_at?: string | null
          id?: string
          invite_code?: string
          license_count?: number
          price_per_user?: number | null
          status?: Database["public"]["Enums"]["corporate_status"]
          subscription_end?: string | null
          subscription_start?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      kurumsal_kullanicilar: {
        Row: {
          budget_alert_sent: boolean
          created_at: string
          deleted_at: string | null
          id: string
          joined_at: string
          kurumsal_id: string
          monthly_budget_limit: number | null
          musteri_id: string
          sessions_used_this_month: number
          updated_at: string
        }
        Insert: {
          budget_alert_sent?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          joined_at?: string
          kurumsal_id: string
          monthly_budget_limit?: number | null
          musteri_id: string
          sessions_used_this_month?: number
          updated_at?: string
        }
        Update: {
          budget_alert_sent?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          joined_at?: string
          kurumsal_id?: string
          monthly_budget_limit?: number | null
          musteri_id?: string
          sessions_used_this_month?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kurumsal_kullanicilar_kurumsal_id_fkey"
            columns: ["kurumsal_id"]
            isOneToOne: false
            referencedRelation: "kurumsal_hesaplar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kurumsal_kullanicilar_musteri_id_fkey"
            columns: ["musteri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          audio_url: string | null
          content: string | null
          conversation_id: string
          created_at: string
          deleted_at: string | null
          id: string
          is_session_response: boolean
          read_at: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          content?: string | null
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_session_response?: boolean
          read_at?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          content?: string | null
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_session_response?: boolean
          read_at?: string | null
          sender_id?: string
          updated_at?: string
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
      musteri_paketler: {
        Row: {
          created_at: string
          danisan_paket_id: string
          deleted_at: string | null
          expires_at: string
          id: string
          musteri_id: string
          sessions_remaining: number | null
          sessions_total: number
          sessions_used: number
          status: Database["public"]["Enums"]["package_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          danisan_paket_id: string
          deleted_at?: string | null
          expires_at: string
          id?: string
          musteri_id: string
          sessions_remaining?: number | null
          sessions_total: number
          sessions_used?: number
          status?: Database["public"]["Enums"]["package_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          danisan_paket_id?: string
          deleted_at?: string | null
          expires_at?: string
          id?: string
          musteri_id?: string
          sessions_remaining?: number | null
          sessions_total?: number
          sessions_used?: number
          status?: Database["public"]["Enums"]["package_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "musteri_paketler_danisan_paket_id_fkey"
            columns: ["danisan_paket_id"]
            isOneToOne: false
            referencedRelation: "danisan_paketler"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "musteri_paketler_musteri_id_fkey"
            columns: ["musteri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      odevler: {
        Row: {
          completed_at: string | null
          created_at: string
          danisan_id: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          file_url: string | null
          id: string
          musteri_id: string
          musteri_note: string | null
          randevu_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          danisan_id: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          file_url?: string | null
          id?: string
          musteri_id: string
          musteri_note?: string | null
          randevu_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          danisan_id?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          file_url?: string | null
          id?: string
          musteri_id?: string
          musteri_note?: string | null
          randevu_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "odevler_danisan_id_fkey"
            columns: ["danisan_id"]
            isOneToOne: false
            referencedRelation: "danisanlar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odevler_musteri_id_fkey"
            columns: ["musteri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odevler_randevu_id_fkey"
            columns: ["randevu_id"]
            isOneToOne: false
            referencedRelation: "randevular"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_formlar: {
        Row: {
          created_at: string
          danisan_id: string
          deleted_at: string | null
          id: string
          is_default: boolean
          questions: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          danisan_id: string
          deleted_at?: string | null
          id?: string
          is_default?: boolean
          questions?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          danisan_id?: string
          deleted_at?: string | null
          id?: string
          is_default?: boolean
          questions?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_formlar_danisan_id_fkey"
            columns: ["danisan_id"]
            isOneToOne: false
            referencedRelation: "danisanlar"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_yanitlar: {
        Row: {
          answers: Json | null
          created_at: string
          deleted_at: string | null
          form_id: string
          id: string
          musteri_id: string
          randevu_id: string | null
          updated_at: string
        }
        Insert: {
          answers?: Json | null
          created_at?: string
          deleted_at?: string | null
          form_id: string
          id?: string
          musteri_id: string
          randevu_id?: string | null
          updated_at?: string
        }
        Update: {
          answers?: Json | null
          created_at?: string
          deleted_at?: string | null
          form_id?: string
          id?: string
          musteri_id?: string
          randevu_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_yanitlar_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "onboarding_formlar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_yanitlar_musteri_id_fkey"
            columns: ["musteri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_yanitlar_randevu_id_fkey"
            columns: ["randevu_id"]
            isOneToOne: false
            referencedRelation: "randevular"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_gross: number
          amount_net: number
          commission_amount: number
          commission_rate: number
          created_at: string
          danisan_id: string
          deleted_at: string | null
          id: string
          iyzico_payment_id: string | null
          iyzico_token: string | null
          musteri_id: string
          paid_at: string | null
          payment_method: string | null
          randevu_id: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_gross: number
          amount_net: number
          commission_amount: number
          commission_rate: number
          created_at?: string
          danisan_id: string
          deleted_at?: string | null
          id?: string
          iyzico_payment_id?: string | null
          iyzico_token?: string | null
          musteri_id: string
          paid_at?: string | null
          payment_method?: string | null
          randevu_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_gross?: number
          amount_net?: number
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          danisan_id?: string
          deleted_at?: string | null
          id?: string
          iyzico_payment_id?: string | null
          iyzico_token?: string | null
          musteri_id?: string
          paid_at?: string | null
          payment_method?: string | null
          randevu_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_danisan_id_fkey"
            columns: ["danisan_id"]
            isOneToOne: false
            referencedRelation: "danisanlar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_musteri_id_fkey"
            columns: ["musteri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_randevu_id_fkey"
            columns: ["randevu_id"]
            isOneToOne: false
            referencedRelation: "randevular"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          bank_transfer_ref: string | null
          created_at: string
          danisan_id: string
          deleted_at: string | null
          id: string
          paid_at: string | null
          payment_ids: string[] | null
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["payout_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          bank_transfer_ref?: string | null
          created_at?: string
          danisan_id: string
          deleted_at?: string | null
          id?: string
          paid_at?: string | null
          payment_ids?: string[] | null
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["payout_status"]
          total_amount: number
          updated_at?: string
        }
        Update: {
          bank_transfer_ref?: string | null
          created_at?: string
          danisan_id?: string
          deleted_at?: string | null
          id?: string
          paid_at?: string | null
          payment_ids?: string[] | null
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["payout_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_danisan_id_fkey"
            columns: ["danisan_id"]
            isOneToOne: false
            referencedRelation: "danisanlar"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_ayarlari: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          value: string
          description: string | null
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          description?: string | null
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string
          description?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_notes: string | null
          avatar_url: string | null
          churn_risk_score: number
          created_at: string
          dark_mode: boolean
          deleted_at: string | null
          first_name: string | null
          id: string
          kvkk_accepted_at: string | null
          kvkk_ip: string | null
          language: string
          last_login_at: string | null
          last_name: string | null
          notification_channel: Database["public"]["Enums"]["notification_channel_pref"]
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          avatar_url?: string | null
          churn_risk_score?: number
          created_at?: string
          dark_mode?: boolean
          deleted_at?: string | null
          first_name?: string | null
          id: string
          kvkk_accepted_at?: string | null
          kvkk_ip?: string | null
          language?: string
          last_login_at?: string | null
          last_name?: string | null
          notification_channel?: Database["public"]["Enums"]["notification_channel_pref"]
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          avatar_url?: string | null
          churn_risk_score?: number
          created_at?: string
          dark_mode?: boolean
          deleted_at?: string | null
          first_name?: string | null
          id?: string
          kvkk_accepted_at?: string | null
          kvkk_ip?: string | null
          language?: string
          last_login_at?: string | null
          last_name?: string | null
          notification_channel?: Database["public"]["Enums"]["notification_channel_pref"]
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
      psikolojik_testler: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          is_active: boolean
          questions: Json | null
          result_ranges: Json | null
          scoring_logic: Json | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean
          questions?: Json | null
          result_ranges?: Json | null
          scoring_logic?: Json | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean
          questions?: Json | null
          result_ranges?: Json | null
          scoring_logic?: Json | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      randevular: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          daily_room_name: string | null
          daily_room_token_danisan: string | null
          daily_room_token_musteri: string | null
          daily_room_token_partner: string | null
          danisan_id: string
          deleted_at: string | null
          duration_minutes: number
          id: string
          is_recurring: boolean
          is_sliding_scale: boolean
          musteri_id: string
          no_show_charged: boolean
          notes_private: string | null
          package_id: string | null
          partner_id: string | null
          price: number
          recurring_rule: Json | null
          scheduled_at: string
          session_type: Database["public"]["Enums"]["session_type"]
          status: Database["public"]["Enums"]["appointment_status"]
          summary_shared: string | null
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          daily_room_name?: string | null
          daily_room_token_danisan?: string | null
          daily_room_token_musteri?: string | null
          daily_room_token_partner?: string | null
          danisan_id: string
          deleted_at?: string | null
          duration_minutes: number
          id?: string
          is_recurring?: boolean
          is_sliding_scale?: boolean
          musteri_id: string
          no_show_charged?: boolean
          notes_private?: string | null
          package_id?: string | null
          partner_id?: string | null
          price: number
          recurring_rule?: Json | null
          scheduled_at: string
          session_type: Database["public"]["Enums"]["session_type"]
          status?: Database["public"]["Enums"]["appointment_status"]
          summary_shared?: string | null
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          daily_room_name?: string | null
          daily_room_token_danisan?: string | null
          daily_room_token_musteri?: string | null
          daily_room_token_partner?: string | null
          danisan_id?: string
          deleted_at?: string | null
          duration_minutes?: number
          id?: string
          is_recurring?: boolean
          is_sliding_scale?: boolean
          musteri_id?: string
          no_show_charged?: boolean
          notes_private?: string | null
          package_id?: string | null
          partner_id?: string | null
          price?: number
          recurring_rule?: Json | null
          scheduled_at?: string
          session_type?: Database["public"]["Enums"]["session_type"]
          status?: Database["public"]["Enums"]["appointment_status"]
          summary_shared?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_randevu_package"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "musteri_paketler"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "randevular_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "randevular_danisan_id_fkey"
            columns: ["danisan_id"]
            isOneToOne: false
            referencedRelation: "danisanlar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "randevular_musteri_id_fkey"
            columns: ["musteri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "randevular_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          deleted_at: string | null
          id: string
          initiated_by: string | null
          iyzico_refund_id: string | null
          payment_id: string
          randevu_id: string
          reason: Database["public"]["Enums"]["refund_reason"]
          refund_percent: number
          status: Database["public"]["Enums"]["refund_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          initiated_by?: string | null
          iyzico_refund_id?: string | null
          payment_id: string
          randevu_id: string
          reason: Database["public"]["Enums"]["refund_reason"]
          refund_percent: number
          status?: Database["public"]["Enums"]["refund_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          initiated_by?: string | null
          iyzico_refund_id?: string | null
          payment_id?: string
          randevu_id?: string
          reason?: Database["public"]["Enums"]["refund_reason"]
          refund_percent?: number
          status?: Database["public"]["Enums"]["refund_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_randevu_id_fkey"
            columns: ["randevu_id"]
            isOneToOne: false
            referencedRelation: "randevular"
            referencedColumns: ["id"]
          },
        ]
      }
      rozetler_tanim: {
        Row: {
          code: string
          condition: Json | null
          created_at: string
          deleted_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          condition?: Json | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          condition?: Json | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      seans_faturalari: {
        Row: {
          amount: number
          created_at: string
          danisan_id: string | null
          deleted_at: string | null
          id: string
          invoice_number: string
          invoice_type: Database["public"]["Enums"]["invoice_type"]
          kurumsal_id: string | null
          musteri_id: string | null
          payment_id: string | null
          pdf_url: string | null
          period_end: string | null
          period_start: string | null
          randevu_id: string | null
          sent_at: string | null
          updated_at: string
          xlsx_url: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          danisan_id?: string | null
          deleted_at?: string | null
          id?: string
          invoice_number: string
          invoice_type?: Database["public"]["Enums"]["invoice_type"]
          kurumsal_id?: string | null
          musteri_id?: string | null
          payment_id?: string | null
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          randevu_id?: string | null
          sent_at?: string | null
          updated_at?: string
          xlsx_url?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          danisan_id?: string | null
          deleted_at?: string | null
          id?: string
          invoice_number?: string
          invoice_type?: Database["public"]["Enums"]["invoice_type"]
          kurumsal_id?: string | null
          musteri_id?: string | null
          payment_id?: string | null
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          randevu_id?: string | null
          sent_at?: string | null
          updated_at?: string
          xlsx_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_seans_faturalari_kurumsal"
            columns: ["kurumsal_id"]
            isOneToOne: false
            referencedRelation: "kurumsal_hesaplar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seans_faturalari_danisan_id_fkey"
            columns: ["danisan_id"]
            isOneToOne: false
            referencedRelation: "danisanlar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seans_faturalari_musteri_id_fkey"
            columns: ["musteri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seans_faturalari_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seans_faturalari_randevu_id_fkey"
            columns: ["randevu_id"]
            isOneToOne: false
            referencedRelation: "randevular"
            referencedColumns: ["id"]
          },
        ]
      }
      takvim_sync: {
        Row: {
          access_token: string
          calendar_id: string | null
          created_at: string
          danisan_id: string
          deleted_at: string | null
          id: string
          is_active: boolean
          provider: Database["public"]["Enums"]["calendar_provider"]
          refresh_token: string
          token_expiry: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          calendar_id?: string | null
          created_at?: string
          danisan_id: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          provider: Database["public"]["Enums"]["calendar_provider"]
          refresh_token: string
          token_expiry?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          calendar_id?: string | null
          created_at?: string
          danisan_id?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          provider?: Database["public"]["Enums"]["calendar_provider"]
          refresh_token?: string
          token_expiry?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "takvim_sync_danisan_id_fkey"
            columns: ["danisan_id"]
            isOneToOne: false
            referencedRelation: "danisanlar"
            referencedColumns: ["id"]
          },
        ]
      }
      test_sonuclari: {
        Row: {
          answers: Json | null
          created_at: string
          deleted_at: string | null
          id: string
          musteri_id: string
          result_label: string | null
          score: number | null
          shared_with_danisan: boolean
          test_id: string
          updated_at: string
        }
        Insert: {
          answers?: Json | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          musteri_id: string
          result_label?: string | null
          score?: number | null
          shared_with_danisan?: boolean
          test_id: string
          updated_at?: string
        }
        Update: {
          answers?: Json | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          musteri_id?: string
          result_label?: string | null
          score?: number | null
          shared_with_danisan?: boolean
          test_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_sonuclari_musteri_id_fkey"
            columns: ["musteri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_sonuclari_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "psikolojik_testler"
            referencedColumns: ["id"]
          },
        ]
      }
      webinar_kayitlar: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          joined_at: string | null
          musteri_id: string
          payment_id: string | null
          status: Database["public"]["Enums"]["webinar_reg_status"]
          updated_at: string
          webinar_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          joined_at?: string | null
          musteri_id: string
          payment_id?: string | null
          status?: Database["public"]["Enums"]["webinar_reg_status"]
          updated_at?: string
          webinar_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          joined_at?: string | null
          musteri_id?: string
          payment_id?: string | null
          status?: Database["public"]["Enums"]["webinar_reg_status"]
          updated_at?: string
          webinar_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webinar_kayitlar_musteri_id_fkey"
            columns: ["musteri_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webinar_kayitlar_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webinar_kayitlar_webinar_id_fkey"
            columns: ["webinar_id"]
            isOneToOne: false
            referencedRelation: "webinarlar"
            referencedColumns: ["id"]
          },
        ]
      }
      webinarlar: {
        Row: {
          capacity: number
          cover_image_url: string | null
          created_at: string
          daily_room_name: string | null
          deleted_at: string | null
          description: string | null
          duration_minutes: number
          host_id: string
          id: string
          platform_commission_rate: number
          price: number
          registered_count: number
          scheduled_at: string
          status: Database["public"]["Enums"]["webinar_status"]
          title: string
          updated_at: string
        }
        Insert: {
          capacity: number
          cover_image_url?: string | null
          created_at?: string
          daily_room_name?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_minutes: number
          host_id: string
          id?: string
          platform_commission_rate?: number
          price?: number
          registered_count?: number
          scheduled_at: string
          status?: Database["public"]["Enums"]["webinar_status"]
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          cover_image_url?: string | null
          created_at?: string
          daily_room_name?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_minutes?: number
          host_id?: string
          id?: string
          platform_commission_rate?: number
          price?: number
          registered_count?: number
          scheduled_at?: string
          status?: Database["public"]["Enums"]["webinar_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webinarlar_host_id_fkey"
            columns: ["host_id"]
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
      clean_chatbot_rate_limits: { Args: never; Returns: undefined }
      clean_expired_ip_bans: { Args: never; Returns: undefined }
      get_my_role: { Args: never; Returns: string }
      get_next_fatura_sira: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      my_danisan_id: { Args: never; Returns: string }
      record_failed_attempt: { Args: { p_ip: string }; Returns: Json }
      webinar_kayit_ekle: {
        Args: { p_musteri_id: string; p_webinar_id: string }
        Returns: Json
      }
    }
    Enums: {
      affiliate_conv_status: "pending" | "paid"
      affiliate_status: "pending" | "active" | "suspended"
      appointment_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
        | "rejected"
      blog_status: "draft" | "pending" | "published" | "rejected"
      calendar_provider: "google" | "outlook"
      conversation_type: "lojistik" | "asenkron_seans"
      corporate_status: "pending" | "active" | "suspended"
      crisis_severity: "low" | "medium" | "high"
      delivery_status: "pending" | "sent" | "failed"
      gender_type: "erkek" | "kadin" | "belirtmek_istemiyorum"
      group_session_status:
        | "registered"
        | "confirmed"
        | "cancelled"
        | "attended"
      invoice_type: "bireysel" | "kurumsal_aylik"
      notif_channel: "app" | "email" | "sms"
      notification_channel_pref: "email" | "sms" | "uygulama_ici"
      package_status: "active" | "expired" | "completed"
      payment_status:
        | "pending"
        | "authorized"
        | "captured"
        | "failed"
        | "refunded"
      payout_status: "pending" | "processing" | "completed" | "failed"
      refund_reason:
        | "cancelled_by_musteri"
        | "cancelled_by_danisan"
        | "dispute"
        | "admin_override"
      refund_status: "pending" | "completed" | "failed"
      resource_type: "pdf" | "video" | "link"
      session_type:
        | "bireysel"
        | "asenkron"
        | "grup"
        | "cift_aile"
        | "on_gorusme"
        | "supervizyon"
      task_status: "pending" | "completed" | "skipped"
      user_role:
        | "visitor"
        | "musteri"
        | "danisan"
        | "kurumsal"
        | "affiliate"
        | "admin"
      user_status: "pending" | "active" | "suspended" | "rejected"
      webinar_reg_status: "registered" | "attended" | "cancelled" | "refunded"
      webinar_status: "draft" | "published" | "cancelled" | "completed"
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
      affiliate_conv_status: ["pending", "paid"],
      affiliate_status: ["pending", "active", "suspended"],
      appointment_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
        "rejected",
      ],
      blog_status: ["draft", "pending", "published", "rejected"],
      calendar_provider: ["google", "outlook"],
      conversation_type: ["lojistik", "asenkron_seans"],
      corporate_status: ["pending", "active", "suspended"],
      crisis_severity: ["low", "medium", "high"],
      delivery_status: ["pending", "sent", "failed"],
      gender_type: ["erkek", "kadin", "belirtmek_istemiyorum"],
      group_session_status: [
        "registered",
        "confirmed",
        "cancelled",
        "attended",
      ],
      invoice_type: ["bireysel", "kurumsal_aylik"],
      notif_channel: ["app", "email", "sms"],
      notification_channel_pref: ["email", "sms", "uygulama_ici"],
      package_status: ["active", "expired", "completed"],
      payment_status: [
        "pending",
        "authorized",
        "captured",
        "failed",
        "refunded",
      ],
      payout_status: ["pending", "processing", "completed", "failed"],
      refund_reason: [
        "cancelled_by_musteri",
        "cancelled_by_danisan",
        "dispute",
        "admin_override",
      ],
      refund_status: ["pending", "completed", "failed"],
      resource_type: ["pdf", "video", "link"],
      session_type: [
        "bireysel",
        "asenkron",
        "grup",
        "cift_aile",
        "on_gorusme",
        "supervizyon",
      ],
      task_status: ["pending", "completed", "skipped"],
      user_role: [
        "visitor",
        "musteri",
        "danisan",
        "kurumsal",
        "affiliate",
        "admin",
      ],
      user_status: ["pending", "active", "suspended", "rejected"],
      webinar_reg_status: ["registered", "attended", "cancelled", "refunded"],
      webinar_status: ["draft", "published", "cancelled", "completed"],
    },
  },
} as const
