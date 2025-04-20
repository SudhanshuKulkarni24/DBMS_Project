"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, BookOpen, Calendar, CheckCircle, Clock, FileText, MapPin, User } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { getCourseOfferingByIdAction } from "@/lib/actions"

export default function CourseDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()

  const [course, setCourse] = useState<any>(null)
  const [prerequisites, setPrerequisites] = useState<any[]>([])
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // useEffect(() => {
  //   if (session?.user?.id) {
  //     fetchCourseDetails()
  //   }
  // }, [session, params.id])

  const [unwrappedParams, setUnwrappedParams] = useState(null)

  useEffect(() => {
    async function unwrapParams() {
      const p = await params
      setUnwrappedParams(p)
    }
    unwrapParams()
  }, [params])

  useEffect(() => {
    if (session?.user?.id && unwrappedParams?.id) {
      fetchCourseDetails()
    }
  }, [session, unwrappedParams?.id])


 
  const fetchCourseDetails = async () => {
    try {
      setLoading(true)
      const courseOffering = await getCourseOfferingByIdAction(params.id)

      if (!courseOffering) {
        toast({
          title: "Error",
          description: "Course not found",
          variant: "destructive",
        })
        router.push("/dashboard/courses")
        return
      }

      setCourse(courseOffering)

      // Check if student is enrolled
      // This would be done by checking the enrollments table
      // For now, we'll just set it to false
      setIsEnrolled(false)
    } catch (error) {
      console.error("Error fetching course details:", error)
      toast({
        title: "Error",
        description: "Failed to load course details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle course registration
  const handleRegister = async () => {
    setIsLoading(true)
    try {
      // Call the server action to register for the course
      // For now, we'll just show a success message
      toast({
        title: "Success",
        description: "Successfully enrolled in the course",
      })
      setIsEnrolled(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle course drop
  const handleDrop = async () => {
    setIsLoading(true)
    try {
      // Call the server action to drop the course
      // For now, we'll just show a success message
      toast({
        title: "Success",
        description: "Successfully dropped the course",
      })
      setIsEnrolled(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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

  // Current registered credits (this would come from your database)
  const currentCredits = 18
  const maxCredits = 25

  // Check if prerequisites are met
  const isPrerequisitesMet = true

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{course.course_name}</h1>
          <p className="text-sm text-muted-foreground">
            {course.course_id} • {course.department}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEnrolled ? (
            <Button variant="destructive" onClick={handleDrop} disabled={isLoading}>
              {isLoading ? "Processing..." : "Drop Course"}
            </Button>
          ) : (
            <Button
              disabled={!isPrerequisitesMet || currentCredits + course.credits > maxCredits || isLoading}
              onClick={handleRegister}
            >
              {isLoading ? "Processing..." : "Register for Course"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{course.description || "No description available."}</p>
              <Separator className="my-4" />
              <h3 className="mb-2 font-semibold">Learning Outcomes</h3>
              <p className="whitespace-pre-line">{course.learning_outcomes || "No learning outcomes specified."}</p>

              <Separator className="my-4" />
              <h3 className="mb-2 font-semibold">Course Syllabus</h3>
              {course.syllabus_url ? (
                <a
                  href={course.syllabus_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View Syllabus
                </a>
              ) : (
                <p className="text-muted-foreground">No syllabus available</p>
              )}
            </CardContent>
          </Card>

          {!isPrerequisitesMet && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Prerequisites Not Met</AlertTitle>
              <AlertDescription>You have not completed the required prerequisite courses.</AlertDescription>
            </Alert>
          )}

          {currentCredits + course.credits > maxCredits && !isEnrolled && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Credit Limit Exceeded</AlertTitle>
              <AlertDescription>
                Registering for this course would exceed your maximum credit limit of {maxCredits}.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Credits</p>
                  <p className="text-sm text-muted-foreground">{course.credits} credits</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Instructor</p>
                  <p className="text-sm text-muted-foreground">{course.professor_name || "TBA"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Schedule</p>
                  <div className="space-y-1">
                    {course.schedules && course.schedules.length > 0 ? (
                      course.schedules.map((schedule: any, index: number) => (
                        <p key={index} className="text-sm text-muted-foreground">
                          {schedule.day_of_week} {schedule.start_time.substring(0, 5)} -{" "}
                          {schedule.end_time.substring(0, 5)}
                          {schedule.schedule_type && ` (${schedule.schedule_type})`}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No schedule available</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {course.location || (course.schedules && course.schedules[0]?.room_number) || "TBA"}
                  </p>
                </div>
              </div>
              {prerequisites.length > 0 && (
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Prerequisites</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {prerequisites.map((prereq) => (
                        <Badge key={prereq.id} variant="outline">
                          {prereq.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Status</p>
                  {isEnrolled ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <p className="text-sm text-green-600">Registered</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not Registered</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Registration Status</CardTitle>
              <CardDescription>Your current registration status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-sm font-medium">Current Credits</p>
                  <p className="text-sm">{currentCredits}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm font-medium">Max Credits</p>
                  <p className="text-sm">{maxCredits}</p>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(currentCredits / maxCredits) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

