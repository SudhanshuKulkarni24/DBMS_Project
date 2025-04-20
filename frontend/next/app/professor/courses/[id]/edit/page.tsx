"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getCourseOfferingByIdAction, updateCourseAction, updateCourseOfferingAction } from "@/lib/actions"

export default function EditCoursePage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [courseData, setCourseData] = useState<any>(null)
  const [offeringData, setOfferingData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (session && session.user.role !== "professor" && session.user.role !== "admin") {
      router.push("/dashboard")
      return
    }
    fetchData()
  }, [session, router, params.id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const offering = await getCourseOfferingByIdAction(params.id)
      if (!offering) {
        toast({ title: "Error", description: "Course not found", variant: "destructive" })
        router.push("/professor/courses")
        return
      }
      setCourseData({
        id: offering.course.id,
        code: offering.course.code,
        name: offering.course.name,
        department: offering.course.department,
        description: offering.course.description,
        credits: offering.course.credits,
      })
      setOfferingData({
        id: offering.id,
        semester: offering.semester,
        year: offering.year,
        location: offering.location,
        max_students: offering.max_students,
        registration_open: offering.registration_open,
      })
    } catch (error) {
      console.error("Error fetching course data:", error)
      toast({ title: "Error", description: "Failed to load course data", variant: "destructive" })
      router.push("/professor/courses")
    } finally {
      setLoading(false)
    }
  }

  const handleCourseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCourseData({ ...courseData, [e.target.name]: e.target.value })
  }

  const handleOfferingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOfferingData({ ...offeringData, [e.target.name]: e.target.value })
  }

  const handleOfferingSwitchChange = (name: string, checked: boolean) => {
    setOfferingData({ ...offeringData, [name]: checked })
  }

  const handleOfferingSelectChange = (name: string, value: string) => {
    setOfferingData({ ...offeringData, [name]: value })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!courseData || !offeringData) return
    setIsSubmitting(true)
    try {
      await updateCourseAction(courseData.id, {
        code: courseData.code,
        name: courseData.name,
        department: courseData.department,
        description: courseData.description,
        credits: Number(courseData.credits),
      })
      await updateCourseOfferingAction(params.id, {
        semester: offeringData.semester,
        year: Number(offeringData.year),
        location: offeringData.location,
        max_students: Number(offeringData.max_students),
        registration_open: offeringData.registration_open,
      })
      toast({ title: "Success", description: "Course updated successfully" })
      router.push(`/professor/courses/${params.id}`)
    } catch (error) {
      console.error("Error updating course:", error)
      toast({ title: "Error", description: "Failed to update course", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <p>Loading...</p>
      </div>
    )
  }

  if (!courseData || !offeringData) {
    return null
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Course</h1>
          <p className="text-sm text-muted-foreground">Update course information</p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/professor/courses/${params.id}`)}>
          Cancel
        </Button>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
            <CardDescription>Edit the course information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Course Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={courseData.name}
                  onChange={handleCourseChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  name="department"
                  value={courseData.department}
                  onChange={handleCourseChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={courseData.description}
                onChange={handleCourseChange}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Offering Details</CardTitle>
            <CardDescription>Adjust the course schedule and capacity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={offeringData.semester}
                  onValueChange={(val) => handleOfferingSelectChange("semester", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Spring">Spring</SelectItem>
                    <SelectItem value="Summer">Summer</SelectItem>
                    <SelectItem value="Fall">Fall</SelectItem>
                    <SelectItem value="Winter">Winter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  value={offeringData.year}
                  onChange={handleOfferingChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={offeringData.location}
                  onChange={handleOfferingChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_students">Max Students</Label>
                <Input
                  id="max_students"
                  name="max_students"
                  type="number"
                  value={offeringData.max_students}
                  onChange={handleOfferingChange}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="registration_open"
                checked={offeringData.registration_open}
                onCheckedChange={(checked) => handleOfferingSwitchChange("registration_open", checked)}
              />
              <Label htmlFor="registration_open">Open for Registration</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}