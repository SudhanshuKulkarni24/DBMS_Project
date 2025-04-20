import { executeQuery } from "@/lib/db"

export interface Course {
  id: string
  name: string
  department: string
  description: string | null
  credits: number
  theory_credits?: number | null
  lab_credits?: number | null
  course_type?: string | null
  syllabus_url?: string | null
  learning_outcomes?: string | null
  is_active?: boolean | null
  created_at: string
  updated_at: string
}

export interface CourseOffering {
  id: string
  course_id: string
  professor_id: string | null
  semester: string
  year: number
  max_students: number
  location: string | null
  syllabus_url?: string | null
  grading_scheme?: string | null
  registration_open?: boolean | null
  teaching_assistants?: string[] | null
  created_at: string
  updated_at: string
  course_name?: string
  professor_name?: string
  department?: string
  credits?: number
  schedules?: CourseSchedule[]
  enrolled_count?: number
}

export interface CourseSchedule {
  id: string
  course_offering_id: string
  day_of_week: string
  start_time: string
  end_time: string
  room_number?: string | null
  schedule_type?: string | null
}

export interface Prerequisite {
  course_id: string
  prerequisite_id: string
  prerequisite_name?: string
  min_grade?: string | null
}

export interface Enrollment {
  student_id: string
  course_offering_id: string
  status: string
  grade: string | null
  attendance_percentage?: number | null
  midterm_grade?: string | null
  final_grade?: string | null
  assignment_scores?: any | null
  feedback?: string | null
  created_at: string
  updated_at: string
  student_name?: string
  course_name?: string
  credits?: number
  course_offering?: CourseOffering
}

export interface Announcement {
  id: string
  title: string
  content: string
  course_offering_id: string
  created_by: string | null
  priority: string | null
  attachment_urls: string[] | null
  visible_from: string
  visible_until: string | null
  is_pinned: boolean | null
  created_at: string
  updated_at: string
  course_name?: string
  creator_name?: string
}

// Grade conversion system
export const gradePoints = {
  A: 10,
  "A-": 9,
  B: 8,
  "B-": 7,
  C: 6,
  "C-": 5,
  D: 4,
  E: 2,
  NC: 0,
  F: 0,
}
export const pointToGrade = (points: number): string => {
  if (points >= 10) return "A"
  if (points >= 9) return "A-"
  if (points >= 8) return "B"
  if (points >= 7) return "B-"
  if (points >= 6) return "C"
  if (points >= 5) return "C-"
  if (points >= 4) return "D"
  if (points >= 2) return "E"
  return "NC"
}

/**
 * Register for a course
 * @param courseId The ID of the course to register for
 * @returns A promise that resolves to the updated course
 */
