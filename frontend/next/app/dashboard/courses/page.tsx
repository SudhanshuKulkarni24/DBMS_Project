"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  type CourseOffering,
  getAllCourseOfferings,
  enrollStudent,
  dropEnrollment,
  checkPrerequisites,
  checkTimeConflicts,
  checkCreditLimit,
  getEnrollmentsForStudent,
} from "@/lib/course-service"

export default function StudentCoursesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [courses, setCourses] = useState<CourseOffering[]>([])
  const [filteredCourses, setFilteredCourses] = useState<CourseOffering[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [currentSemester, setCurrentSemester] = useState({ semester: "Spring", year: 2025 })

  useEffect(() => {
    if (!session?.user?.id) return

    fetchCourses()
    fetchEnrollments()
    fetchCurrentSemester()
  }, [session])

  useEffect(() => {
    if (courses.length > 0) {
      filterCourses()
    }
  }, [searchQuery, courses, enrolledCourses])

  const fetchCurrentSemester = async () => {
    try {
      // In a real application, this would be fetched from the database
      // For now, we'll use a hardcoded value
      setCurrentSemester({ semester: "Spring", year: 2025 })
    } catch (error) {
      console.error("Error fetching current semester:", error)
    }
  }

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const allCourses = await getAllCourseOfferings()

      // Filter courses for the current semester
      const currentCourses = allCourses.filter(
        (course) => course.semester === currentSemester.semester && course.year === currentSemester.year,
      )

      setCourses(currentCourses)
      setFilteredCourses(currentCourses)
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrollments = async () => {
    if (!session?.user.id) return

    try {
      const enrollments = await getEnrollmentsForStudent(session.user.id)
      const enrolledIds = enrollments.map((e) => e.course_offering_id)
      setEnrolledCourses(enrolledIds)
    } catch (error) {
      console.error("Error fetching enrollments:", error)
    }
  }

  const filterCourses = () => {
    if (!searchQuery.trim()) {
      setFilteredCourses(courses)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = courses.filter(
      (course) =>
        course.course_id.toLowerCase().includes(query) ||
        course.course_name?.toLowerCase().includes(query) ||
        course.department?.toLowerCase().includes(query) ||
        course.semester.toLowerCase().includes(query) ||
        course.year.toString().includes(query),
    )

    setFilteredCourses(filtered)
  }

  const formatSchedule = (offering: CourseOffering) => {
    if (!offering.schedules || offering.schedules.length === 0) {
      return "No schedule"
    }

    return offering.schedules
      .map(
        (schedule) =>
          `${schedule.day_of_week} ${schedule.start_time.substring(0, 5)}-${schedule.end_time.substring(0, 5)}`,
      )
      .join(", ")
  }

  const handleEnroll = async (courseId: string) => {
    if (!session?.user.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to enroll in courses",
        variant: "destructive",
      })
      return
    }

    setActionLoading(courseId)

    try {
      // Check prerequisites
      const prerequisites = await checkPrerequisites(session.user.id, courseId)

      if (!prerequisites.met) {
        toast({
          title: "Prerequisites Not Met",
          description: `You need to complete: ${prerequisites.missing.map((p) => p.name).join(", ")}`,
          variant: "destructive",
        })
        return
      }

      // Check time conflicts
      const timeConflicts = await checkTimeConflicts(session.user.id, courseId)

      if (timeConflicts.hasConflicts) {
        toast({
          title: "Time Conflict",
          description: `Conflicts with: ${timeConflicts.conflictingCourses.map((c) => `${c.name} (${c.day} ${c.time})`).join(", ")}`,
          variant: "destructive",
        })
        return
      }

      // Check credit limit
      const creditLimit = await checkCreditLimit(session.user.id, courseId)

      if (!creditLimit.allowed) {
        toast({
          title: "Credit Limit Exceeded",
          description: `Adding this course (${creditLimit.adding} credits) would exceed your limit of ${creditLimit.max} credits. Current: ${creditLimit.current} credits.`,
          variant: "destructive",
        })
        return
      }

      // Enroll in the course
      await enrollStudent(session.user.id, courseId)

      toast({
        title: "Success",
        description: "Successfully enrolled in the course",
      })

      // Update enrolled courses
      setEnrolledCourses([...enrolledCourses, courseId])
    } catch (error) {
      console.error("Error enrolling in course:", error)
      toast({
        title: "Error",
        description: "Failed to enroll in the course",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDrop = async (courseId: string) => {
    if (!session?.user.id) return

    setActionLoading(courseId)

    try {
      await dropEnrollment(session.user.id, courseId)

      toast({
        title: "Success",
        description: "Successfully dropped the course",
      })

      // Update enrolled courses
      setEnrolledCourses(enrolledCourses.filter((id) => id !== courseId))
    } catch (error) {
      console.error("Error dropping course:", error)
      toast({
        title: "Error",
        description: "Failed to drop the course",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Course Registration</h1>
          <p className="text-sm text-muted-foreground">
            Browse and register for courses - {currentSemester.semester} {currentSemester.year}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Courses</CardTitle>
          <CardDescription>Courses available for registration</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">Loading courses...</div>
          ) : filteredCourses.length === 0 ? (
            <div className="flex justify-center p-4 text-muted-foreground">No courses found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Code</TableHead>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => {
                  const isEnrolled = enrolledCourses.includes(course.id)

                  return (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.course_id}</TableCell>
                      <TableCell>{course.course_name}</TableCell>
                      <TableCell>{course.department}</TableCell>
                      <TableCell>{course.credits}</TableCell>
                      <TableCell>{formatSchedule(course)}</TableCell>
                      <TableCell>{course.professor_name || "TBA"}</TableCell>
                      <TableCell>
                        {isEnrolled ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Enrolled
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not Enrolled</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/courses/${course.id}`)}
                        >
                          View
                        </Button>
                        {isEnrolled ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-2 text-red-600 hover:text-red-700"
                            onClick={() => handleDrop(course.id)}
                            disabled={actionLoading === course.id}
                          >
                            {actionLoading === course.id ? "Processing..." : "Drop"}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-2"
                            onClick={() => handleEnroll(course.id)}
                            disabled={actionLoading === course.id || !course.registration_open}
                          >
                            {actionLoading === course.id ? "Processing..." : "Enroll"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

