import { db } from './db'
import { Database } from './database.types'

type Assignment = Database['public']['Tables']['assignments']['Row']
type AssignmentInsert = Database['public']['Tables']['assignments']['Insert']
type AssignmentUpdate = Database['public']['Tables']['assignments']['Update']

type Submission = Database['public']['Tables']['submissions']['Row']
type SubmissionInsert = Database['public']['Tables']['submissions']['Insert']
type SubmissionUpdate = Database['public']['Tables']['submissions']['Update']

export async function createAssignment(assignment: AssignmentInsert): Promise<Assignment> {
  const { data, error } = await db
    .from('assignments')
    .insert(assignment)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAssignmentsByCourse(courseOfferingId: string): Promise<Assignment[]> {
  const { data, error } = await db
    .from('assignments')
    .select('*')
    .eq('course_offering_id', courseOfferingId)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data
}

export async function getAssignmentById(id: string): Promise<Assignment> {
  const { data, error } = await db
    .from('assignments')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function updateAssignment(id: string, assignment: AssignmentUpdate): Promise<Assignment> {
  const { data, error } = await db
    .from('assignments')
    .update(assignment)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAssignment(id: string): Promise<void> {
  const { error } = await db
    .from('assignments')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function submitAssignment(submission: SubmissionInsert): Promise<Submission> {
  const { data, error } = await db
    .from('submissions')
    .insert(submission)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSubmissionByAssignmentAndStudent(
  assignmentId: string,
  studentId: string
): Promise<Submission | null> {
  const { data, error } = await db
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('student_id', studentId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows returned"
  return data
}

export async function updateSubmission(id: string, submission: SubmissionUpdate): Promise<Submission> {
  const { data, error } = await db
    .from('submissions')
    .update(submission)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
  const { data, error } = await db
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false })

  if (error) throw error
  return data
}

export async function gradeSubmission(id: string, grade: number, feedback?: string): Promise<Submission> {
  const { data, error } = await db
    .from('submissions')
    .update({
      grade,
      feedback,
      graded_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
} 