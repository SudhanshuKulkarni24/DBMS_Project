"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, DownloadCloud, FileBarChart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getCourseHistoryForStudent, calculateGPA, gradePoints } from "@/lib/course-service"

export default function CourseHistoryPage() {
  const { data: session } = useSession()
  const { toast } = useToast()

  const [courseHistory, setCourseHistory] = useState<any[]>([])
  const [gpaData, setGpaData] = useState<{
    gpa: number
    totalCredits: number
    completedCourses: number
  }>({
    gpa: 0,
    totalCredits: 0,
    completedCourses: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchCourseHistory()
      fetchGPA()
    }
  }, [session])

  const fetchCourseHistory = async () => {
    try {
      setLoading(true)
      const data = await getCourseHistoryForStudent(session!.user.id)
      setCourseHistory(data)
    } catch (error) {
      console.error("Error fetching course history:", error)
      toast({
        title: "Error",
        description: "Failed to fetch course history",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchGPA = async () => {
    try {
      const data = await calculateGPA(session!.user.id)
      setGpaData(data)
    } catch (error) {
      console.error("Error calculating GPA:", error)
      toast({
        title: "Error",
        description: "Failed to calculate GPA",
        variant: "destructive",
      })
    }
  }

  // Group courses by semester
  const groupedCourses = courseHistory.reduce(
    (acc, course) => {
      const semesterKey = `${course.semester} ${course.year}`
      if (!acc[semesterKey]) {
        acc[semesterKey] = []
      }
      acc[semesterKey].push(course)
      return acc
    },
    {} as Record<string, any[]>,
  )

  // Sort semesters by year and semester
  const semesterOrder = { Spring: 0, Summer: 1, Fall: 2, Winter: 3 }
  const sortedSemesters = Object.keys(groupedCourses).sort((a, b) => {
    const [semA, yearA] = a.split(" ")
    const [semB, yearB] = b.split(" ")
    if (yearA !== yearB) {
      return Number(yearB) - Number(yearA) // Most recent year first
    }
    return semesterOrder[semA as keyof typeof semesterOrder] - semesterOrder[semB as keyof typeof semesterOrder]
  })

  const getGradeColor = (grade: string) => {
    if (!grade || grade === "In Progress") return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"

    const gradePoint = gradePoints[grade] || 0

    if (gradePoint >= 9) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    if (gradePoint >= 7) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    if (gradePoint >= 4) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    if (gradePoint >= 1) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Course History</h1>
          <p className="text-sm text-muted-foreground">View your academic record and course history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <FileBarChart className="h-4 w-4" />
            Generate Transcript
          </Button>
          <Button variant="outline" className="gap-2">
            <DownloadCloud className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>GPA</CardTitle>
            <CardDescription>Current cumulative GPA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{gpaData.gpa.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total Credits: {gpaData.totalCredits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Completed Courses</CardTitle>
            <CardDescription>Total courses completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{gpaData.completedCourses}</div>
            <p className="text-xs text-muted-foreground">Out of {courseHistory.length} enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Current Status</CardTitle>
            <CardDescription>Academic standing</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-lg font-medium">
              {gpaData.gpa >= 8
                ? "Excellent"
                : gpaData.gpa >= 6
                  ? "Good Standing"
                  : gpaData.gpa >= 4
                    ? "Satisfactory"
                    : "Needs Improvement"}
            </span>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center p-4">Loading course history...</div>
      ) : courseHistory.length === 0 ? (
        <Card>
          <CardContent className="flex justify-center p-6">
            <p className="text-muted-foreground">No course history available</p>
          </CardContent>
        </Card>
      ) : (
        sortedSemesters.map((semester) => (
          <Card key={semester}>
            <CardHeader>
              <CardTitle>{semester}</CardTitle>
              <CardDescription>Courses taken in {semester}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedCourses[semester].map((course) => (
                    <TableRow key={course.course_offering_id}>
                      <TableCell className="font-medium">{course.course_code}</TableCell>
                      <TableCell>{course.course_name}</TableCell>
                      <TableCell>{course.credits}</TableCell>
                      <TableCell>{course.instructor_name || "TBA"}</TableCell>
                      <TableCell>
                        {course.status === "enrolled" ? (
                          <Badge variant="outline">In Progress</Badge>
                        ) : (
                          <Badge className={getGradeColor(course.grade)}>{course.grade || "Not Graded"}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {course.grade && course.status === "completed" ? gradePoints[course.grade] || 0 : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

