export function checkEnvironmentVariables() {
  const requiredVariables = ["NEON_DATABASE_URL", "NEXTAUTH_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]

  const missingVariables = requiredVariables.filter((variable) => !process.env[variable])

  if (missingVariables.length > 0) {
    console.error("Error: The following required environment variables are missing:", missingVariables.join(", "))

    if (missingVariables.includes("NEON_DATABASE_URL")) {
      console.error(
        "NEON_DATABASE_URL must be set to connect to the database. " +
          "Make sure it's not using NEXT_PUBLIC_ prefix as database operations should only happen server-side.",
      )
    }

    throw new Error("Missing required environment variables")
  }

  // Check for client-side environment variables
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_NEON_DATABASE_URL) {
    console.warn(
      "Warning: NEXT_PUBLIC_NEON_DATABASE_URL is exposed to the client. " +
        "Database operations should only happen on the server. " +
        "Use NEON_DATABASE_URL instead.",
    )
  }
}

