import type React from "react"
import { Inter } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"
import type { Metadata } from "next"
import { checkEnvironmentVariables } from "@/lib/env-check"

// Check environment variables in development
if (process.env.NODE_ENV !== "production") {
  checkEnvironmentVariables()
}


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ERP 2.0 - Timetable Planning",
  description: "A timetable planning app for students",
  generator: "human sweat and tears (and little bit of blood) and v0",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}



import './globals.css'