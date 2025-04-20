import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const submissionSchema = z.object({
  submission_url: z.string().url('Please enter a valid Google Drive URL'),
})

type SubmissionFormProps = {
  assignmentId: string
  onSuccess?: () => void
  initialData?: {
    id: string
    submission_url: string
  }
}

export function SubmissionForm({
  assignmentId,
  onSuccess,
  initialData,
}: SubmissionFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof submissionSchema>>({
    resolver: zodResolver(submissionSchema),
    defaultValues: initialData || {
      submission_url: '',
    },
  })

  async function onSubmit(values: z.infer<typeof submissionSchema>) {
    try {
      setIsLoading(true)
      const url = initialData
        ? `/api/submissions?id=${initialData.id}`
        : '/api/submissions'
      const method = initialData ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          assignment_id: assignmentId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit assignment')
      }

      toast.success(
        initialData
          ? 'Submission updated successfully'
          : 'Assignment submitted successfully'
      )
      onSuccess?.()
    } catch (error) {
      console.error('Error submitting assignment:', error)
      toast.error('Failed to submit assignment')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="submission_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Google Drive Submission URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? 'Submitting...'
            : initialData
            ? 'Update Submission'
            : 'Submit Assignment'}
        </Button>
      </form>
    </Form>
  )
} 