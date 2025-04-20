"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, Users, Bell, ClipboardList, FileText, Settings, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getCourseOfferingByIdAction, getEnrollmentsForCourseOfferingAction } from "@/lib/actions"

export default function ProfessorCourseDetailsPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [courseOffering, setCourseOffering] = useState<any>(null)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Redirect if not professor or admin
    if (session && session.user.role !== "professor" && session.user.role !== "admin") {
      router.push("/dashboard")
      return
    }

    fetchCourseOffering()
    fetchEnrollments()
  }, [session, router, params.id])

  const fetchCourseOffering = async () => {
    try {
      const offering = await getCourseOfferingByIdAction(params.id)
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
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrollments = async () => {
    try {
      const data = await getEnrollmentsForCourseOfferingAction(params.id)
      setEnrollments(data)
    } catch (error) {
      console.error("Error fetching enrollments:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Loading course details...</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{courseOffering?.course_name}</h1>
          <p className="text-sm text-muted-foreground">
            {courseOffering?.course_id} • {courseOffering?.department}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/professor/courses")}>
            Back to Courses
          </Button>
          <Button onClick={() => router.push(`/professor/courses/${params.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Course
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-5">
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
            <CardDescription>Details about the course and its schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="description">Description</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Course Code</h3>
                    <p>{courseOffering?.course_id}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Department</h3>
                    <p>{courseOffering?.department}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Credits</h3>
                    <p>{courseOffering?.credits}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Semester</h3>
                    <p>
                      {courseOffering?.semester} {courseOffering?.year}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                    <p>{courseOffering?.location || "Not specified"}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Enrollment</h3>
                    <p>
                      {courseOffering?.enrolled_count || 0} / {courseOffering?.max_students}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Registration Status</h3>
                    <Badge
                      className={
                        courseOffering?.registration_open ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }
                    >
                      {courseOffering?.registration_open ? "Open" : "Closed"}
                    </Badge>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                {courseOffering?.schedules && courseOffering.schedules.length > 0 ? (
                  <div className="space-y-4">
                    {courseOffering.schedules.map((schedule: any, index: number) => (
                      <div key={index} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Clock className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{schedule.day_of_week}</p>
                            <p className="text-sm text-muted-foreground">
                              {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                            </p>
                            {schedule.room_number && (
                              <p className="text-sm text-muted-foreground">Room: {schedule.room_number}</p>
                            )}
                          </div>
                        </div>
                        <Badge>{schedule.schedule_type || "Lecture"}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No schedule information available</p>
                )}
              </TabsContent>

              <TabsContent value="description" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 text-sm font-medium">Course Description</h3>
                    <p className="text-muted-foreground">{courseOffering?.description || "No description available"}</p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="mb-2 text-sm font-medium">Learning Outcomes</h3>
                    <p className="whitespace-pre-line text-muted-foreground">
                      {courseOffering?.learning_outcomes || "No learning outcomes specified"}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your course</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push(`/professor/courses/${params.id}/students`)}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Students
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push(`/professor/courses/${params.id}/announcements`)}
            >
              <Bell className="mr-2 h-4 w-4" />
              Announcements
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push(`/professor/courses/${params.id}/assignments`)}
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Assignments
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push(`/professor/courses/${params.id}/materials`)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Course Materials
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push(`/professor/courses/${params.id}/settings`)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Course Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrolled Students</CardTitle>
          <CardDescription>{enrollments.length} students enrolled in this course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {enrollments.slice(0, 6).map((enrollment, index) => (
              <div key={index} className="flex items-center gap-4 rounded-lg border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-sm font-medium">
                    {enrollment.student_name
                      .split(" ")
                      .map((part: string) => part[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{enrollment.student_name}</p>
                  <p className="text-sm text-muted-foreground">{enrollment.student_id_number || "No ID"}</p>
                </div>
              </div>
            ))}
          </div>

          {enrollments.length > 6 && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => router.push(`/professor/courses/${params.id}/students`)}>
                View All Students
              </Button>
            </div>
          )}

          {enrollments.length === 0 && <p className="text-center text-muted-foreground">No students enrolled yet</p>}
        </CardContent>
      </Card>
    </div>
  )
}