export async function registerForCourse(
  studentId: string,
  courseOfferingId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // Check prerequisites
    const prerequisites = await checkPrerequisites(studentId, courseOfferingId)
    if (!prerequisites.met) {
      return {
        success: false,
        message: `Prerequisites not met: ${prerequisites.missing.map((p) => p.name).join(", ")}`,
      }
    }

    // Check credit limit
    const creditCheck = await checkCreditLimit(studentId, courseOfferingId)
    if (!creditCheck.allowed) {
      return {
        success: false,
        message: `Registering would exceed credit limit. Current: ${creditCheck.current}, Adding: ${creditCheck.adding}, Max: ${creditCheck.max}`,
      }
    }

    // Check for time conflicts
    const timeCheck = await checkTimeConflicts(studentId, courseOfferingId)
    if (timeCheck.hasConflicts) {
      return {
        success: false,
        message: `Time conflict with: ${timeCheck.conflictingCourses.map((c) => `${c.name} (${c.day} ${c.time})`).join(", ")}`,
      }
    }

    // Enroll the student
    await executeQuery(
      `INSERT INTO enrollments (student_id, course_offering_id, status, created_at, updated_at)
       VALUES ($1, $2, 'enrolled', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [studentId, courseOfferingId],
    )

    return {
      success: true,
      message: `Successfully registered for the course`,
    }
  } catch (error) {
    console.error("Error registering for course:", error)
    return {
      success: false,
      message: "An error occurred during registration",
    }
  }
}

/**
 * Drop a course
 * @param studentId The ID of the student
 * @param courseOfferingId The ID of the course offering to drop
 * @returns A promise that resolves to the result of dropping the course
 */
export async function dropCourse(
  studentId: string,
  courseOfferingId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await executeQuery(
      "DELETE FROM enrollments WHERE student_id = $1 AND course_offering_id = $2 RETURNING student_id",
      [studentId, courseOfferingId],
    )

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "You are not enrolled in this course",
      }
    }

    return {
      success: true,
      message: `Successfully dropped the course`,
    }
  } catch (error) {
    console.error("Error dropping course:", error)
    return {
      success: false,
      message: "An error occurred while dropping the course",
    }
  }
}

// Create a new course
export async function createCourse(data: {
  id: string
  name: string
  department: string
  description: string | null
  credits: number
  theory_credits?: number | null
  lab_credits?: number | null
  course_type?: string | null
  syllabus_url?: string | null
  learning_outcomes?: string | null
  is_active?: boolean
}): Promise<Course> {
  try {
    const result = await executeQuery(
      `INSERT INTO courses (
        id, name, department, description, credits, theory_credits, lab_credits,
        course_type, syllabus_url, learning_outcomes, is_active
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [
        data.id,
        data.name,
        data.department,
        data.description,
        data.credits,
        data.theory_credits,
        data.lab_credits,
        data.course_type,
        data.syllabus_url,
        data.learning_outcomes,
        data.is_active,
      ],
    )

    return result.rows[0]
  } catch (error) {
    console.error("Error creating course:", error)
    throw error
  }
}

// Get all courses
export async function getAllCourses(): Promise<Course[]> {
  try {
    const result = await executeQuery("SELECT * FROM courses ORDER BY department, id")

    return result.rows
  } catch (error) {
    console.error("Error fetching courses:", error)
    throw error
  }
}

// Get course by ID
export async function getCourseById(id: string): Promise<Course | null> {
  try {
    const result = await executeQuery("SELECT * FROM courses WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error("Error fetching course:", error)
    throw error
  }
}

// Update course
export async function updateCourse(
  id: string,
  data: {
    name?: string
    department?: string
    description?: string | null
    credits?: number
    theory_credits?: number | null
    lab_credits?: number | null
    course_type?: string | null
    syllabus_url?: string | null
    learning_outcomes?: string | null
    is_active?: boolean
  },
): Promise<Course | null> {
  try {
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(data.name)
    }

    if (data.department !== undefined) {
      updates.push(`department = $${paramIndex++}`)
      values.push(data.department)
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      values.push(data.description)
    }

    if (data.credits !== undefined) {
      updates.push(`credits = $${paramIndex++}`)
      values.push(data.credits)
    }

    if (data.theory_credits !== undefined) {
      updates.push(`theory_credits = $${paramIndex++}`)
      values.push(data.theory_credits)
    }

    if (data.lab_credits !== undefined) {
      updates.push(`lab_credits = $${paramIndex++}`)
      values.push(data.lab_credits)
    }

    if (data.course_type !== undefined) {
      updates.push(`course_type = $${paramIndex++}`)
      values.push(data.course_type)
    }

    if (data.syllabus_url !== undefined) {
      updates.push(`syllabus_url = $${paramIndex++}`)
      values.push(data.syllabus_url)
    }

    if (data.learning_outcomes !== undefined) {
      updates.push(`learning_outcomes = $${paramIndex++}`)
      values.push(data.learning_outcomes)
    }

    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`)
      values.push(data.is_active)
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)

    values.push(id)

    const query = `
      UPDATE courses 
      SET ${updates.join(", ")} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `

    const result = await executeQuery(query, values)

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error("Error updating course:", error)
    throw error
  }
}

// Delete course
export async function deleteCourse(id: string): Promise<boolean> {
  try {
    const result = await executeQuery("DELETE FROM courses WHERE id = $1 RETURNING id", [id])

    return result.rows.length > 0
  } catch (error) {
    console.error("Error deleting course:", error)
    throw error
  }
}

// Add prerequisite to a course
export async function addPrerequisite(
  courseId: string,
  prerequisiteId: string,
  minGrade?: string,
): Promise<Prerequisite> {
  try {
    const result = await executeQuery(
      `INSERT INTO prerequisites (course_id, prerequisite_id, min_grade) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [courseId, prerequisiteId, minGrade],
    )

    return result.rows[0]
  } catch (error) {
    console.error("Error adding prerequisite:", error)
    throw error
  }
}

