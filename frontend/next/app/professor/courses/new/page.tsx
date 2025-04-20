"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { createCourse, createCourseOffering, addCourseSchedule } from "@/lib/course-service"

export default function NewCoursePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [courseData, setCourseData] = useState({
    id: "",
    name: "",
    department: "",
    description: "",
    credits: 4,
    theory_credits: 3,
    lab_credits: 1,
    course_type: "core",
    syllabus_url: "",
    learning_outcomes: "",
    is_active: true,
  })

  const [offeringData, setOfferingData] = useState({
    semester: "Spring",
    year: new Date().getFullYear(),
    max_students: 50,
    location: "",
    registration_open: true,
  })

  const [schedules, setSchedules] = useState([
    {
      day_of_week: "Monday",
      start_time: "10:00",
      end_time: "11:30",
      room_number: "",
      schedule_type: "lecture",
    },
  ])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)

  useEffect(() => {
    // Redirect if not professor or admin
    if (session && session.user.role !== "professor" && session.user.role !== "admin") {
      router.push("/dashboard")
    }
  }, [session, router])

  const handleCourseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCourseData({
      ...courseData,
      [name]: value,
    })
  }

  const handleCourseSelectChange = (name: string, value: string) => {
    setCourseData({
      ...courseData,
      [name]: value,
    })
  }

  const handleCourseSwitchChange = (name: string, checked: boolean) => {
    setCourseData({
      ...courseData,
      [name]: checked,
    })
  }

  const handleCourseNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCourseData({
      ...courseData,
      [name]: Number(value),
    })
  }

  const handleOfferingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setOfferingData({
      ...offeringData,
      [name]: value,
    })
  }

  const handleOfferingSelectChange = (name: string, value: string) => {
    setOfferingData({
      ...offeringData,
      [name]: value,
    })
  }

  const handleOfferingSwitchChange = (name: string, checked: boolean) => {
    setOfferingData({
      ...offeringData,
      [name]: checked,
    })
  }

  const handleOfferingNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setOfferingData({
      ...offeringData,
      [name]: Number(value),
    })
  }

  const handleScheduleChange = (index: number, field: string, value: string) => {
    const updatedSchedules = [...schedules]
    updatedSchedules[index] = {
      ...updatedSchedules[index],
      [field]: value,
    }
    setSchedules(updatedSchedules)
  }

  const addSchedule = () => {
    setSchedules([
      ...schedules,
      {
        day_of_week: "Monday",
        start_time: "10:00",
        end_time: "11:30",
        room_number: "",
        schedule_type: "lecture",
      },
    ])
  }

  const removeSchedule = (index: number) => {
    if (schedules.length > 1) {
      const updatedSchedules = [...schedules]
      updatedSchedules.splice(index, 1)
      setSchedules(updatedSchedules)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create course
      const course = await createCourse({
        id: courseData.id,
        name: courseData.name,
        department: courseData.department,
        description: courseData.description,
        credits: courseData.credits,
        theory_credits: courseData.theory_credits,
        lab_credits: courseData.lab_credits,
        course_type: courseData.course_type,
        syllabus_url: courseData.syllabus_url,
        learning_outcomes: courseData.learning_outcomes,
        is_active: courseData.is_active,
      })

      // Create course offering
      const offering = await createCourseOffering({
        course_id: course.id,
        professor_id: session?.user.id || null,
        semester: offeringData.semester,
        year: offeringData.year,
        max_students: offeringData.max_students,
        location: offeringData.location,
        registration_open: offeringData.registration_open,
      })

      // Create schedules
      for (const schedule of schedules) {
        await addCourseSchedule({
          course_offering_id: offering.id,
          day_of_week: schedule.day_of_week,
          start_time: `${schedule.start_time}:00`,
          end_time: `${schedule.end_time}:00`,
          room_number: schedule.room_number,
          schedule_type: schedule.schedule_type,
        })
      }

      toast({
        title: "Success",
        description: "Course created successfully",
      })

      router.push("/professor/courses")
    } catch (error) {
      console.error("Error creating course:", error)
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create New Course</h1>
          <p className="text-sm text-muted-foreground">Add a new course to the system</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/professor/courses")}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
              <CardDescription>Enter the basic information about the course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id">Course Code</Label>
                  <Input
                    id="id"
                    name="id"
                    placeholder="CS101"
                    value={courseData.id}
                    onChange={handleCourseChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Course Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Introduction to Programming"
                    value={courseData.name}
                    onChange={handleCourseChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    name="department"
                    placeholder="Computer Science"
                    value={courseData.department}
                    onChange={handleCourseChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course_type">Course Type</Label>
                  <Select
                    value={courseData.course_type}
                    onValueChange={(value) => handleCourseSelectChange("course_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="core">Core</SelectItem>
                      <SelectItem value="elective">Elective</SelectItem>
                      <SelectItem value="lab">Lab</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credits">Total Credits</Label>
                  <Input
                    id="credits"
                    name="credits"
                    type="number"
                    min="1"
                    max="10"
                    value={courseData.credits}
                    onChange={handleCourseNumberChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theory_credits">Theory Credits</Label>
                  <Input
                    id="theory_credits"
                    name="theory_credits"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={courseData.theory_credits}
                    onChange={handleCourseNumberChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lab_credits">Lab Credits</Label>
                  <Input
                    id="lab_credits"
                    name="lab_credits"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={courseData.lab_credits}
                    onChange={handleCourseNumberChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Course description"
                  value={courseData.description}
                  onChange={handleCourseChange}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="learning_outcomes">Learning Outcomes</Label>
                <Textarea
                  id="learning_outcomes"
                  name="learning_outcomes"
                  placeholder="Learning outcomes"
                  value={courseData.learning_outcomes}
                  onChange={handleCourseChange}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="syllabus_url">Syllabus URL</Label>
                <Input
                  id="syllabus_url"
                  name="syllabus_url"
                  placeholder="https://example.com/syllabus.pdf"
                  value={courseData.syllabus_url}
                  onChange={handleCourseChange}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={courseData.is_active}
                  onCheckedChange={(checked) => handleCourseSwitchChange("is_active", checked)}
                />
                <Label htmlFor="is_active">Active Course</Label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="button" onClick={() => setStep(2)}>
                Next: Course Offering
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Course Offering</CardTitle>
              <CardDescription>Configure when and where the course will be offered</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Select
                    value={offeringData.semester}
                    onValueChange={(value) => handleOfferingSelectChange("semester", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
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
                    min={new Date().getFullYear()}
                    max={new Date().getFullYear() + 5}
                    value={offeringData.year}
                    onChange={handleOfferingNumberChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_students">Maximum Students</Label>
                  <Input
                    id="max_students"
                    name="max_students"
                    type="number"
                    min="1"
                    max="500"
                    value={offeringData.max_students}
                    onChange={handleOfferingNumberChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="Building/Room"
                    value={offeringData.location}
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Class Schedule</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSchedule}>
                    Add Schedule
                  </Button>
                </div>

                {schedules.map((schedule, index) => (
                  <div key={index} className="space-y-4 rounded-md border p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Day of Week</Label>
                        <Select
                          value={schedule.day_of_week}
                          onValueChange={(value) => handleScheduleChange(index, "day_of_week", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Monday">Monday</SelectItem>
                            <SelectItem value="Tuesday">Tuesday</SelectItem>
                            <SelectItem value="Wednesday">Wednesday</SelectItem>
                            <SelectItem value="Thursday">Thursday</SelectItem>
                            <SelectItem value="Friday">Friday</SelectItem>
                            <SelectItem value="Saturday">Saturday</SelectItem>
                            <SelectItem value="Sunday">Sunday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Schedule Type</Label>
                        <Select
                          value={schedule.schedule_type}
                          onValueChange={(value) => handleScheduleChange(index, "schedule_type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lecture">Lecture</SelectItem>
                            <SelectItem value="lab">Lab</SelectItem>
                            <SelectItem value="tutorial">Tutorial</SelectItem>
                            <SelectItem value="seminar">Seminar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={schedule.start_time}
                          onChange={(e) => handleScheduleChange(index, "start_time", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={schedule.end_time}
                          onChange={(e) => handleScheduleChange(index, "end_time", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Room Number</Label>
                        <Input
                          placeholder="Room number"
                          value={schedule.room_number}
                          onChange={(e) => handleScheduleChange(index, "room_number", e.target.value)}
                        />
                      </div>
                    </div>

                    {schedules.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-red-500"
                        onClick={() => removeSchedule(index)}
                      >
                        Remove Schedule
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating Course..." : "Create Course"}
              </Button>
            </CardFooter>
          </Card>
        )}
      </form>
    </div>
  )
}

