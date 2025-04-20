"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  getCourseOfferingById,
  getEnrollmentsForCourseOffering,
  updateStudentGrade,
  pointToGrade,
} from "@/lib/course-service"

export default function CourseStudentsPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [courseOffering, setCourseOffering] = useState<any>(null)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredEnrollments, setFilteredEnrollments] = useState<any[]>([])

  const [editingStudent, setEditingStudent] = useState<any>(null)
  const [gradeData, setGradeData] = useState({
    midterm_grade: "",
    final_grade: "",
    grade: "",
    attendance_percentage: 0,
    feedback: "",
    status: "enrolled",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Redirect if not professor or admin
    if (session && session.user.role !== "professor" && session.user.role !== "admin") {
      router.push("/dashboard")
      return
    }

    fetchCourseOffering()
    fetchEnrollments()
  }, [session, router, params.id])

  useEffect(() => {
    if (enrollments.length > 0) {
      filterEnrollments()
    }
  }, [searchQuery, enrollments])

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

  const fetchEnrollments = async () => {
    try {
      setLoading(true)
      const data = await getEnrollmentsForCourseOffering(params.id)
      setEnrollments(data)
      setFilteredEnrollments(data)
    } catch (error) {
      console.error("Error fetching enrollments:", error)
      toast({
        title: "Error",
        description: "Failed to fetch student enrollments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterEnrollments = () => {
    if (!searchQuery.trim()) {
      setFilteredEnrollments(enrollments)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = enrollments.filter(
      (enrollment) =>
        enrollment.student_name?.toLowerCase().includes(query) ||
        enrollment.student_id_number?.toLowerCase().includes(query),
    )

    setFilteredEnrollments(filtered)
  }

  const handleEditGrades = (enrollment: any) => {
    setEditingStudent(enrollment)
    setGradeData({
      midterm_grade: enrollment.midterm_grade || "",
      final_grade: enrollment.final_grade || "",
      grade: enrollment.grade || "",
      attendance_percentage: enrollment.attendance_percentage || 0,
      feedback: enrollment.feedback || "",
      status: enrollment.status || "enrolled",
    })
  }

  const handleGradeChange = (field: string, value: string | number) => {
    setGradeData({
      ...gradeData,
      [field]: value,
    })
  }

  const handleSubmitGrades = async () => {
    if (!editingStudent) return

    setIsSubmitting(true)

    try {
      const updatedEnrollment = await updateStudentGrade(editingStudent.student_id, params.id, gradeData)

      if (updatedEnrollment) {
        toast({
          title: "Success",
          description: "Student grades updated successfully",
        })

        // Update the enrollments list
        setEnrollments(
          enrollments.map((e) => (e.student_id === editingStudent.student_id ? { ...e, ...gradeData } : e)),
        )
        setFilteredEnrollments(
          filteredEnrollments.map((e) => (e.student_id === editingStudent.student_id ? { ...e, ...gradeData } : e)),
        )

        setEditingStudent(null)
      }
    } catch (error) {
      console.error("Error updating grades:", error)
      toast({
        title: "Error",
        description: "Failed to update student grades",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateFinalGrade = () => {
    // Simple calculation based on midterm and final
    if (gradeData.midterm_grade && gradeData.final_grade) {
      const midtermPoints = Number(gradeData.midterm_grade)
      const finalPoints = Number(gradeData.final_grade)

      if (!isNaN(midtermPoints) && !isNaN(finalPoints)) {
        // 40% midterm, 60% final
        const totalPoints = midtermPoints * 0.4 + finalPoints * 0.6
        return pointToGrade(Math.round(totalPoints))
      }
    }
    return ""
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Student Management</h1>
          <p className="text-sm text-muted-foreground">
            {courseOffering?.course_id} - {courseOffering?.course_name}
          </p>
        </div>
        <Button onClick={() => router.push(`/professor/courses/${params.id}`)}>Back to Course</Button>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrolled Students</CardTitle>
          <CardDescription>Manage student grades and attendance</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">Loading students...</div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="flex justify-center p-4 text-muted-foreground">No students enrolled</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Midterm</TableHead>
                  <TableHead>Final</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.map((enrollment) => (
                  <TableRow key={enrollment.student_id}>
                    <TableCell className="font-medium">{enrollment.student_id_number || "N/A"}</TableCell>
                    <TableCell>{enrollment.student_name}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          enrollment.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : enrollment.status === "dropped"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        }
                      >
                        {enrollment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {enrollment.attendance_percentage ? `${enrollment.attendance_percentage}%` : "N/A"}
                    </TableCell>
                    <TableCell>{enrollment.midterm_grade || "N/A"}</TableCell>
                    <TableCell>{enrollment.final_grade || "N/A"}</TableCell>
                    <TableCell>
                      {enrollment.grade ? (
                        <Badge
                          className={
                            enrollment.grade === "A" || enrollment.grade === "A-"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : enrollment.grade.startsWith("B")
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                : enrollment.grade.startsWith("C")
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                  : enrollment.grade.startsWith("D") || enrollment.grade === "E"
                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          }
                        >
                          {enrollment.grade}
                        </Badge>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditGrades(enrollment)}>
                        Edit Grades
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Grades Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Student Grades</DialogTitle>
            <DialogDescription>Update grades and status for {editingStudent?.student_name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="midterm_grade">Midterm Grade (0-10)</Label>
                <Input
                  id="midterm_grade"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={gradeData.midterm_grade}
                  onChange={(e) => handleGradeChange("midterm_grade", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="final_grade">Final Grade (0-10)</Label>
                <Input
                  id="final_grade"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={gradeData.final_grade}
                  onChange={(e) => handleGradeChange("final_grade", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="attendance_percentage">Attendance (%)</Label>
                <Input
                  id="attendance_percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={gradeData.attendance_percentage}
                  onChange={(e) => handleGradeChange("attendance_percentage", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={gradeData.status} onValueChange={(value) => handleGradeChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enrolled">Enrolled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="dropped">Dropped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="grade">Final Letter Grade</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleGradeChange("grade", calculateFinalGrade())}
                >
                  Calculate
                </Button>
              </div>
              <Select value={gradeData.grade} onValueChange={(value) => handleGradeChange("grade", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A (10)</SelectItem>
                  <SelectItem value="A-">A- (9)</SelectItem>
                  <SelectItem value="B+">B+ (8)</SelectItem>
                  <SelectItem value="B">B (7)</SelectItem>
                  <SelectItem value="B-">B- (6)</SelectItem>
                  <SelectItem value="C+">C+ (5)</SelectItem>
                  <SelectItem value="C">C (4)</SelectItem>
                  <SelectItem value="C-">C- (3)</SelectItem>
                  <SelectItem value="D">D (2)</SelectItem>
                  <SelectItem value="E">E (1)</SelectItem>
                  <SelectItem value="NC">NC (0)</SelectItem>
                  <SelectItem value="F">F (0)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                value={gradeData.feedback}
                onChange={(e) => handleGradeChange("feedback", e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStudent(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitGrades} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

