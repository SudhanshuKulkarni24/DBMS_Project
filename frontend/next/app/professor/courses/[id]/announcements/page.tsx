"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  type Announcement,
  createAnnouncement,
  getAnnouncementsForCourseOffering,
  deleteAnnouncement,
} from "@/lib/announcement-service"
import { getCourseOfferingById } from "@/lib/course-service"

export default function CourseAnnouncementsPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [courseOffering, setCourseOffering] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [unwrappedParams, setUnwrappedParams] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const result = await params;
      setUnwrappedParams(result);
    })();
  }, [params]);
  
  useEffect(() => {
    // Redirect if not professor or admin
    if (session && session.user.role !== "professor" && session.user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
  
    fetchCourseOffering();
    fetchAnnouncements();
  }, [session, router, unwrappedParams?.id]);

  const fetchCourseOffering = async () => {
    try {
      const offering = await getCourseOfferingById(params.id)
      setCourseOffering(offering)

      // Check if this professor teaches this course
      if (session?.user.role === "professor" && offering && offering.professor_id !== session.user.id) {
        toast({
          title: "Access Denied",
          description: "You do not have permission to view this course",
          variant: "destructive",
        })
        router.push("/professor/courses")
      }
    } catch (error) {
      console.error("Error fetching course offering:", error)
      toast({
        title: "Error",
        description: "Failed to fetch course details",
        variant: "destructive",
      })
    }
  }

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const data = await getAnnouncementsForCourseOffering(params.id)
      setAnnouncements(data)
    } catch (error) {
      console.error("Error fetching announcements:", error)
      toast({
        title: "Error",
        description: "Failed to fetch announcements",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content are required",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      const newAnnouncement = await createAnnouncement({
        title: formData.title,
        content: formData.content,
        course_offering_id: params.id,
        created_by: session?.user.id || "",
      })

      toast({
        title: "Success",
        description: "Announcement created successfully",
      })

      // Add the new announcement to the list
      setAnnouncements([
        {
          ...newAnnouncement,
          course_name: courseOffering?.course_name,
          creator_name: session?.user.name || "",
        },
        ...announcements,
      ])

      // Reset form
      setFormData({
        title: "",
        content: "",
      })
    } catch (error) {
      console.error("Error creating announcement:", error)
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteAnnouncement(id)

      if (success) {
        toast({
          title: "Success",
          description: "Announcement deleted successfully",
        })

        // Remove the announcement from the list
        setAnnouncements(announcements.filter((a) => a.id !== id))
      }
    } catch (error) {
      console.error("Error deleting announcement:", error)
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Course Announcements</h1>
          <p className="text-sm text-muted-foreground">
            {courseOffering?.course_id} - {courseOffering?.course_name}
          </p>
        </div>
        <Button onClick={() => router.push(`/professor/courses/${params.id}`)}>Back to Course</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Announcement</CardTitle>
          <CardDescription>Post a new announcement for students in this course</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                rows={5}
                required
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Posting..." : "Post Announcement"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
          <CardDescription>All announcements for this course</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="flex justify-center p-4 text-muted-foreground">No announcements yet</div>
          ) : (
            <div className="space-y-6">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{announcement.title}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-100"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      Delete
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Posted by {announcement.creator_name} on {formatDate(announcement.created_at)}
                  </p>
                  <p className="whitespace-pre-line">{announcement.content}</p>
                  <Separator className="my-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

