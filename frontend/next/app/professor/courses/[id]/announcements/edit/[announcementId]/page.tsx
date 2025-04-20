"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getCourseOfferingByIdAction, updateAnnouncementAction } from "@/lib/actions"

export default function EditAnnouncementPage({
  params,
}: {
  params: { id: string; announcementId: string }
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [courseOffering, setCourseOffering] = useState<any>(null)
  const [announcement, setAnnouncement] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "normal",
    is_pinned: false,
  })

  useEffect(() => {
    // Redirect if not professor or admin
    if (session && session.user.role !== "professor" && session.user.role !== "admin") {
      router.push("/dashboard")
      return
    }

    fetchData()
  }, [session, router, params.id, params.announcementId])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch course offering
      const offering = await getCourseOfferingByIdAction(params.id)
      setCourseOffering(offering)

      // Check if this professor teaches this course
      if (session?.user.role === "professor" && offering && offering.professor_id !== session.user.id) {
        toast({
          title: "Access Denied",
          description: "You do not have permission to edit announcements for this course",
          variant: "destructive",
        })
        router.push("/professor/courses")
        return
      }

      // Fetch announcement
      // For now, we'll use a mock announcement
      const mockAnnouncement = {
        id: params.announcementId,
        title: "Sample Announcement",
        content: "This is a sample announcement content.",
        priority: "normal",
        is_pinned: false,
        course_offering_id: params.id,
        created_by: session?.user.id,
        created_at: new Date().toISOString(),
      }

      setAnnouncement(mockAnnouncement)
      setFormData({
        title: mockAnnouncement.title,
        content: mockAnnouncement.content,
        priority: mockAnnouncement.priority,
        is_pinned: mockAnnouncement.is_pinned,
      })
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load announcement data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Update announcement
      await updateAnnouncementAction(params.announcementId, {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        is_pinned: formData.is_pinned,
      })

      toast({
        title: "Success",
        description: "Announcement updated successfully",
      })

      // Redirect back to announcements page
      router.push(`/professor/courses/${params.id}/announcements`)
    } catch (error) {
      console.error("Error updating announcement:", error)
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Loading...</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Announcement</h1>
          <p className="text-sm text-muted-foreground">
            {courseOffering?.course_id} - {courseOffering?.course_name}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/professor/courses/${params.id}/announcements`)}>
          Cancel
        </Button>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Announcement Details</CardTitle>
            <CardDescription>Edit the announcement information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Announcement title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Announcement content"
                rows={8}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleSelectChange("priority", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="is_pinned"
                  checked={formData.is_pinned}
                  onCheckedChange={(checked) => handleSwitchChange("is_pinned", checked)}
                />
                <Label htmlFor="is_pinned">Pin Announcement</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/professor/courses/${params.id}/announcements`)}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