// Remove prerequisite from a course
export async function removePrerequisite(courseId: string, prerequisiteId: string): Promise<boolean> {
  try {
    const result = await executeQuery(
      "DELETE FROM prerequisites WHERE course_id = $1 AND prerequisite_id = $2 RETURNING course_id",
      [courseId, prerequisiteId],
    )

    return result.rows.length > 0
  } catch (error) {
    console.error("Error removing prerequisite:", error)
    throw error
  }
}

// Get prerequisites for a course
export async function getPrerequisitesForCourse(courseId: string): Promise<Prerequisite[]> {
  try {
    const result = await executeQuery(
      `SELECT p.*, c.name as prerequisite_name 
       FROM prerequisites p
       JOIN courses c ON p.prerequisite_id = c.id
       WHERE p.course_id = $1`,
      [courseId],
    )

    return result.rows
  } catch (error) {
    console.error("Error fetching prerequisites:", error)
    throw error
  }
}

// Create a new course offering
export async function createCourseOffering(data: {
  course_id: string
  professor_id: string | null
  semester: string
  year: number
  max_students: number
  location: string | null
  syllabus_url?: string | null
  grading_scheme?: string | null
  registration_open?: boolean
  teaching_assistants?: string[]
}): Promise<CourseOffering> {
  try {
    const result = await executeQuery(
      `INSERT INTO course_offerings (
        course_id, professor_id, semester, year, max_students, location,
        syllabus_url, grading_scheme, registration_open, teaching_assistants
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [
        data.course_id,
        data.professor_id,
        data.semester,
        data.year,
        data.max_students,
        data.location,
        data.syllabus_url,
        data.grading_scheme,
        data.registration_open,
        data.teaching_assistants,
      ],
    )

    return result.rows[0]
  } catch (error) {
    console.error("Error creating course offering:", error)
    throw error
  }
}

// Get all course offerings with additional details
export async function getAllCourseOfferings(): Promise<CourseOffering[]> {
  try {
    const result = await executeQuery(
      `SELECT co.*, 
              c.name as course_name, 
              c.department, 
              c.credits,
              u.name as professor_name,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_offering_id = co.id) as enrolled_count
       FROM course_offerings co
       JOIN courses c ON co.course_id = c.id
       LEFT JOIN users u ON co.professor_id = u.id
       ORDER BY co.year DESC, co.semester, c.department, c.id`,
    )

    const offerings = result.rows

    // Get schedules for each offering
    for (const offering of offerings) {
      const schedules = await executeQuery(
        "SELECT * FROM course_schedules WHERE course_offering_id = $1 ORDER BY day_of_week, start_time",
        [offering.id],
      )

      offering.schedules = schedules.rows
    }

    return offerings
  } catch (error) {
    console.error("Error fetching course offerings:", error)
    throw error
  }
}

// Get course offering by ID with additional details
export async function getCourseOfferingById(id: string): Promise<CourseOffering | null> {
  try {
    const result = await executeQuery(
      `SELECT co.*, 
              c.name as course_name, 
              c.department, 
              c.credits,
              u.name as professor_name,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_offering_id = co.id) as enrolled_count
       FROM course_offerings co
       JOIN courses c ON co.course_id = c.id
       LEFT JOIN users u ON co.professor_id = u.id
       WHERE co.id = $1`,
      [id],
    )

    if (result.rows.length === 0) {
      return null
    }

    const offering = result.rows[0]

    // Get schedules
    const schedules = await executeQuery(
      "SELECT * FROM course_schedules WHERE course_offering_id = $1 ORDER BY day_of_week, start_time",
      [id],
    )

    offering.schedules = schedules.rows

    return offering
  } catch (error) {
    console.error("Error fetching course offering:", error)
    throw error
  }
}

// Add schedule to a course offering
export async function addCourseSchedule(data: {
  course_offering_id: string
  day_of_week: string
  start_time: string
  end_time: string
  room_number?: string | null
  schedule_type?: string | null
}): Promise<CourseSchedule> {
  try {
    const result = await executeQuery(
      `INSERT INTO course_schedules (
        course_offering_id, day_of_week, start_time, end_time, room_number, schedule_type
      ) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [data.course_offering_id, data.day_of_week, data.start_time, data.end_time, data.room_number, data.schedule_type],
    )

    return result.rows[0]
  } catch (error) {
    console.error("Error adding course schedule:", error)
    throw error
  }
}

