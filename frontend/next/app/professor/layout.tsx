"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { BookOpen, Users, Calendar, GraduationCap, Bell, ClipboardList, CheckSquare } from "lucide-react"

export default function ProfessorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Redirect if not professor (this will be handled by middleware)
  if (session?.user.role !== "professor" && session?.user.role !== "admin") {
    return null
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden w-64 flex-col border-r bg-muted/40 md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/professor" className="flex items-center gap-2 font-semibold">
            <GraduationCap className="h-5 w-5" />
            <span>Professor Portal</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium">
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                pathname === "/dashboard"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              } transition-all`}
            >
              <Calendar className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/professor/courses"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                pathname.startsWith("/professor/courses")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              } transition-all`}
            >
              <BookOpen className="h-4 w-4" />
              <span>My Courses</span>
            </Link>
            <Link
              href="/professor/students"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                pathname.startsWith("/professor/students")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              } transition-all`}
            >
              <Users className="h-4 w-4" />
              <span>Students</span>
            </Link>
            <Link
              href="/professor/announcements"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                pathname.startsWith("/professor/announcements")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              } transition-all`}
            >
              <Bell className="h-4 w-4" />
              <span>Announcements</span>
            </Link>
            <Link
              href="/professor/assignments"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                pathname.startsWith("/professor/assignments")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              } transition-all`}
            >
              <ClipboardList className="h-4 w-4" />
              <span>Assignments</span>
            </Link>
            <Link
              href="/professor/grades"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                pathname.startsWith("/professor/grades")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              } transition-all`}
            >
              <CheckSquare className="h-4 w-4" />
              <span>Grading</span>
            </Link>
            <Link
              href="/professor/timetable"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                pathname.startsWith("/professor/timetable")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              } transition-all`}
            >
              <Calendar className="h-4 w-4" />
              <span>Timetable</span>
            </Link>
          </nav>
        </div>
        <div className="mt-auto p-4">
          <div className="rounded-lg bg-primary/10 p-4">
            <h4 className="mb-2 text-sm font-medium">Professor Resources</h4>
            <p className="text-xs text-muted-foreground">
              Access teaching resources, grading guidelines, and academic policies.
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}

