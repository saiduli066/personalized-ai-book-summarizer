// Database types generated from Supabase schema
// This provides type safety for all database operations

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      life_profiles: {
        Row: {
          id: string;
          user_id: string;
          answers: Json;
          life_summary: string | null;
          life_embedding: number[] | null;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          answers?: Json;
          life_summary?: string | null;
          life_embedding?: number[] | null;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          answers?: Json;
          life_summary?: string | null;
          life_embedding?: number[] | null;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      books: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          author: string | null;
          file_path: string;
          file_size: number | null;
          page_count: number | null;
          processed: boolean;
          processing_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          author?: string | null;
          file_path: string;
          file_size?: number | null;
          page_count?: number | null;
          processed?: boolean;
          processing_status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          author?: string | null;
          file_path?: string;
          file_size?: number | null;
          page_count?: number | null;
          processed?: boolean;
          processing_status?: string;
          created_at?: string;
        };
      };
      book_chunks: {
        Row: {
          id: string;
          book_id: string;
          user_id: string;
          content: string;
          page_number: number | null;
          chunk_index: number | null;
          embedding: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          user_id: string;
          content: string;
          page_number?: number | null;
          chunk_index?: number | null;
          embedding?: number[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          book_id?: string;
          user_id?: string;
          content?: string;
          page_number?: number | null;
          chunk_index?: number | null;
          embedding?: number[] | null;
          created_at?: string;
        };
      };
      match_sessions: {
        Row: {
          id: string;
          user_id: string;
          book_ids: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_ids: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_ids?: string[];
          created_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          chunk_id: string;
          book_id: string;
          relevance_score: number | null;
          why_relevant: string | null;
          action_step: string | null;
          is_saved: boolean;
          feedback: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          chunk_id: string;
          book_id: string;
          relevance_score?: number | null;
          why_relevant?: string | null;
          action_step?: string | null;
          is_saved?: boolean;
          feedback?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          chunk_id?: string;
          book_id?: string;
          relevance_score?: number | null;
          why_relevant?: string | null;
          action_step?: string | null;
          is_saved?: boolean;
          feedback?: string | null;
          created_at?: string;
        };
      };
      saved_excerpts: {
        Row: {
          id: string;
          user_id: string;
          match_id: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          match_id: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          match_id?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_book_chunks: {
        Args: {
          query_embedding: number[];
          user_id_filter: string;
          match_count: number;
          match_threshold: number;
        };
        Returns: {
          id: string;
          book_id: string;
          content: string;
          page_number: number;
          similarity: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
