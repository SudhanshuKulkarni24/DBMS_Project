import { Pool } from "@neondatabase/serverless"

// Check for environment variables
if (!process.env.NEON_DATABASE_URL && !process.env.NEXT_PUBLIC_NEON_DATABASE_URL) {
  throw new Error("NEON_DATABASE_URL environment variable is not set")
}

// Create a connection pool
const pool = new Pool({ connectionString: process.env.NEXT_PUBLIC_NEON_DATABASE_URL })

// Helper function to execute SQL queries (server-side only)
export async function executeQuery(query: string, params: any[] = []) {
  // Ensure this only runs on the server
  // if (typeof window !== "undefined") {
  //   throw new Error("Database queries can only be executed on the server")
  // }

  const client = await pool.connect()
  try {
    return await client.query(query, params)
  } finally {
    client.release()
  }
}

// Initialize database with required tables
export async function initializeDatabase() {
  try {
    // Create users table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'student',
        student_id VARCHAR(50) UNIQUE,
        branch VARCHAR(100),
        graduating_year INTEGER,
        profile_picture_url VARCHAR(255),
        phone_number VARCHAR(20),
        address TEXT,
        emergency_contact VARCHAR(255),
        date_of_birth DATE,
        gender VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create courses table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS courses (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        department VARCHAR(100) NOT NULL,
        description TEXT,
        credits INTEGER NOT NULL,
        theory_credits NUMERIC(3,1) DEFAULT 0,
        lab_credits NUMERIC(3,1) DEFAULT 0,
        course_type VARCHAR(50) DEFAULT 'core',
        syllabus_url VARCHAR(255),
        learning_outcomes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create prerequisites table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS prerequisites (
        course_id VARCHAR(50) REFERENCES courses(id) ON DELETE CASCADE,
        prerequisite_id VARCHAR(50) REFERENCES courses(id) ON DELETE CASCADE,
        min_grade VARCHAR(5),
        PRIMARY KEY (course_id, prerequisite_id)
      )
    `)

    // Create course_offerings table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS course_offerings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id VARCHAR(50) REFERENCES courses(id) ON DELETE CASCADE,
        professor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        semester VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        max_students INTEGER NOT NULL DEFAULT 50,
        location VARCHAR(100),
        syllabus_url VARCHAR(255),
        grading_scheme TEXT,
        registration_open BOOLEAN DEFAULT TRUE,
        teaching_assistants TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create course_schedules table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS course_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
        day_of_week VARCHAR(10) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        room_number VARCHAR(50),
        schedule_type VARCHAR(50) DEFAULT 'lecture'
      )
    `)

    // Create enrollments table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS enrollments (
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'enrolled',
        grade VARCHAR(5),
        attendance_percentage NUMERIC(5,2) DEFAULT 0,
        midterm_grade VARCHAR(5),
        final_grade VARCHAR(5),
        assignment_scores JSONB,
        feedback TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (student_id, course_offering_id)
      )
    `)

    // Create announcements table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS announcements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        priority VARCHAR(20) DEFAULT 'normal',
        attachment_urls TEXT[],
        visible_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        visible_until TIMESTAMP WITH TIME ZONE,
        is_pinned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create seed data function
    await executeQuery(`
      CREATE OR REPLACE FUNCTION seed_initial_data() RETURNS VOID AS $$
      DECLARE
        admin_id UUID;
        professor_id UUID;
        student_id UUID;
        cs_course_id VARCHAR(50);
        math_course_id VARCHAR(50);
        course_offering_id UUID;
      BEGIN
        -- Create admin user if not exists
        INSERT INTO users (name, email, password, role)
        VALUES ('Admin User', 'admin@example.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', 'admin')
        ON CONFLICT (email) DO NOTHING
        RETURNING id INTO admin_id;
        
        -- Create professor user if not exists
        INSERT INTO users (name, email, password, role)
        VALUES ('Professor Smith', 'professor@example.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', 'professor')
        ON CONFLICT (email) DO NOTHING
        RETURNING id INTO professor_id;
        
        -- Create student user if not exists
        INSERT INTO users (name, email, password, role, student_id, branch, graduating_year)
        VALUES ('John Doe', 'student@example.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', 'student', '2023A7PS0001', 'Computer Science', 2025)
        ON CONFLICT (email) DO NOTHING
        RETURNING id INTO student_id;
        
        -- Create CS course if not exists
        INSERT INTO courses (id, name, department, description, credits)
        VALUES ('CS101', 'Introduction to Programming', 'Computer Science', 'An introductory course to programming concepts using Python', 4)
        ON CONFLICT (id) DO NOTHING
        RETURNING id INTO cs_course_id;
        
        -- Create Math course if not exists
        INSERT INTO courses (id, name, department, description, credits)
        VALUES ('MATH101', 'Calculus I', 'Mathematics', 'Introduction to differential and integral calculus', 4)
        ON CONFLICT (id) DO NOTHING
        RETURNING id INTO math_course_id;
        
        -- Create course offering if not exists
        INSERT INTO course_offerings (course_id, professor_id, semester, year, max_students, location, registration_open)
        VALUES (cs_course_id, professor_id, 'Spring', 2025, 50, 'LT-1', TRUE)
        ON CONFLICT DO NOTHING
        RETURNING id INTO course_offering_id;
        
        -- Create course schedule if not exists
        INSERT INTO course_schedules (course_offering_id, day_of_week, start_time, end_time, room_number)
        VALUES (course_offering_id, 'Monday', '10:00:00', '11:30:00', 'LT-1')
        ON CONFLICT DO NOTHING;
        
        -- Create announcement if not exists
        INSERT INTO announcements (title, content, course_offering_id, created_by, priority)
        VALUES ('Welcome to CS101', 'Welcome to Introduction to Programming. Please check the syllabus.', course_offering_id, professor_id, 'normal')
        ON CONFLICT DO NOTHING;
        
        -- Enroll student in course if not exists
        INSERT INTO enrollments (student_id, course_offering_id, status)
        VALUES (student_id, course_offering_id, 'enrolled')
        ON CONFLICT DO NOTHING;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Execute seed data function
    await executeQuery("SELECT seed_initial_data()")

    console.log("Database initialized successfully")
    return true
  } catch (error) {
    console.error("Failed to initialize database:", error)
    return false
  }
}

