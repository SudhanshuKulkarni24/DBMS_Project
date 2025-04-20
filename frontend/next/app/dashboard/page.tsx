"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Calendar, CheckCircle, Users, Clock, AlertCircle } from "lucide-react"
import { getUserById } from "@/lib/user-service"
import { getEnrollmentsForStudent } from "@/lib/course-service"
import { getAnnouncementsForStudent } from "@/lib/announcement-service"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const { data: session } = useSession()
  const { toast } = useToast()

  const [userData, setUserData] = useState<any>(null)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData()
      fetchEnrollments()
      fetchAnnouncements()
    }
  }, [session])

  const fetchUserData = async () => {
    try {
      const user = await getUserById(session!.user.id)
      setUserData(user)
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      })
    }
  }

  const fetchEnrollments = async () => {
    try {
      const data = await getEnrollmentsForStudent(session!.user.id)
      setEnrollments(data)

      // Extract upcoming classes from enrollments
      const today = new Date()
      const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][today.getDay()]

      const classes = []
      for (const enrollment of data) {
        if (enrollment.status === "enrolled") {
          // Get course offering details
          const courseOffering = enrollment.course_offering
          if (courseOffering && courseOffering.schedules) {
            for (const schedule of courseOffering.schedules) {
              if (schedule.day_of_week === dayOfWeek) {
                classes.push({
                  id: courseOffering.course_id,
                  name: enrollment.course_name,
                  time: `${schedule.start_time.substring(0, 5)} - ${schedule.end_time.substring(0, 5)}`,
                  location: schedule.room_number || courseOffering.location || "TBA",
                  instructor: courseOffering.professor_name || "TBA",
                })
              }
            }
          }
        }
      }

      setUpcomingClasses(classes)
    } catch (error) {
      console.error("Error fetching enrollments:", error)
      toast({
        title: "Error",
        description: "Failed to load enrollment data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const data = await getAnnouncementsForStudent(session!.user.id)
      // Get only the most recent 2 announcements
      setAnnouncements(data.slice(0, 2))
    } catch (error) {
      console.error("Error fetching announcements:", error)
      toast({
        title: "Error",
        description: "Failed to load announcements",
        variant: "destructive",
      })
    }
  }

  // Calculate registered credits
  const registeredCredits = enrollments
    .filter((e) => e.status === "enrolled")
    .reduce((sum, e) => sum + (e.credits || 0), 0)

  // Maximum credits (could be fetched from a settings table in the future)
  const maxCredits = 25

  if (loading && !userData) {
    return (
      <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Loading dashboard...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">Welcome, {userData?.name || session?.user?.name}</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Student ID</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData?.student_id || "Not assigned"}</div>
            <p className="text-xs text-muted-foreground">{userData?.branch || "Department not assigned"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Graduating Year</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData?.graduating_year || "Not set"}</div>
            <p className="text-xs text-muted-foreground">Expected graduation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Registered Credits</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {registeredCredits} / {maxCredits}
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(registeredCredits / maxCredits) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Registration Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length > 0 ? "Complete" : "Not Started"}</div>
            <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Today's Classes</CardTitle>
            <CardDescription>Your upcoming classes for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingClasses.length > 0 ? (
                upcomingClasses.map((class_, index) => (
                  <div key={index} className="flex items-start gap-4 rounded-lg border p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10 text-primary">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{class_.name}</h3>
                        <div className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{class_.id}</div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {class_.time} • {class_.location}
                      </p>
                      <p className="text-sm text-muted-foreground">Instructor: {class_.instructor}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex justify-center p-4 text-muted-foreground">No classes scheduled for today</div>
              )}
              <div className="flex justify-center">
                <Link className="text-sm text-primary underline-offset-4 hover:underline" href="/dashboard/timetable">
                  View Full Timetable
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>Recent updates and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <div key={announcement.id} className="flex items-start gap-4 rounded-lg border p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded text-primary">
                      {announcement.priority === "high" ? (
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{announcement.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex justify-center p-4 text-muted-foreground">No recent announcements</div>
              )}
              <div className="flex justify-center">
                <Link
                  className="text-sm text-primary underline-offset-4 hover:underline"
                  href="/dashboard/announcements"
                >
                  View All Announcements
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

