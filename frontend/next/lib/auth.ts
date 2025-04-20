import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { compare, hash } from "bcryptjs"
import { getUserByEmail } from "./user-service"
import { createUser as createUserFn } from "./user-service"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "student", // Default role for Google sign-ins
        }
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user by email
          const user = await getUserByEmail(credentials.email)

          if (!user || !user.password) {
            return null
          }

          // Compare passwords
          const passwordMatch = await compare(credentials.password, user.password)

          if (!passwordMatch) {
            return null
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            studentId: user.student_id,
            branch: user.branch,
            graduatingYear: user.graduating_year,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role
        token.id = user.id
        token.studentId = user.studentId
        token.branch = user.branch
        token.graduatingYear = user.graduatingYear
      }

      // If it's a Google sign-in, check if the user exists in our database
      if (account?.provider === "google") {
        try {
          const existingUser = await getUserByEmail(token.email as string)

          if (!existingUser) {
            // User doesn't exist, create a new user
            const newUser = await createUserFn({
              name: token.name as string,
              email: token.email as string,
              role: "student",
              password: "", // No password for OAuth users
            })

            token.role = "student"
            token.id = newUser.id
          } else {
            // User exists, update token with user data
            token.role = existingUser.role
            token.id = existingUser.id
            token.studentId = existingUser.student_id
            token.branch = existingUser.branch
            token.graduatingYear = existingUser.graduating_year
          }
        } catch (error) {
          console.error("Error handling Google sign-in:", error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
        session.user.studentId = token.studentId as string
        session.user.branch = token.branch as string
        session.user.graduatingYear = token.graduatingYear as number
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Helper function to create a new user
export async function createUserWithAuth({
  name,
  email,
  password,
  role = "student",
  studentId = null,
  branch = null,
  graduatingYear = null,
}: {
  name: string
  email: string
  password: string
  role?: string
  studentId?: string | null
  branch?: string | null
  graduatingYear?: number | null
}) {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email)

    if (existingUser) {
      throw new Error("User already exists")
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create user
    const newUser = await createUserFn({
      name,
      email,
      password: hashedPassword,
      role,
      student_id: studentId,
      branch,
      graduating_year: graduatingYear,
    })

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      student_id: newUser.student_id,
      branch: newUser.branch,
      graduating_year: newUser.graduating_year,
    }
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

// Types for NextAuth
declare module "next-auth" {
  interface User {
    role: string
    studentId?: string
    branch?: string
    graduatingYear?: number
  }

  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
      studentId?: string
      branch?: string
      graduatingYear?: number
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    id: string
    studentId?: string
    branch?: string
    graduatingYear?: number
  }
}

export const createUser = createUserFn

