export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      dashboard_sessions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string | null
          user_id?: string | null
        }
      }
      dashboard_messages: {
        Row: {
          id: string
          session_id: string
          created_at: string
          role: 'user' | 'assistant' | 'system'
          content: string
          agent_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          session_id: string
          created_at?: string
          role: 'user' | 'assistant' | 'system'
          content: string
          agent_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          created_at?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          agent_id?: string | null
          user_id?: string | null
        }
      }
      dashboard_projects: {
        Row: {
          id: string
          session_id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          status: 'active' | 'completed' | 'archived'
          color: string
          user_id: string | null
        }
        Insert: {
          id?: string
          session_id: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          status?: 'active' | 'completed' | 'archived'
          color?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          status?: 'active' | 'completed' | 'archived'
          color?: string
          user_id?: string | null
        }
      }
      dashboard_tasks: {
        Row: {
          id: string
          session_id: string
          project_id: string | null
          created_at: string
          updated_at: string
          title: string
          description: string | null
          status: 'pending' | 'in_progress' | 'review' | 'completed'
          priority: 'low' | 'medium' | 'high' | 'critical'
          assigned_agent_id: string | null
          delegated_from: string | null
          progress: number
          current_step: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          session_id: string
          project_id?: string | null
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'review' | 'completed'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          assigned_agent_id?: string | null
          delegated_from?: string | null
          progress?: number
          current_step?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          project_id?: string | null
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'review' | 'completed'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          assigned_agent_id?: string | null
          delegated_from?: string | null
          progress?: number
          current_step?: string | null
          user_id?: string | null
        }
      }
      dashboard_stream_entries: {
        Row: {
          id: string
          task_id: string
          created_at: string
          agent_id: string
          type: 'thought' | 'action' | 'result' | 'error'
          content: string
          user_id: string | null
        }
        Insert: {
          id?: string
          task_id: string
          created_at?: string
          agent_id: string
          type: 'thought' | 'action' | 'result' | 'error'
          content: string
          user_id?: string | null
        }
        Update: {
          id?: string
          task_id?: string
          created_at?: string
          agent_id?: string
          type?: 'thought' | 'action' | 'result' | 'error'
          content?: string
          user_id?: string | null
        }
      }
      dashboard_events: {
        Row: {
          id: string
          session_id: string
          created_at: string
          type: 'task_created' | 'task_assigned' | 'task_completed' | 'agent_thinking' | 'agent_action' | 'error' | 'delegation' | 'pipeline_started'
          agent_id: string | null
          task_id: string | null
          message: string
          data: Json | null
          user_id: string | null
        }
        Insert: {
          id?: string
          session_id: string
          created_at?: string
          type: 'task_created' | 'task_assigned' | 'task_completed' | 'agent_thinking' | 'agent_action' | 'error' | 'delegation' | 'pipeline_started'
          agent_id?: string | null
          task_id?: string | null
          message: string
          data?: Json | null
          user_id?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          created_at?: string
          type?: 'task_created' | 'task_assigned' | 'task_completed' | 'agent_thinking' | 'agent_action' | 'error' | 'delegation' | 'pipeline_started'
          agent_id?: string | null
          task_id?: string | null
          message?: string
          data?: Json | null
          user_id?: string | null
        }
      }
      dashboard_settings: {
        Row: {
          id: string
          session_id: string | null
          user_id: string | null
          theme: string
          accent_color: string
          show_notifications: boolean
          auto_scroll_chat: boolean
          sound_enabled: boolean
          sound_volume: number
          app_name: string
          app_tagline: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          user_id?: string | null
          theme?: string
          accent_color?: string
          show_notifications?: boolean
          auto_scroll_chat?: boolean
          sound_enabled?: boolean
          sound_volume?: number
          app_name?: string
          app_tagline?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          user_id?: string | null
          theme?: string
          accent_color?: string
          show_notifications?: boolean
          auto_scroll_chat?: boolean
          sound_enabled?: boolean
          sound_volume?: number
          app_name?: string
          app_tagline?: string
          created_at?: string
          updated_at?: string
        }
      }
      dashboard_skills: {
        Row: {
          id: string
          user_id: string | null
          skill_id: string
          skill_name: string
          content: string
          github_url: string | null
          is_installed: boolean
          installed_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          skill_id: string
          skill_name: string
          content: string
          github_url?: string | null
          is_installed?: boolean
          installed_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          skill_id?: string
          skill_name?: string
          content?: string
          github_url?: string | null
          is_installed?: boolean
          installed_at?: string
        }
      }
      dashboard_agent_configs: {
        Row: {
          id: string
          user_id: string | null
          agent_id: string
          config_content: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          agent_id: string
          config_content: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          agent_id?: string
          config_content?: string
          updated_at?: string
        }
      }
      dashboard_project_appearance: {
        Row: {
          id: string
          session_id: string | null
          user_id: string | null
          project_id: string
          logo_url: string | null
          background_color: string | null
          background_preset: string | null
          hero_background_image: string | null
          subtitle: string | null
          slug: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          user_id?: string | null
          project_id: string
          logo_url?: string | null
          background_color?: string | null
          background_preset?: string | null
          hero_background_image?: string | null
          subtitle?: string | null
          slug?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          user_id?: string | null
          project_id?: string
          logo_url?: string | null
          background_color?: string | null
          background_preset?: string | null
          hero_background_image?: string | null
          subtitle?: string | null
          slug?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
}
