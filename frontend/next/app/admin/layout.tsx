"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { BookOpen, Users, Settings, BarChart, Calendar, GraduationCap, Bell, FileText, Database } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Redirect if not admin (this will be handled by middleware)
  if (session?.user.role !== "admin") {
    return null
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden w-64 flex-col border-r bg-muted/40 md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <Settings className="h-5 w-5" />
            <span>Admin Panel</span>
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
              <BarChart className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/admin/users"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                pathname.startsWith("/admin/users")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              } transition-all`}
            >
              <Users className="h-4 w-4" />
              <span>User Management</span>
            </Link>
            <Link
              href="/admin/courses"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                pathname.startsWith("/admin/courses")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              } transition-all`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Course Management</span>
            </Link>
            <Link
              href="/admin/timetable"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                pathname.startsWith("/admin/timetable")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              } transition-all`}
            >
              <Calendar className="h-4 w-4" />
              <span>Timetable Management</span>
            </Link>
            <Link
              href="/admin/announcements"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                pathname.startsWith("/admin/announcements")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              } transition-all`}
            >
              <Bell className="h-4 w-4" />
              <span>Announcements</span>
            </Link>
            <Link
              href="/admin/academic"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                pathname.startsWith("/admin/academic")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              } transition-all`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Academic Records</span>
            </Link>
            <Link
              href="/admin/reports"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                pathname.startsWith("/admin/reports")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              } transition-all`}
            >
              <FileText className="h-4 w-4" />
              <span>Reports</span>
            </Link>
            <Link
              href="/admin/database"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                pathname.startsWith("/admin/database")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              } transition-all`}
            >
              <Database className="h-4 w-4" />
              <span>Database Management</span>
            </Link>
          </nav>
        </div>
        <div className="mt-auto p-4">
          <div className="rounded-lg bg-primary/10 p-4">
            <h4 className="mb-2 text-sm font-medium">Admin Help</h4>
            <p className="text-xs text-muted-foreground">
              Need assistance with the admin panel? Check the documentation or contact support.
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}

