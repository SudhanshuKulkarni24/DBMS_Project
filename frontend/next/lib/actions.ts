"use server"

import { executeQuery } from "@/lib/db"
import { gradePoints } from "@/lib/course-service"

// User actions
export async function getUserByIdAction(id: string) {
  try {
    const result = await executeQuery(
      `SELECT id, name, email, role, student_id, branch, graduating_year, 
       profile_picture_url, phone_number, address, emergency_contact, 
       date_of_birth, gender, created_at, updated_at 
       FROM users WHERE id = $1`,
      [id],
    )

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error("Error fetching user:", error)
    throw error
  }
}

export async function updateUserAction(
  id: string,
  data: {
    name?: string
    email?: string
    role?: string
    student_id?: string | null
    branch?: string | null
    graduating_year?: number | null
    profile_picture_url?: string | null
    phone_number?: string | null
    address?: string | null
    emergency_contact?: string | null
    date_of_birth?: string | null
    gender?: string | null
  },
) {
  try {
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    // Build the update query dynamically
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex++}`)
        values.push(value)
      }
    })

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const query = `
      UPDATE users 
      SET ${updates.join(", ")} 
      WHERE id = $${paramIndex} 
      RETURNING id, name, email, role, student_id, branch, graduating_year, 
      profile_picture_url, phone_number, address, emergency_contact, 
      date_of_birth, gender, created_at, updated_at
    `

    const result = await executeQuery(query, values)

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

// Course actions
export async function getAllCoursesAction() {
  try {
    const result = await executeQuery("SELECT * FROM courses ORDER BY department, id")
    return result.rows
  } catch (error) {
    console.error("Error fetching courses:", error)
    throw error
  }
}

export async function getCourseByIdAction(id: string) {
  try {
    const result = await executeQuery("SELECT * FROM courses WHERE id = $1", [id])
    return result.rows[0] || null
  } catch (error) {
    console.error("Error fetching course:", error)
    throw error
  }
}

export async function updateCourseAction(
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
) {
  try {
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    // Build the update query dynamically
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex++}`)
        values.push(value)
      }
    })

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const query = `
      UPDATE courses 
      SET ${updates.join(", ")} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `

    const result = await executeQuery(query, values)
    return result.rows[0] || null
  } catch (error) {
    console.error("Error updating course:", error)
    throw error
  }
}

export async function createCourseAction(data: {
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
}) {
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

export async function deleteCourseAction(id: string) {
  try {
    const result = await executeQuery("DELETE FROM courses WHERE id = $1 RETURNING id", [id])
    return result.rows.length > 0
  } catch (error) {
    console.error("Error deleting course:", error)
    throw error
  }
}

// Course offering actions
export async function getAllCourseOfferingsAction() {
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

export async function getCourseOfferingByIdAction(id: string) {
  try {
    const result = await executeQuery(
      `SELECT co.*, 
              c.name as course_name, 
              c.department, 
              c.credits,
              c.description,
              c.learning_outcomes,
              c.syllabus_url,
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

export async function createCourseOfferingAction(data: {
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
}) {
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

export async function updateCourseOfferingAction(
  id: string,
  data: {
    professor_id?: string | null
    semester?: string
    year?: number
    max_students?: number
    location?: string | null
    syllabus_url?: string | null
    grading_scheme?: string | null
    registration_open?: boolean
    teaching_assistants?: string[]
  },
) {
  try {
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    // Build the update query dynamically
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex++}`)
        values.push(value)
      }
    })

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const query = `
      UPDATE course_offerings 
      SET ${updates.join(", ")} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `

    const result = await executeQuery(query, values)
    return result.rows[0] || null
  } catch (error) {
    console.error("Error updating course offering:", error)
    throw error
  }
}