// Remove schedule from a course offering
export async function removeCourseSchedule(id: string): Promise<boolean> {
  try {
    const result = await executeQuery("DELETE FROM course_schedules WHERE id = $1 RETURNING id", [id])

    return result.rows.length > 0
  } catch (error) {
    console.error("Error removing course schedule:", error)
    throw error
  }
}

// Enroll a student in a course
export async function enrollStudent(studentId: string, courseOfferingId: string): Promise<Enrollment> {
  try {
    const result = await executeQuery(
      `INSERT INTO enrollments (student_id, course_offering_id, status, created_at, updated_at) 
       VALUES ($1, $2, 'enrolled', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [studentId, courseOfferingId],
    )

    return result.rows[0]
  } catch (error) {
    console.error("Error enrolling student:", error)
    throw error
  }
}

// Drop a course enrollment
export async function dropEnrollment(studentId: string, courseOfferingId: string): Promise<boolean> {
  try {
    const result = await executeQuery(
      "DELETE FROM enrollments WHERE student_id = $1 AND course_offering_id = $2 RETURNING student_id",
      [studentId, courseOfferingId],
    )

    return result.rows.length > 0
  } catch (error) {
    console.error("Error dropping enrollment:", error)
    throw error
  }
}

// Get enrollments for a student
export async function getEnrollmentsForStudent(studentId: string): Promise<Enrollment[]> {
  try {
    const result = await executeQuery(
      `SELECT e.*, 
              c.name as course_name,
              c.credits,
              co.id as course_offering_id,
              co.semester,
              co.year
       FROM enrollments e
       JOIN course_offerings co ON e.course_offering_id = co.id
       JOIN courses c ON co.course_id = c.id
       WHERE e.student_id = $1
       ORDER BY co.year DESC, co.semester, e.created_at DESC`,
      [studentId],
    )

    const enrollments = result.rows

    // Get course offering details for each enrollment
    for (const enrollment of enrollments) {
      const offering = await getCourseOfferingById(enrollment.course_offering_id)
      enrollment.course_offering = offering
    }

    return enrollments
  } catch (error) {
    console.error("Error fetching student enrollments:", error)
    throw error
  }
}

// Get enrollments for a course offering
export async function getEnrollmentsForCourseOffering(courseOfferingId: string): Promise<Enrollment[]> {
  try {
    const result = await executeQuery(
      `SELECT e.*, 
              u.name as student_name,
              u.student_id as student_id_number
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       WHERE e.course_offering_id = $1
       ORDER BY u.name`,
      [courseOfferingId],
    )

    return result.rows
  } catch (error) {
    console.error("Error fetching course enrollments:", error)
    throw error
  }
}

// Update student grade
export async function updateStudentGrade(
  studentId: string,
  courseOfferingId: string,
  data: {
    grade?: string | null
    midterm_grade?: string | null
    final_grade?: string | null
    attendance_percentage?: number | null
    assignment_scores?: any | null
    feedback?: string | null
    status?: string
  },
): Promise<Enrollment | null> {
  try {
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.grade !== undefined) {
      updates.push(`grade = $${paramIndex++}`)
      values.push(data.grade)
    }

    if (data.midterm_grade !== undefined) {
      updates.push(`midterm_grade = $${paramIndex++}`)
      values.push(data.midterm_grade)
    }

    if (data.final_grade !== undefined) {
      updates.push(`final_grade = $${paramIndex++}`)
      values.push(data.final_grade)
    }

    if (data.attendance_percentage !== undefined) {
      updates.push(`attendance_percentage = $${paramIndex++}`)
      values.push(data.attendance_percentage)
    }

    if (data.assignment_scores !== undefined) {
      updates.push(`assignment_scores = $${paramIndex++}`)
      values.push(data.assignment_scores)
    }

    if (data.feedback !== undefined) {
      updates.push(`feedback = $${paramIndex++}`)
      values.push(data.feedback)
    }

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`)
      values.push(data.status)
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)

    values.push(studentId)
    values.push(courseOfferingId)

    const query = `
      UPDATE enrollments 
      SET ${updates.join(", ")} 
      WHERE student_id = $${paramIndex++} AND course_offering_id = $${paramIndex} 
      RETURNING *
    `

    const result = await executeQuery(query, values)

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error("Error updating student grade:", error)
    throw error
  }
}

