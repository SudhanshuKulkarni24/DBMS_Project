import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Assignment = Database['public']['Tables']['assignments']['Row']
export type AssignmentInsert = Database['public']['Tables']['assignments']['Insert']
export type AssignmentUpdate = Database['public']['Tables']['assignments']['Update']

export type Submission = Database['public']['Tables']['submissions']['Row'] & {
  student_name?: string
}
export type SubmissionInsert = Database['public']['Tables']['submissions']['Insert']
export type SubmissionUpdate = Database['public']['Tables']['submissions']['Update']

export async function createAssignment(assignment: AssignmentInsert): Promise<Assignment> {
  const { data, error } = await supabase
    .from('assignments')
    .insert(assignment)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAssignmentsByCourse(courseOfferingId: string): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('course_offering_id', courseOfferingId)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data
}

export async function getAssignment(id: string): Promise<Assignment | null> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*, course:courses(*)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching assignment:', error)
    throw error
  }
}

export async function updateAssignment(id: string, assignment: AssignmentUpdate): Promise<Assignment> {
  const { data, error } = await supabase
    .from('assignments')
    .update(assignment)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAssignment(id: string): Promise<void> {
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function submitAssignment(submission: SubmissionInsert): Promise<Submission> {
  const { data, error } = await supabase
    .from('submissions')
    .insert(submission)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSubmission(
  assignmentId: string,
  studentId: string
): Promise<Submission | null> {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        student:students (
          id,
          name
        )
      `)
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .single()
    
    if (error) throw error
    if (!data) return null
    
    return {
      ...data,
      student_name: data.student.name,
    }
  } catch (error) {
    console.error('Error fetching submission:', error)
    throw error
  }
}

export async function updateSubmission(id: string, submission: SubmissionUpdate): Promise<Submission> {
  const { data, error } = await supabase
    .from('submissions')
    .update(submission)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSubmissions(assignmentId: string): Promise<Submission[]> {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        student:students (
          id,
          name
        )
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false })
    
    if (error) throw error
    
    return data.map((submission: any) => ({
      ...submission,
      student_name: submission.student.name,
    }))
  } catch (error) {
    console.error('Error fetching submissions:', error)
    throw error
  }
}

export async function gradeSubmission(
  id: string,
  grade: { grade: number; feedback: string | null }
): Promise<Submission> {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .update({
        grade: grade.grade,
        feedback: grade.feedback,
        graded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        student:students (
          id,
          name
        )
      `)
      .single()
    
    if (error) throw error
    
    return {
      ...data,
      student_name: data.student.name,
    }
  } catch (error) {
    console.error('Error grading submission:', error)
    throw error
  }
} 