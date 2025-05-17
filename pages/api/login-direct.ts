import type { NextApiRequest, NextApiResponse } from "next"
import { createClient } from "@supabase/supabase-js"
import { serialize } from "cookie"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" })
  }

  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, message: "Missing Supabase environment variables" })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Try to sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error("Login error:", authError)
      return res.status(401).json({ success: false, message: "Invalid credentials" })
    }

    // Check if user is an admin
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (userError || !existingUser || !existingUser.is_admin) {
      // Sign out if not an admin
      await supabase.auth.signOut()
      return res.status(403).json({ success: false, message: "You don't have admin privileges" })
    }

    // Set auth cookies
    if (authData.session) {
      const accessToken = authData.session.access_token
      const refreshToken = authData.session.refresh_token

      // Set cookies with appropriate settings
      res.setHeader("Set-Cookie", [
        serialize("sb-access-token", accessToken, {
          path: "/",
          httpOnly: true,
          maxAge: 60 * 60, // 1 hour
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        }),
        serialize("sb-refresh-token", refreshToken, {
          path: "/",
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 7, // 1 week
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        }),
      ])
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        is_admin: existingUser.is_admin,
      },
    })
  } catch (error: any) {
    console.error("Login error:", error)
    return res.status(500).json({ success: false, message: `An unexpected error occurred: ${error.message}` })
  }
}
