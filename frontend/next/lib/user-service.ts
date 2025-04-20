import { executeQuery } from "@/lib/db"

export interface User {
  id: string
  name: string
  email: string
  role: string
  student_id?: string | null
  branch?: string | null
  graduating_year?: number | null
  profile_picture_url?: string | null
  phone_number?: string | null
  address?: string | null
  emergency_contact?: string | null
  date_of_birth?: string | null
  gender?: string | null
  created_at: string
  updated_at: string
}

// Get all users
export async function getAllUsers(): Promise<User[]> {
  try {
    const result = await executeQuery(
      `SELECT id, name, email, role, student_id, branch, graduating_year, 
       profile_picture_url, phone_number, address, emergency_contact, 
       date_of_birth, gender, created_at, updated_at 
       FROM users ORDER BY created_at DESC`,
    )
    return result.rows
  } catch (error) {
    console.error("Error fetching users:", error)
    throw error
  }
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
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

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await executeQuery(
      `SELECT id, name, email, password, role, student_id, branch, graduating_year, 
       profile_picture_url, phone_number, address, emergency_contact, 
       date_of_birth, gender, created_at, updated_at 
       FROM users WHERE email = $1`,
      [email],
    )

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error("Error fetching user by email:", error)
    throw error
  }
}

// Update user
export async function updateUser(
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
): Promise<User | null> {
  try {
    // Build the SET part of the query dynamically based on provided fields
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(data.name)
    }

    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex++}`)
      values.push(data.email)
    }

    if (data.role !== undefined) {
      updates.push(`role = $${paramIndex++}`)
      values.push(data.role)
    }

    if (data.student_id !== undefined) {
      updates.push(`student_id = $${paramIndex++}`)
      values.push(data.student_id)
    }

    if (data.branch !== undefined) {
      updates.push(`branch = $${paramIndex++}`)
      values.push(data.branch)
    }

    if (data.graduating_year !== undefined) {
      updates.push(`graduating_year = $${paramIndex++}`)
      values.push(data.graduating_year)
    }

    if (data.profile_picture_url !== undefined) {
      updates.push(`profile_picture_url = $${paramIndex++}`)
      values.push(data.profile_picture_url)
    }

    if (data.phone_number !== undefined) {
      updates.push(`phone_number = $${paramIndex++}`)
      values.push(data.phone_number)
    }

    if (data.address !== undefined) {
      updates.push(`address = $${paramIndex++}`)
      values.push(data.address)
    }

    if (data.emergency_contact !== undefined) {
      updates.push(`emergency_contact = $${paramIndex++}`)
      values.push(data.emergency_contact)
    }

    if (data.date_of_birth !== undefined) {
      updates.push(`date_of_birth = $${paramIndex++}`)
      values.push(data.date_of_birth)
    }

    if (data.gender !== undefined) {
      updates.push(`gender = $${paramIndex++}`)
      values.push(data.gender)
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)

    // Add the user ID as the last parameter
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

// Create user
export async function createUser(data: {
  name: string
  email: string
  password?: string
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
}): Promise<User> {
  try {
    const {
      name,
      email,
      password,
      role = "student",
      student_id,
      branch,
      graduating_year,
      profile_picture_url,
      phone_number,
      address,
      emergency_contact,
      date_of_birth,
      gender,
    } = data

    const result = await executeQuery(
      `INSERT INTO users (
        name, email, password, role, student_id, branch, graduating_year,
        profile_picture_url, phone_number, address, emergency_contact,
        date_of_birth, gender
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
      RETURNING id, name, email, role, student_id, branch, graduating_year,
      profile_picture_url, phone_number, address, emergency_contact,
      date_of_birth, gender, created_at, updated_at`,
      [
        name,
        email,
        password,
        role,
        student_id,
        branch,
        graduating_year,
        profile_picture_url,
        phone_number,
        address,
        emergency_contact,
        date_of_birth,
        gender,
      ],
    )

    return result.rows[0]
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

// Delete user
export async function deleteUser(id: string): Promise<boolean> {
  try {
    const result = await executeQuery("DELETE FROM users WHERE id = $1 RETURNING id", [id])

    return result.rows.length > 0
  } catch (error) {
    console.error("Error deleting user:", error)
    throw error
  }
}

// Get users by role
export async function getUsersByRole(role: string): Promise<User[]> {
  try {
    const result = await executeQuery(
      `SELECT id, name, email, role, student_id, branch, graduating_year, 
       profile_picture_url, phone_number, address, emergency_contact, 
       date_of_birth, gender, created_at, updated_at 
       FROM users WHERE role = $1 ORDER BY name`,
      [role],
    )

    return result.rows
  } catch (error) {
    console.error(`Error fetching ${role}s:`, error)
    throw error
  }
}

// Get user statistics
export async function getUserStatistics(): Promise<{
  totalUsers: number
  studentCount: number
  professorCount: number
  adminCount: number
  recentUsers: User[]
}> {
  try {
    const totalResult = await executeQuery("SELECT COUNT(*) as count FROM users")
    const studentResult = await executeQuery("SELECT COUNT(*) as count FROM users WHERE role = 'student'")
    const professorResult = await executeQuery("SELECT COUNT(*) as count FROM users WHERE role = 'professor'")
    const adminResult = await executeQuery("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")

    const recentUsersResult = await executeQuery(
      `SELECT id, name, email, role, student_id, branch, graduating_year, 
       profile_picture_url, created_at 
       FROM users ORDER BY created_at DESC LIMIT 5`,
    )

    return {
      totalUsers: Number.parseInt(totalResult.rows[0].count),
      studentCount: Number.parseInt(studentResult.rows[0].count),
      professorCount: Number.parseInt(professorResult.rows[0].count),
      adminCount: Number.parseInt(adminResult.rows[0].count),
      recentUsers: recentUsersResult.rows,
    }
  } catch (error) {
    console.error("Error fetching user statistics:", error)
    throw error
  }
}