// Check if a student has completed prerequisites for a course
export async function checkPrerequisites(
  studentId: string,
  courseOfferingId: string,
): Promise<{
  met: boolean
  missing: { id: string; name: string }[]
}> {
  try {
    // Get course ID from offering
    const offeringResult = await executeQuery("SELECT course_id FROM course_offerings WHERE id = $1", [
      courseOfferingId,
    ])

    if (offeringResult.rows.length === 0) {
      throw new Error("Course offering not found")
    }

    const courseId = offeringResult.rows[0].course_id

    // Get prerequisites for the course
    const prerequisites = await getPrerequisitesForCourse(courseId)

    if (prerequisites.length === 0) {
      return { met: true, missing: [] }
    }

    // Get completed courses for the student
    const completedCoursesResult = await executeQuery(
      `SELECT DISTINCT c.id, c.name
       FROM enrollments e
       JOIN course_offerings co ON e.course_offering_id = co.id
       JOIN courses c ON co.course_id = c.id
       WHERE e.student_id = $1 AND e.status = 'completed' AND (e.grade IS NULL OR e.grade NOT IN ('F', 'NC'))`,
      [studentId],
    )

    const completedCourses = completedCoursesResult.rows
    const completedCourseIds = completedCourses.map((c) => c.id)

    // Check which prerequisites are missing
    const missingPrerequisites = prerequisites
      .filter((p) => !completedCourseIds.includes(p.prerequisite_id))
      .map((p) => ({
        id: p.prerequisite_id,
        name: p.prerequisite_name || p.prerequisite_id,
      }))

    return {
      met: missingPrerequisites.length === 0,
      missing: missingPrerequisites,
    }
  } catch (error) {
    console.error("Error checking prerequisites:", error)
    throw error
  }
}

