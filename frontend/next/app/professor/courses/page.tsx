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
import { type CourseOffering, getAllCourseOfferings } from "@/lib/course-service"

export default function ProfessorCoursesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [courses, setCourses] = useState<CourseOffering[]>([])
  const [filteredCourses, setFilteredCourses] = useState<CourseOffering[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // Redirect if not professor or admin
    if (session && session.user.role !== "professor" && session.user.role !== "admin") {
      router.push("/dashboard")
      return
    }

    fetchCourses()
  }, [session, router])

  useEffect(() => {
    if (courses.length > 0) {
      filterCourses()
    }
  }, [searchQuery, courses])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const allCourses = await getAllCourseOfferings()

      // Filter courses taught by this professor
      const professorCourses =
        session?.user.role === "admin"
          ? allCourses
          : allCourses.filter((course) => course.professor_id === session?.user.id)

      setCourses(professorCourses)
      setFilteredCourses(professorCourses)
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

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-sm text-muted-foreground">Manage your courses and class schedules</p>
        </div>
        <Button onClick={() => router.push("/professor/courses/new")}>Add New Course</Button>
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
          <CardTitle>Courses</CardTitle>
          <CardDescription>Courses you are teaching</CardDescription>
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
                  <TableHead>Semester</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.course_id}</TableCell>
                    <TableCell>{course.course_name}</TableCell>
                    <TableCell>
                      {course.semester} {course.year}
                    </TableCell>
                    <TableCell>{formatSchedule(course)}</TableCell>
                    <TableCell>{course.location || "-"}</TableCell>
                    <TableCell>
                      <Badge>
                        {course.enrolled_count || 0}/{course.max_students}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/professor/courses/${course.id}`)}>
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/professor/courses/${course.id}/announcements`)}
                      >
                        Announcements
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/professor/courses/${course.id}/students`)}
                      >
                        Students
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

