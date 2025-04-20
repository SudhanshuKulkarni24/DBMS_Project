"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { AlertCircle, Bell, CheckCircle, ExternalLink, Pin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { type Announcement, getAnnouncementsForStudent } from "@/lib/announcement-service"

export default function AnnouncementsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all, important, course
  const [searchQuery, setSearchQuery] = useState("")
  const [courseFilter, setCourseFilter] = useState("all")
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (!session?.user.id) return

    fetchAnnouncements()
  }, [session])

  useEffect(() => {
    if (announcements.length > 0) {
      filterAnnouncements()
    }
  }, [filter, searchQuery, courseFilter, announcements])

  const fetchAnnouncements = async () => {
    if (!session?.user.id) return

    try {
      setLoading(true)
      const data = await getAnnouncementsForStudent(session.user.id)
      setAnnouncements(data)
      setFilteredAnnouncements(data)

      // Extract unique courses from announcements
      const uniqueCourses = Array.from(new Set(data.map((a) => a.course_offering_id))).map((id) => {
        const announcement = data.find((a) => a.course_offering_id === id)
        return {
          id: id as string,
          name: announcement?.course_name || "Unknown Course",
        }
      })

      setCourses(uniqueCourses)
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

  const filterAnnouncements = () => {
    let filtered = [...announcements]

    // Apply priority filter
    if (filter === "important") {
      filtered = filtered.filter((a) => a.priority === "high" || a.is_pinned)
    }

    // Apply course filter
    if (courseFilter !== "all") {
      filtered = filtered.filter((a) => a.course_offering_id === courseFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.content.toLowerCase().includes(query) ||
          a.course_name?.toLowerCase().includes(query),
      )
    }

    // Sort by pinned first, then by date
    filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    setFilteredAnnouncements(filtered)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getPriorityIcon = (priority: string, isPinned: boolean) => {
    if (isPinned) {
      return <Pin className="h-5 w-5 text-red-600" />
    }

    if (priority === "high") {
      return <AlertCircle className="h-5 w-5 text-amber-500" />
    }

    if (priority === "low") {
      return <Bell className="h-5 w-5 text-blue-500" />
    }

    return <CheckCircle className="h-5 w-5 text-green-500" />
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div>
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-sm text-muted-foreground">View announcements from your courses</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Tabs defaultValue="all" className="w-[400px]" onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="important">Important</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-1 items-center gap-2">
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Announcements</CardTitle>
          <CardDescription>Announcements from your enrolled courses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">Loading announcements...</div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="flex justify-center p-4 text-muted-foreground">No announcements found</div>
          ) : (
            <div className="space-y-6">
              {filteredAnnouncements.map((announcement) => (
                <div key={announcement.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(announcement.priority, announcement.is_pinned)}
                      <h3 className="text-lg font-semibold">{announcement.title}</h3>
                      {announcement.is_pinned && (
                        <Badge variant="outline" className="ml-2 bg-red-50 text-red-700">
                          Pinned
                        </Badge>
                      )}
                    </div>
                    <Badge>{announcement.course_name}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Posted by {announcement.creator_name} on {formatDate(announcement.created_at)}
                  </p>
                  <p className="whitespace-pre-line">{announcement.content}</p>

                  {announcement.attachment_urls && announcement.attachment_urls.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Attachments:</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {announcement.attachment_urls.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs hover:bg-muted/80"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Attachment {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

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

