"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getEnrollmentsForStudent, getCourseOfferingById } from "@/lib/course-service"

interface CourseSchedule {
  id: string
  course_id: string
  course_name: string
  day_of_week: string
  start_time: string
  end_time: string
  location: string
  professor_name: string
  color: string
  room_number?: string
  schedule_type?: string
}

export default function TimetablePage() {
  const { data: session } = useSession()
  const { toast } = useToast()

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]

  const [viewMode, setViewMode] = useState("week") // "week" or "list"
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [currentWeek, setCurrentWeek] = useState(0)
  const [currentSemester, setCurrentSemester] = useState({ semester: "Spring", year: 2025 })

  useEffect(() => {
    if (!session?.user.id) return

    fetchTimetable()
    fetchCurrentSemester()
  }, [session])

  const fetchCurrentSemester = async () => {
    try {
      // In a real application, this would be fetched from the database
      // For now, we'll use a hardcoded value
      setCurrentSemester({ semester: "Spring", year: 2025 })
    } catch (error) {
      console.error("Error fetching current semester:", error)
    }
  }

  const fetchTimetable = async () => {
    if (!session?.user.id) return

    try {
      setLoading(true)

      // Get all enrollments
      const enrollments = await getEnrollmentsForStudent(session.user.id)

      // Get course details and schedules for each enrollment
      const courseSchedules: CourseSchedule[] = []
      const colors = [
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      ]

      for (let i = 0; i < enrollments.length; i++) {
        const enrollment = enrollments[i]
        const courseOffering = await getCourseOfferingById(enrollment.course_offering_id)

        if (courseOffering && courseOffering.schedules) {
          const color = colors[i % colors.length]

          for (const schedule of courseOffering.schedules) {
            courseSchedules.push({
              id: schedule.id,
              course_id: courseOffering.course_id,
              course_name: courseOffering.course_name || courseOffering.course_id,
              day_of_week: schedule.day_of_week,
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              location: courseOffering.location || "TBA",
              professor_name: courseOffering.professor_name || "TBA",
              color,
              room_number: schedule.room_number,
              schedule_type: schedule.schedule_type,
            })
          }
        }
      }

      setSchedules(courseSchedules)
    } catch (error) {
      console.error("Error fetching timetable:", error)
      toast({
        title: "Error",
        description: "Failed to fetch timetable",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Function to get the class events for a specific day and time slot
  const getClassForTimeSlot = (day: string, timeSlot: string) => {
    return schedules.filter((cls) => {
      const startTime = cls.start_time.substring(0, 5)
      const endTime = cls.end_time.substring(0, 5)

      const startTimeIndex = timeSlots.indexOf(startTime)
      const endTimeIndex =
        timeSlots.indexOf(endTime) === -1 ? timeSlots.indexOf(timeSlot) + 1 : timeSlots.indexOf(endTime)

      return (
        cls.day_of_week === day &&
        timeSlots.indexOf(timeSlot) >= startTimeIndex &&
        timeSlots.indexOf(timeSlot) < endTimeIndex
      )
    })
  }

  const handlePreviousWeek = () => {
    setCurrentWeek(currentWeek - 1)
  }

  const handleNextWeek = () => {
    setCurrentWeek(currentWeek + 1)
  }

  const handleCurrentWeek = () => {
    setCurrentWeek(0)
  }

  const exportTimetable = () => {
    // In a real application, this would generate a PDF or CSV file
    toast({
      title: "Export Started",
      description: "Your timetable is being exported",
    })
  }

  const WeekView = () => (
    <div className="grid gap-4 overflow-x-auto">
      <div className="grid grid-cols-[100px_repeat(5,minmax(180px,1fr))]">
        <div className="bg-muted/50"></div>
        {days.map((day) => (
          <div key={day} className="bg-muted/50 p-2 text-center font-medium">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[100px_repeat(5,minmax(180px,1fr))] gap-[1px] rounded-lg border">
        {timeSlots.map((timeSlot) => (
          <>
            <div key={timeSlot} className="p-2 text-sm text-muted-foreground">
              {timeSlot}
            </div>
            {days.map((day) => {
              const classes = getClassForTimeSlot(day, timeSlot)
              return (
                <div key={`${day}-${timeSlot}`} className="min-h-[60px] border-t p-1">
                  {classes.map((cls, index) => {
                    // Only render the class card on the first time slot it appears
                    if (cls.start_time.substring(0, 5) === timeSlot) {
                      const startIndex = timeSlots.indexOf(cls.start_time.substring(0, 5))
                      const endIndex =
                        timeSlots.indexOf(cls.end_time.substring(0, 5)) === -1
                          ? startIndex + 1
                          : timeSlots.indexOf(cls.end_time.substring(0, 5))
                      const duration = endIndex - startIndex

                      return (
                        <div
                          key={index}
                          className={`flex flex-col rounded-md ${cls.color} p-2 text-xs`}
                          style={{
                            height: `${Math.max(duration * 60, 58)}px`,
                            marginTop: "-1px",
                          }}
                        >
                          <div className="font-medium">
                            {cls.course_name} ({cls.course_id})
                          </div>
                          <div>
                            {cls.start_time.substring(0, 5)} - {cls.end_time.substring(0, 5)}
                          </div>
                          <div>{cls.room_number || cls.location}</div>
                          {cls.schedule_type && <div className="text-xs opacity-75">{cls.schedule_type}</div>}
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              )
            })}
          </>
        ))}
      </div>
    </div>
  )

  const ListView = () => (
    <div className="grid gap-4">
      {days.map((day) => {
        const daySchedules = schedules.filter((s) => s.day_of_week === day)

        if (daySchedules.length === 0) {
          return (
            <div key={day}>
              <h3 className="mb-2 text-lg font-medium">{day}</h3>
              <div className="rounded-lg border p-4 text-center text-muted-foreground">No classes scheduled</div>
            </div>
          )
        }

        return (
          <div key={day}>
            <h3 className="mb-2 text-lg font-medium">{day}</h3>
            <div className="rounded-lg border">
              {daySchedules
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((cls, index) => (
                  <div key={index} className="flex items-center justify-between border-b p-4 last:border-0">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-lg ${cls.color.split(" ")[0]}`}
                      >
                        <Calendar className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-medium">{cls.course_name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            {cls.start_time.substring(0, 5)} - {cls.end_time.substring(0, 5)}
                          </span>
                          <span>•</span>
                          <span>{cls.room_number || cls.location}</span>
                          {cls.schedule_type && (
                            <>
                              <span>•</span>
                              <span>{cls.schedule_type}</span>
                            </>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">Instructor: {cls.professor_name}</div>
                      </div>
                    </div>
                    <Badge className={cls.color}>{cls.course_id}</Badge>
                  </div>
                ))}
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Timetable</h1>
          <p className="text-sm text-muted-foreground">
            View your class schedule for {currentSemester.semester} {currentSemester.year}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <Button variant="outline" size="icon" className="rounded-r-none" onClick={handlePreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="rounded-none border-x-0" onClick={handleCurrentWeek}>
              {currentWeek === 0 ? "Current Week" : currentWeek < 0 ? `Week ${-currentWeek}` : `Week +${currentWeek}`}
            </Button>
            <Button variant="outline" size="icon" className="rounded-l-none" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button className="gap-2" variant="outline" onClick={exportTimetable}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center pb-2">
          <div className="flex-1">
            <CardTitle>
              {currentSemester.semester} {currentSemester.year}
            </CardTitle>
            <CardDescription>
              {currentWeek === 0 ? "Current Week" : currentWeek < 0 ? `Week ${-currentWeek}` : `Week +${currentWeek}`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant={viewMode === "week" ? "default" : "outline"} size="sm" onClick={() => setViewMode("week")}>
              Week View
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
              List View
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex justify-center p-4">Loading timetable...</div>
          ) : schedules.length === 0 ? (
            <div className="flex justify-center p-4 text-muted-foreground">
              No classes scheduled. Please register for courses to see your timetable.
            </div>
          ) : viewMode === "week" ? (
            <WeekView />
          ) : (
            <ListView />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

