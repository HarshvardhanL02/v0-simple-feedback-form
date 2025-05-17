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
    const email = "test@example.com"
    const password = "testpassword"

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes("already exists")) {
        // Try to update the password
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers({
          filter: {
            email: email,
          },
        })

        if (userError) {
          console.error("Error checking user:", userError)
          return res.status(500).json({ success: false, message: "Failed to check if user exists" })
        }

        if (userData && userData.users && userData.users.length > 0) {
          const userId = userData.users[0].id

          // Update the user's password
          const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password })

          if (updateError) {
            console.error("Error updating password:", updateError)
            return res.status(500).json({ success: false, message: "Failed to update test user password" })
          }

          // Make sure the user exists in our users table
          const { data: existingUser, error: existingUserError } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .single()

          if (existingUserError || !existingUser) {
            // Create user in our users table if it doesn't exist
            const { error: insertError } = await supabase.from("users").insert({
              email,
              name: "Test User",
              is_admin: true,
              auth_id: userId,
            })

            if (insertError) {
              console.error("Error creating user record:", insertError)
              return res.status(500).json({ success: false, message: "Failed to create user record" })
            }
          } else if (!existingUser.is_admin) {
            // Update user to be admin if not already
            const { error: updateError } = await supabase.from("users").update({ is_admin: true }).eq("email", email)

            if (updateError) {
              console.error("Error updating user:", updateError)
            }
          }

          return res.status(200).json({
            success: true,
            message: "Test user password updated. Email: test@example.com, Password: testpassword",
          })
        }

        return res.status(500).json({ success: false, message: "Test user exists but could not be updated" })
      }

      console.error("Error creating auth user:", authError)
      return res.status(500).json({ success: false, message: "Failed to create test user: " + authError.message })
    }

    // Create or update user in users table
    const { error: userError } = await supabase.from("users").upsert({
      email,
      name: "Test User",
      is_admin: true,
      auth_id: authUser.user.id,
    })

    if (userError) {
      console.error("Error creating user record:", userError)
      return res.status(500).json({ success: false, message: "Failed to create user record" })
    }

    return res.status(200).json({
      success: true,
      message: "Test user created successfully. Email: test@example.com, Password: testpassword",
    })
  } catch (error) {
    console.error("Error creating test user:", error)
    return res.status(500).json({ success: false, message: "An unexpected error occurred" })
  }
}
