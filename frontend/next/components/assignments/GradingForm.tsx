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

const gradingSchema = z.object({
  grade: z.number().min(0).max(100),
  feedback: z.string().optional(),
})

type GradingFormProps = {
  submissionId: string
  maxPoints: number
  onSuccess?: () => void
  initialData?: {
    grade: number | null
    feedback: string | null
  }
}

export function GradingForm({
  submissionId,
  maxPoints,
  onSuccess,
  initialData,
}: GradingFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof gradingSchema>>({
    resolver: zodResolver(gradingSchema),
    defaultValues: initialData || {
      grade: 0,
      feedback: '',
    },
  })

  async function onSubmit(values: z.infer<typeof gradingSchema>) {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/submissions?id=${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error('Failed to grade submission')
      }

      toast.success('Submission graded successfully')
      onSuccess?.()
    } catch (error) {
      console.error('Error grading submission:', error)
      toast.error('Failed to grade submission')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="grade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grade (out of {maxPoints})</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={maxPoints}
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
          name="feedback"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feedback</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter feedback for the submission"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Grading...' : 'Submit Grade'}
        </Button>
      </form>
    </Form>
  )
} 