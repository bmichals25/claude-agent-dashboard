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
      sessions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          session_id: string
          created_at: string
          role: 'user' | 'assistant' | 'system'
          content: string
          agent_id: string | null
        }
        Insert: {
          id?: string
          session_id: string
          created_at?: string
          role: 'user' | 'assistant' | 'system'
          content: string
          agent_id?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          created_at?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          agent_id?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          session_id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          status: 'active' | 'completed' | 'archived'
          color: string
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
        }
      }
      tasks: {
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
        }
      }
      stream_entries: {
        Row: {
          id: string
          task_id: string
          created_at: string
          agent_id: string
          type: 'thought' | 'action' | 'result' | 'error'
          content: string
        }
        Insert: {
          id?: string
          task_id: string
          created_at?: string
          agent_id: string
          type: 'thought' | 'action' | 'result' | 'error'
          content: string
        }
        Update: {
          id?: string
          task_id?: string
          created_at?: string
          agent_id?: string
          type?: 'thought' | 'action' | 'result' | 'error'
          content?: string
        }
      }
      events: {
        Row: {
          id: string
          session_id: string
          created_at: string
          type: 'task_created' | 'task_assigned' | 'task_completed' | 'agent_thinking' | 'agent_action' | 'error' | 'delegation'
          agent_id: string | null
          task_id: string | null
          message: string
          data: Json | null
        }
        Insert: {
          id?: string
          session_id: string
          created_at?: string
          type: 'task_created' | 'task_assigned' | 'task_completed' | 'agent_thinking' | 'agent_action' | 'error' | 'delegation'
          agent_id?: string | null
          task_id?: string | null
          message: string
          data?: Json | null
        }
        Update: {
          id?: string
          session_id?: string
          created_at?: string
          type?: 'task_created' | 'task_assigned' | 'task_completed' | 'agent_thinking' | 'agent_action' | 'error' | 'delegation'
          agent_id?: string | null
          task_id?: string | null
          message?: string
          data?: Json | null
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
