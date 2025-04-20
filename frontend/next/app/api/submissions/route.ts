import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  submitAssignment,
  getSubmissionByAssignmentAndStudent,
  updateSubmission,
  getSubmissionsByAssignment,
  gradeSubmission,
} from '@/lib/assignment-service'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const submission = await submitAssignment({
      ...body,
      student_id: session.user.id,
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Error submitting assignment:', error)
    return NextResponse.json(
      { error: 'Failed to submit assignment' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const assignmentId = searchParams.get('assignmentId')

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      )
    }

    // If user is a professor, return all submissions for the assignment
    if (session.user.role === 'professor') {
      const submissions = await getSubmissionsByAssignment(assignmentId)
      return NextResponse.json(submissions)
    }

    // If user is a student, return their submission for the assignment
    const submission = await getSubmissionByAssignmentAndStudent(
      assignmentId,
      session.user.id
    )
    return NextResponse.json(submission)
  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    const body = await req.json()

    // If user is a professor, they can grade the submission
    if (session.user.role === 'professor' && body.grade !== undefined) {
      const submission = await gradeSubmission(
        id,
        body.grade,
        body.feedback
      )
      return NextResponse.json(submission)
    }

    // If user is a student, they can update their submission
    if (session.user.role === 'student') {
      const submission = await updateSubmission(id, {
        ...body,
        updated_at: new Date().toISOString(),
      })
      return NextResponse.json(submission)
    }

    return NextResponse.json(
      { error: 'Unauthorized to perform this action' },
      { status: 403 }
    )
  } catch (error) {
    console.error('Error updating submission:', error)
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    )
  }
} 