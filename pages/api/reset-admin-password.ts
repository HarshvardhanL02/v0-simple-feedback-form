import type { NextApiRequest, NextApiResponse } from "next"
import { createClient } from "@supabase/supabase-js"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" })
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, message: "Missing Supabase environment variables" })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const email = "admin@example.com"
    const password = "Admin123!"

    // Check if the user exists in Supabase Auth
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers({
      filter: {
        email: email,
      },
    })

    if (userError) {
      console.error("Error checking user:", userError)
      return res.status(500).json({ success: false, message: "Failed to check if user exists" })
    }

    // If user exists, update the password
    if (userData && userData.users && userData.users.length > 0) {
      const userId = userData.users[0].id

      // Update the user's password
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password })

      if (updateError) {
        console.error("Error updating password:", updateError)
        return res.status(500).json({ success: false, message: "Failed to reset password" })
      }

      return res.status(200).json({ success: true, message: "Admin password reset successfully" })
    } else {
      // If user doesn't exist, create it
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (createError) {
        console.error("Error creating admin user:", createError)
        return res.status(500).json({ success: false, message: "Failed to create admin user" })
      }

      // Check if user exists in our users table
      const { data: existingUser, error: existingUserError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single()

      // Update or create user in our users table
      if (existingUser) {
        const { error: updateError } = await supabase
          .from("users")
          .update({ auth_id: newUser.user.id })
          .eq("email", email)

        if (updateError) {
          console.error("Error updating admin user:", updateError)
        }
      } else {
        const { error: insertError } = await supabase.from("users").insert({
          email,
          name: "Admin User",
          is_admin: true,
          auth_id: newUser.user.id,
        })

        if (insertError) {
          console.error("Error creating user record:", insertError)
        }
      }

      return res.status(200).json({ success: true, message: "Admin user created successfully" })
    }
  } catch (error) {
    console.error("Error resetting admin password:", error)
    return res.status(500).json({ success: false, message: "An unexpected error occurred" })
  }
}
