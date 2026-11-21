// Generated from the Supabase `medibook` schema.
// The hosted type generator only inspects `public`, so this file is kept in
// sync by hand until the schema is exposed to the generator.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
  medibook: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          created_at: string
          doctor_id: string
          doctor_notes: string
          end_time: string
          id: string
          patient_id: string
          reason: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          created_at?: string
          doctor_id: string
          doctor_notes?: string
          end_time: string
          id?: string
          patient_id: string
          reason?: string
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          created_at?: string
          doctor_id?: string
          doctor_notes?: string
          end_time?: string
          id?: string
          patient_id?: string
          reason?: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'appointments_doctor_id_fkey'
            columns: ['doctor_id']
            isOneToOne: false
            referencedRelation: 'doctors'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      doctor_availability: {
        Row: {
          created_at: string
          doctor_id: string
          end_time: string
          id: string
          slot_minutes: number
          start_time: string
          weekday: number
        }
        Insert: {
          created_at?: string
          doctor_id: string
          end_time: string
          id?: string
          slot_minutes?: number
          start_time: string
          weekday: number
        }
        Update: {
          created_at?: string
          doctor_id?: string
          end_time?: string
          id?: string
          slot_minutes?: number
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: 'doctor_availability_doctor_id_fkey'
            columns: ['doctor_id']
            isOneToOne: false
            referencedRelation: 'doctors'
            referencedColumns: ['id']
          },
        ]
      }
      doctor_time_off: {
        Row: {
          created_at: string
          date: string
          doctor_id: string
          id: string
          reason: string
        }
        Insert: {
          created_at?: string
          date: string
          doctor_id: string
          id?: string
          reason?: string
        }
        Update: {
          created_at?: string
          date?: string
          doctor_id?: string
          id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: 'doctor_time_off_doctor_id_fkey'
            columns: ['doctor_id']
            isOneToOne: false
            referencedRelation: 'doctors'
            referencedColumns: ['id']
          },
        ]
      }
      doctors: {
        Row: {
          bio: string
          created_at: string
          department_id: string | null
          fees: number
          id: string
          is_active: boolean
          photo_url: string | null
          profile_id: string
          specialization: string
          updated_at: string
        }
        Insert: {
          bio?: string
          created_at?: string
          department_id?: string | null
          fees?: number
          id?: string
          is_active?: boolean
          photo_url?: string | null
          profile_id: string
          specialization?: string
          updated_at?: string
        }
        Update: {
          bio?: string
          created_at?: string
          department_id?: string | null
          fees?: number
          id?: string
          is_active?: boolean
          photo_url?: string | null
          profile_id?: string
          specialization?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'doctors_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'doctors_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notifications_log: {
        Row: {
          appointment_id: string
          id: string
          sent_at: string
          type: string
        }
        Insert: {
          appointment_id: string
          id?: string
          sent_at?: string
          type: string
        }
        Update: {
          appointment_id?: string
          id?: string
          sent_at?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_log_appointment_id_fkey'
            columns: ['appointment_id']
            isOneToOne: false
            referencedRelation: 'appointments'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          phone?: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_profile: { Args: { p_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_doctor: { Args: never; Returns: boolean }
      owns_doctor: { Args: { p_doctor_id: string }; Returns: boolean }
      user_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals['medibook']

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  medibook: {
    Enums: {},
  },
} as const
