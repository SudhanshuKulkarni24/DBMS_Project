import { executeQuery } from './db'

export type Assignment = {
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

export type AssignmentInsert = Omit<Assignment, 'id' | 'created_at' | 'updated_at'>
export type AssignmentUpdate = Partial<AssignmentInsert>

export type Submission = {
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
  student_name?: string
}

export type SubmissionInsert = Omit<Submission, 'id' | 'created_at' | 'updated_at' | 'student_name'>
export type SubmissionUpdate = Partial<Omit<Submission, 'id' | 'created_at' | 'updated_at' | 'student_name'>>

export async function createAssignment(assignment: AssignmentInsert): Promise<Assignment> {
  const result = await executeQuery(
    `INSERT INTO assignments (
      title, description, course_offering_id, created_by, due_date, 
      max_points, submission_type, is_active, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      assignment.title,
      assignment.description,
      assignment.course_offering_id,
      assignment.created_by,
      assignment.due_date,
      assignment.max_points,
      assignment.submission_type,
      assignment.is_active,
      new Date().toISOString(),
      new Date().toISOString()
    ]
  )
  
  return result.rows[0]
}

export async function getAssignmentsByCourse(courseOfferingId: string): Promise<Assignment[]> {
  const result = await executeQuery(
    `SELECT * FROM assignments 
    WHERE course_offering_id = $1 
    ORDER BY due_date ASC`,
    [courseOfferingId]
  )
  
  return result.rows
}

export async function getAssignment(id: string): Promise<Assignment | null> {
  try {
    const result = await executeQuery(
      `SELECT a.*, c.* 
      FROM assignments a
      LEFT JOIN courses c ON a.course_offering_id = c.id
      WHERE a.id = $1`,
      [id]
    )
    
    if (result.rows.length === 0) return null
    return result.rows[0]
  } catch (error) {
    console.error('Error fetching assignment:', error)
    throw error
  }
}

export async function updateAssignment(id: string, assignment: AssignmentUpdate): Promise<Assignment> {
  const fields = Object.keys(assignment)
  const values = Object.values(assignment)
  
  // Add updated_at to the fields
  fields.push('updated_at')
  values.push(new Date().toISOString())
  
  // Create the SET part of the query
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ')
  
  // Add the id as the last parameter
  values.push(id)
  
  const result = await executeQuery(
    `UPDATE assignments 
    SET ${setClause}
    WHERE id = $${values.length}
    RETURNING *`,
    values
  )
  
  return result.rows[0]
}

export async function deleteAssignment(id: string): Promise<void> {
  await executeQuery(
    `DELETE FROM assignments WHERE id = $1`,
    [id]
  )
}

export async function submitAssignment(submission: SubmissionInsert): Promise<Submission> {
  const result = await executeQuery(
    `INSERT INTO submissions (
      assignment_id, student_id, submission_url, submitted_at, 
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      submission.assignment_id,
      submission.student_id,
      submission.submission_url,
      submission.submitted_at,
      new Date().toISOString(),
      new Date().toISOString()
    ]
  )
  
  return result.rows[0]
}

export async function getSubmission(
  assignmentId: string,
  studentId: string
): Promise<Submission | null> {
  try {
    const result = await executeQuery(
      `SELECT s.*, u.name as student_name
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.assignment_id = $1 AND s.student_id = $2`,
      [assignmentId, studentId]
    )
    
    if (result.rows.length === 0) return null
    
    return {
      ...result.rows[0],
      student_name: result.rows[0].student_name
    }
  } catch (error) {
    console.error('Error fetching submission:', error)
    throw error
  }
}

export async function updateSubmission(id: string, submission: SubmissionUpdate): Promise<Submission> {
  const fields = Object.keys(submission)
  const values = Object.values(submission)
  
  // Add updated_at to the fields
  fields.push('updated_at')
  values.push(new Date().toISOString())
  
  // Create the SET part of the query
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ')
  
  // Add the id as the last parameter
  values.push(id)
  
  const result = await executeQuery(
    `UPDATE submissions 
    SET ${setClause}
    WHERE id = $${values.length}
    RETURNING *`,
    values
  )
  
  return result.rows[0]
}

export async function getSubmissions(assignmentId: string): Promise<Submission[]> {
  try {
    const result = await executeQuery(
      `SELECT s.*, u.name as student_name
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.assignment_id = $1
      ORDER BY s.submitted_at DESC`,
      [assignmentId]
    )
    
    return result.rows.map((row: any) => ({
      ...row,
      student_name: row.student_name
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
    const result = await executeQuery(
      `UPDATE submissions 
      SET grade = $1, feedback = $2, graded_at = $3, updated_at = $4
      WHERE id = $5
      RETURNING *`,
      [
        grade.grade,
        grade.feedback,
        new Date().toISOString(),
        new Date().toISOString(),
        id
      ]
    )
    
    // Get the student name
    const studentResult = await executeQuery(
      `SELECT u.name as student_name
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.id = $1`,
      [id]
    )
    
    return {
      ...result.rows[0],
      student_name: studentResult.rows[0]?.student_name
    }
  } catch (error) {
    console.error('Error grading submission:', error)
    throw error
  }
} 