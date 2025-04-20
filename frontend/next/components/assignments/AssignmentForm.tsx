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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const assignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  due_date: z.string().min(1, 'Due date is required'),
  max_points: z.number().min(0, 'Max points must be positive'),
  submission_type: z.string().min(1, 'Submission type is required'),
})

type AssignmentFormProps = {
  courseOfferingId: string
  onSuccess?: () => void
  initialData?: {
    id: string
    title: string
    description: string
    due_date: string
    max_points: number
    submission_type: string
  }
}

export function AssignmentForm({
  courseOfferingId,
  onSuccess,
  initialData,
}: AssignmentFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof assignmentSchema>>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: initialData || {
      title: '',
      description: '',
      due_date: '',
      max_points: 100,
      submission_type: 'gdrive',
    },
  })

  async function onSubmit(values: z.infer<typeof assignmentSchema>) {
    try {
      setIsLoading(true)
      const url = initialData
        ? `/api/assignments?id=${initialData.id}`
        : '/api/assignments'
      const method = initialData ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          course_offering_id: courseOfferingId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save assignment')
      }

      toast.success(
        initialData
          ? 'Assignment updated successfully'
          : 'Assignment created successfully'
      )
      onSuccess?.()
    } catch (error) {
      console.error('Error saving assignment:', error)
      toast.error('Failed to save assignment')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Assignment title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Assignment description"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="max_points"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Points</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value, 10))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="submission_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Submission Type</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="e.g., gdrive"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? 'Saving...'
            : initialData
            ? 'Update Assignment'
            : 'Create Assignment'}
        </Button>
      </form>
    </Form>
  )
} 