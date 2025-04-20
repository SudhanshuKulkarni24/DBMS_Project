import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SubmissionForm } from './SubmissionForm'
import { toast } from 'sonner'

type Assignment = {
  id: string
  title: string
  description: string
  due_date: string
  max_points: number
  submission_type: string
}

type Submission = {
  id: string
  submission_url: string
  submitted_at: string
  grade: number | null
  feedback: string | null
}

type AssignmentListProps = {
  courseOfferingId: string
}

export function AssignmentList({ courseOfferingId }: AssignmentListProps) {
  const { data: session } = useSession()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(
    null
  )
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const response = await fetch(
          `/api/assignments?courseOfferingId=${courseOfferingId}`
        )
        if (!response.ok) throw new Error('Failed to fetch assignments')
        const data = await response.json()
        setAssignments(data)
      } catch (error) {
        console.error('Error fetching assignments:', error)
        toast.error('Failed to fetch assignments')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssignments()
  }, [courseOfferingId])

  useEffect(() => {
    async function fetchSubmissions() {
      if (!session?.user?.id) return

      try {
        const submissionsData: Record<string, Submission> = {}
        for (const assignment of assignments) {
          const response = await fetch(
            `/api/submissions?assignmentId=${assignment.id}`
          )
          if (response.ok) {
            const data = await response.json()
            if (data) {
              submissionsData[assignment.id] = data
            }
          }
        }
        setSubmissions(submissionsData)
      } catch (error) {
        console.error('Error fetching submissions:', error)
        toast.error('Failed to fetch submissions')
      }
    }

    if (assignments.length > 0) {
      fetchSubmissions()
    }
  }, [assignments, session?.user?.id])

  if (isLoading) {
    return <div>Loading assignments...</div>
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <Card key={assignment.id}>
          <CardHeader>
            <CardTitle>{assignment.title}</CardTitle>
            <CardDescription>
              Due: {format(new Date(assignment.due_date), 'PPP p')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none mb-4">
              {assignment.description}
            </div>

            {session?.user?.role === 'student' && (
              <div className="space-y-4">
                {submissions[assignment.id] ? (
                  <div>
                    <p className="text-sm text-gray-500">
                      Submitted:{' '}
                      {format(
                        new Date(submissions[assignment.id].submitted_at),
                        'PPP p'
                      )}
                    </p>
                    {submissions[assignment.id].grade !== null && (
                      <p className="text-sm font-medium">
                        Grade: {submissions[assignment.id].grade}/
                        {assignment.max_points}
                      </p>
                    )}
                    {submissions[assignment.id].feedback && (
                      <p className="text-sm text-gray-600">
                        Feedback: {submissions[assignment.id].feedback}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setSelectedAssignment(assignment.id)}
                      className="mt-2"
                    >
                      Update Submission
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="default"
                    onClick={() => setSelectedAssignment(assignment.id)}
                  >
                    Submit Assignment
                  </Button>
                )}
              </div>
            )}

            {selectedAssignment === assignment.id && (
              <div className="mt-4">
                <SubmissionForm
                  assignmentId={assignment.id}
                  initialData={submissions[assignment.id]}
                  onSuccess={() => {
                    setSelectedAssignment(null)
                    // Refresh submissions
                    window.location.reload()
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 