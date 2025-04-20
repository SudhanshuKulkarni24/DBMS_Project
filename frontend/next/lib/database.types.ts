export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          password: string | null
          role: string
          student_id: string | null
          branch: string | null
          graduating_year: number | null
          profile_picture_url: string | null
          phone_number: string | null
          address: string | null
          emergency_contact: string | null
          date_of_birth: string | null
          gender: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          password?: string | null
          role?: string
          student_id?: string | null
          branch?: string | null
          graduating_year?: number | null
          profile_picture_url?: string | null
          phone_number?: string | null
          address?: string | null
          emergency_contact?: string | null
          date_of_birth?: string | null
          gender?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          password?: string | null
          role?: string
          student_id?: string | null
          branch?: string | null
          graduating_year?: number | null
          profile_picture_url?: string | null
          phone_number?: string | null
          address?: string | null
          emergency_contact?: string | null
          date_of_birth?: string | null
          gender?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          name: string
          department: string
          description: string | null
          credits: number
          theory_credits: number | null
          lab_credits: number | null
          course_type: string | null
          syllabus_url: string | null
          learning_outcomes: string | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          department: string
          description?: string | null
          credits: number
          theory_credits?: number | null
          lab_credits?: number | null
          course_type?: string | null
          syllabus_url?: string | null
          learning_outcomes?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          department?: string
          description?: string | null
          credits?: number
          theory_credits?: number | null
          lab_credits?: number | null
          course_type?: string | null
          syllabus_url?: string | null
          learning_outcomes?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      prerequisites: {
        Row: {
          course_id: string
          prerequisite_id: string
          min_grade: string | null
        }
        Insert: {
          course_id: string
          prerequisite_id: string
          min_grade?: string | null
        }
        Update: {
          course_id?: string
          prerequisite_id?: string
          min_grade?: string | null
        }
      }
      course_offerings: {
        Row: {
          id: string
          course_id: string
          professor_id: string | null
          semester: string
          year: number
          max_students: number
          location: string | null
          syllabus_url: string | null
          grading_scheme: string | null
          registration_open: boolean | null
          teaching_assistants: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          professor_id?: string | null
          semester: string
          year: number
          max_students?: number
          location?: string | null
          syllabus_url?: string | null
          grading_scheme?: string | null
          registration_open?: boolean | null
          teaching_assistants?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          professor_id?: string | null
          semester?: string
          year?: number
          max_students?: number
          location?: string | null
          syllabus_url?: string | null
          grading_scheme?: string | null
          registration_open?: boolean | null
          teaching_assistants?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      course_schedules: {
        Row: {
          id: string
          course_offering_id: string
          day_of_week: string
          start_time: string
          end_time: string
          room_number: string | null
          schedule_type: string | null
        }
        Insert: {
          id?: string
          course_offering_id: string
          day_of_week: string
          start_time: string
          end_time: string
          room_number?: string | null
          schedule_type?: string | null
        }
        Update: {
          id?: string
          course_offering_id?: string
          day_of_week?: string
          start_time?: string
          end_time?: string
          room_number?: string | null
          schedule_type?: string | null
        }
      }
      enrollments: {
        Row: {
          student_id: string
          course_offering_id: string
          status: string
          grade: string | null
          attendance_percentage: number | null
          midterm_grade: string | null
          final_grade: string | null
          assignment_scores: Json | null
          feedback: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          student_id: string
          course_offering_id: string
          status?: string
          grade?: string | null
          attendance_percentage?: number | null
          midterm_grade?: string | null
          final_grade?: string | null
          assignment_scores?: Json | null
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          student_id?: string
          course_offering_id?: string
          status?: string
          grade?: string | null
          attendance_percentage?: number | null
          midterm_grade?: string | null
          final_grade?: string | null
          assignment_scores?: Json | null
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          course_offering_id: string
          created_by: string | null
          priority: string | null
          attachment_urls: string[] | null
          visible_from: string
          visible_until: string | null
          is_pinned: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          course_offering_id: string
          created_by?: string | null
          priority?: string | null
          attachment_urls?: string[] | null
          visible_from?: string
          visible_until?: string | null
          is_pinned?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          course_offering_id?: string
          created_by?: string | null
          priority?: string | null
          attachment_urls?: string[] | null
          visible_from?: string
          visible_until?: string | null
          is_pinned?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          title: string
          description: string
          course_offering_id: string
          created_by: string
          due_date: string
          max_points: number
          submission_type: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          course_offering_id: string
          created_by: string
          due_date: string
          max_points: number
          submission_type?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          course_offering_id?: string
          created_by?: string
          due_date?: string
          max_points?: number
          submission_type?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          submission_url: string
          submitted_at: string
          grade: number | null
          feedback: string | null
          graded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          submission_url: string
          submitted_at?: string
          grade?: number | null
          feedback?: string | null
          graded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          submission_url?: string
          submitted_at?: string
          grade?: number | null
          feedback?: string | null
          graded_at?: string | null
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