// Check for time conflicts
export async function checkTimeConflicts(
  studentId: string,
  courseOfferingId: string,
): Promise<{
  hasConflicts: boolean
  conflictingCourses: { id: string; name: string; day: string; time: string }[]
}> {
  try {
    // Get schedules for the course offering
    const schedulesResult = await executeQuery(
      `SELECT cs.* 
       FROM course_schedules cs
       WHERE cs.course_offering_id = $1`,
      [courseOfferingId],
    )

    const schedules = schedulesResult.rows

    if (schedules.length === 0) {
      return { hasConflicts: false, conflictingCourses: [] }
    }

    // Get current enrollments and their schedules
    const currentEnrollmentsResult = await executeQuery(
      `SELECT co.id as offering_id, 
              c.id as course_id, 
              c.name as course_name, 
              cs.day_of_week, 
              cs.start_time, 
              cs.end_time
       FROM enrollments e
       JOIN course_offerings co ON e.course_offering_id = co.id
       JOIN courses c ON co.course_id = c.id
       JOIN course_schedules cs ON cs.course_offering_id = co.id
       WHERE e.student_id = $1 AND e.status = 'enrolled'`,
      [studentId],
    )

    const currentSchedules = currentEnrollmentsResult.rows

    // Check for conflicts
    const conflicts: { id: string; name: string; day: string; time: string }[] = []

    for (const newSchedule of schedules) {
      for (const currentSchedule of currentSchedules) {
        // Skip if different days
        if (newSchedule.day_of_week !== currentSchedule.day_of_week) {
          continue
        }

        // Check for time overlap
        const newStart = new Date(`1970-01-01T${newSchedule.start_time}`)
        const newEnd = new Date(`1970-01-01T${newSchedule.end_time}`)
        const currentStart = new Date(`1970-01-01T${currentSchedule.start_time}`)
        const currentEnd = new Date(`1970-01-01T${currentSchedule.end_time}`)

        if (
          (newStart >= currentStart && newStart < currentEnd) ||
          (newEnd > currentStart && newEnd <= currentEnd) ||
          (newStart <= currentStart && newEnd >= currentEnd)
        ) {
          conflicts.push({
            id: currentSchedule.course_id,
            name: currentSchedule.course_name,
            day: currentSchedule.day_of_week,
            time: `${currentSchedule.start_time.substring(0, 5)} - ${currentSchedule.end_time.substring(0, 5)}`,
          })
          break // No need to check other schedules for this course
        }
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflictingCourses: conflicts,
    }
  } catch (error) {
    console.error("Error checking time conflicts:", error)
    throw error
  }
}

// Check credit limit
export async function checkCreditLimit(
  studentId: string,
  courseOfferingId: string,
): Promise<{
  allowed: boolean
  current: number
  adding: number
  max: number
}> {
  try {
    // Get current credits
    const currentCreditsResult = await executeQuery(
      `SELECT SUM(c.credits) as total_credits
       FROM enrollments e
       JOIN course_offerings co ON e.course_offering_id = co.id
       JOIN courses c ON co.course_id = c.id
       WHERE e.student_id = $1 AND e.status = 'enrolled'`,
      [studentId],
    )

    const currentCredits = Number.parseInt(currentCreditsResult.rows[0]?.total_credits || "0")

    // Get credits for the new course
    const newCourseCreditsResult = await executeQuery(
      `SELECT c.credits
       FROM course_offerings co
       JOIN courses c ON co.course_id = c.id
       WHERE co.id = $1`,
      [courseOfferingId],
    )

    if (newCourseCreditsResult.rows.length === 0) {
      throw new Error("Course offering not found")
    }

    const newCourseCredits = Number.parseInt(newCourseCreditsResult.rows[0].credits)
    const maxCredits = 25 // Maximum allowed credits

    return {
      allowed: currentCredits + newCourseCredits <= maxCredits,
      current: currentCredits,
      adding: newCourseCredits,
      max: maxCredits,
    }
  } catch (error) {
    console.error("Error checking credit limit:", error)
    throw error
  }
}

// Calculate GPA for a student
export async function calculateGPA(studentId: string): Promise<{
  gpa: number
  totalCredits: number
  completedCourses: number
}> {
  try {
    const result = await executeQuery(
      `SELECT e.grade, c.credits
       FROM enrollments e
       JOIN course_offerings co ON e.course_offering_id = co.id
       JOIN courses c ON co.course_id = c.id
       WHERE e.student_id = $1 AND e.status = 'completed' AND e.grade IS NOT NULL`,
      [studentId],
    )

    const completedCourses = result.rows
    let totalCredits = 0
    let totalGradePoints = 0

    for (const course of completedCourses) {
      const credits = Number(course.credits)
      const gradePoint = gradePoints[course.grade] || 0

      totalCredits += credits
      totalGradePoints += gradePoint * credits
    }

    const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0

    return {
      gpa,
      totalCredits,
      completedCourses: completedCourses.length,
    }
  } catch (error) {
    console.error("Error calculating GPA:", error)
    throw error
  }
}

// Get course history for a student
export async function getCourseHistoryForStudent(studentId: string): Promise<any[]> {
  try {
    const result = await executeQuery(
      `SELECT e.*,
              c.id as course_code,
              c.name as course_name,
              c.credits,
              co.semester,
              co.year,
              u.name as instructor_name
       FROM enrollments e
       JOIN course_offerings co ON e.course_offering_id = co.id
       JOIN courses c ON co.course_id = c.id
       LEFT JOIN users u ON co.professor_id = u.id
       WHERE e.student_id = $1
       ORDER BY co.year DESC, co.semester DESC`,
      [studentId],
    )

    return result.rows
  } catch (error) {
    console.error("Error fetching course history:", error)
    throw error
  }
}

