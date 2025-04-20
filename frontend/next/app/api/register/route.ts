import { NextResponse } from "next/server"
import { createUserWithAuth } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, role, studentId, branch, graduatingYear } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    // Create user
    const user = await createUserWithAuth({
      name,
      email,
      password,
      role: role || "student",
      studentId,
      branch,
      graduatingYear: graduatingYear ? Number.parseInt(graduatingYear) : null,
    })

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Registration error:", error)

    if (error.message === "User already exists") {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