// Schedule actions
export async function addCourseScheduleAction(data: {
  course_offering_id: string
  day_of_week: string
  start_time: string
  end_time: string
  room_number?: string | null
  schedule_type?: string | null
}) {
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

export async function updateCourseScheduleAction(
  id: string,
  data: {
    day_of_week?: string
    start_time?: string
    end_time?: string
    room_number?: string | null
    schedule_type?: string | null
  },
) {
  try {
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    // Build the update query dynamically
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex++}`)
        values.push(value)
      }
    })

    values.push(id)

    const query = `
      UPDATE course_schedules 
      SET ${updates.join(", ")} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `

    const result = await executeQuery(query, values)
    return result.rows[0] || null
  } catch (error) {
    console.error("Error updating course schedule:", error)
    throw error
  }
}

export async function deleteCourseScheduleAction(id: string) {
  try {
    const result = await executeQuery("DELETE FROM course_schedules WHERE id = $1 RETURNING id", [id])
    return result.rows.length > 0
  } catch (error) {
    console.error("Error deleting course schedule:", error)
    throw error
  }
}

// Enrollment actions
export async function getEnrollmentsForStudentAction(studentId: string) {
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
      const offering = await getCourseOfferingByIdAction(enrollment.course_offering_id)
      enrollment.course_offering = offering
    }

    return enrollments
  } catch (error) {
    console.error("Error fetching student enrollments:", error)
    throw error
  }
}

export async function getEnrollmentsForCourseOfferingAction(courseOfferingId: string) {
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

export async function updateStudentGradeAction(
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
) {
  try {
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    // Build the update query dynamically
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex++}`)
        values.push(value)
      }
    })

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
    return result.rows[0] || null
  } catch (error) {
    console.error("Error updating student grade:", error)
    throw error
  }
}

// Announcement actions
export async function getAnnouncementsForStudentAction(studentId: string) {
  try {
    const result = await executeQuery(
      `SELECT a.*, 
              c.name as course_name, 
              u.name as creator_name
       FROM announcements a
       JOIN course_offerings co ON a.course_offering_id = co.id
       JOIN courses c ON co.course_id = c.id
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.course_offering_id IN (
         SELECT course_offering_id 
         FROM enrollments 
         WHERE student_id = $1
       )
       ORDER BY a.is_pinned DESC, a.created_at DESC`,
      [studentId],
    )

    return result.rows
  } catch (error) {
    console.error("Error fetching student announcements:", error)
    throw error
  }
}

export async function getAnnouncementsForCourseOfferingAction(courseOfferingId: string) {
  try {
    const result = await executeQuery(
      `SELECT a.*, 
              c.name as course_name, 
              u.name as creator_name
       FROM announcements a
       JOIN course_offerings co ON a.course_offering_id = co.id
       JOIN courses c ON co.course_id = c.id
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.course_offering_id = $1
       ORDER BY a.is_pinned DESC, a.created_at DESC`,
      [courseOfferingId],
    )

    return result.rows
  } catch (error) {
    console.error("Error fetching course announcements:", error)
    throw error
  }
}

export async function createAnnouncementAction(data: {
  title: string
  content: string
  course_offering_id: string
  created_by: string
  priority?: string
  attachment_urls?: string[]
  is_pinned?: boolean
}) {
  try {
    const result = await executeQuery(
      `INSERT INTO announcements (
        title, content, course_offering_id, created_by, priority, 
        attachment_urls, visible_from, is_pinned, created_at, updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING *`,
      [
        data.title,
        data.content,
        data.course_offering_id,
        data.created_by,
        data.priority || "normal",
        data.attachment_urls || null,
        data.is_pinned || false,
      ],
    )

    return result.rows[0]
  } catch (error) {
    console.error("Error creating announcement:", error)
    throw error
  }
}

export async function updateAnnouncementAction(
  id: string,
  data: {
    title?: string
    content?: string
    priority?: string
    attachment_urls?: string[]
    is_pinned?: boolean
  },
) {
  try {
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    // Build the update query dynamically
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex++}`)
        values.push(value)
      }
    })

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const query = `
      UPDATE announcements 
      SET ${updates.join(", ")} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `

    const result = await executeQuery(query, values)
    return result.rows[0] || null
  } catch (error) {
    console.error("Error updating announcement:", error)
    throw error
  }
}

export async function deleteAnnouncementAction(id: string) {
  try {
    const result = await executeQuery("DELETE FROM announcements WHERE id = $1 RETURNING id", [id])
    return result.rows.length > 0
  } catch (error) {
    console.error("Error deleting announcement:", error)
    throw error
  }
}

// Course history and GPA
export async function getCourseHistoryForStudentAction(studentId: string) {
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

export async function calculateGPAAction(studentId: string) {
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

