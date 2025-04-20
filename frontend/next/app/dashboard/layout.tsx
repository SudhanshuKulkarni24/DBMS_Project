"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import { BookOpen, Calendar, Clock, Home, LogOut, User, Bell, Users, GraduationCap, ShieldCheck } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const pathname = usePathname()

  const isAdmin = session?.user.role === "admin"
  const isProfessor = session?.user.role === "professor" || isAdmin
  const isStudent = session?.user.role === "student" || isAdmin

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Link className="flex items-center gap-2 font-bold" href="/dashboard">
            <Calendar className="h-6 w-6" />
            <span>ERP 2.0</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <nav className="hidden gap-6 md:flex">
            <Link
              className={`text-sm font-medium ${pathname === "/dashboard" ? "text-primary" : ""}`}
              href="/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className={`text-sm font-medium ${pathname.startsWith("/dashboard/courses") ? "text-primary" : ""}`}
              href="/dashboard/courses"
            >
              Courses
            </Link>
            <Link
              className={`text-sm font-medium ${pathname.startsWith("/dashboard/timetable") ? "text-primary" : ""}`}
              href="/dashboard/timetable"
            >
              Timetable
            </Link>
            <Link
              className={`text-sm font-medium ${pathname.startsWith("/dashboard/announcements") ? "text-primary" : ""}`}
              href="/dashboard/announcements"
            >
              Announcements
            </Link>
          </nav>
          <ThemeToggle />
          <Link href="/dashboard/profile">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="text-sm font-medium">
                  {session?.user?.name ? getInitials(session.user.name) : "U"}
                </span>
              </div>
            </div>
          </Link>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-[250px] flex-col border-r bg-muted/40 md:flex">
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              <li>
                <Link
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    pathname === "/dashboard" ? "bg-accent" : "hover:bg-accent"
                  }`}
                  href="/dashboard"
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    pathname.startsWith("/dashboard/courses") ? "bg-accent" : "hover:bg-accent"
                  }`}
                  href="/dashboard/courses"
                >
                  <BookOpen className="h-4 w-4" />
                  Courses
                </Link>
              </li>
              <li>
                <Link
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    pathname.startsWith("/dashboard/timetable") ? "bg-accent" : "hover:bg-accent"
                  }`}
                  href="/dashboard/timetable"
                >
                  <Calendar className="h-4 w-4" />
                  Timetable
                </Link>
              </li>
              {isStudent && (
                <li>
                  <Link
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                      pathname.startsWith("/dashboard/history") ? "bg-accent" : "hover:bg-accent"
                    }`}
                    href="/dashboard/history"
                  >
                    <Clock className="h-4 w-4" />
                    Course History
                  </Link>
                </li>
              )}
              <li>
                <Link
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    pathname.startsWith("/dashboard/announcements") ? "bg-accent" : "hover:bg-accent"
                  }`}
                  href="/dashboard/announcements"
                >
                  <Bell className="h-4 w-4" />
                  Announcements
                </Link>
              </li>
              <li>
                <Link
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    pathname.startsWith("/dashboard/profile") ? "bg-accent" : "hover:bg-accent"
                  }`}
                  href="/dashboard/profile"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </li>

              {isProfessor && (
                <>
                  <li className="pt-4">
                    <div className="px-3 py-1 text-xs font-medium text-muted-foreground">Professor</div>
                  </li>
                  <li>
                    <Link
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                        pathname.startsWith("/professor/courses") ? "bg-accent" : "hover:bg-accent"
                      }`}
                      href="/professor/courses"
                    >
                      <GraduationCap className="h-4 w-4" />
                      My Courses
                    </Link>
                  </li>
                </>
              )}

              {isAdmin && (
                <>
                  <li className="pt-4">
                    <div className="px-3 py-1 text-xs font-medium text-muted-foreground">Admin</div>
                  </li>
                  <li>
                    <Link
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                        pathname.startsWith("/admin/users") ? "bg-accent" : "hover:bg-accent"
                      }`}
                      href="/admin/users"
                    >
                      <Users className="h-4 w-4" />
                      User Management
                    </Link>
                  </li>
                  <li>
                    <Link
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                        pathname.startsWith("/admin/courses") ? "bg-accent" : "hover:bg-accent"
                      }`}
                      href="/admin/courses"
                    >
                      <BookOpen className="h-4 w-4" />
                      Course Management
                    </Link>
                  </li>
                  <li>
                    <Link
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                        pathname.startsWith("/admin/settings") ? "bg-accent" : "hover:bg-accent"
                      }`}
                      href="/admin/settings"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      System Settings
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
          <div className="mt-auto border-t p-4">
            <Button
              className="flex w-full items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

