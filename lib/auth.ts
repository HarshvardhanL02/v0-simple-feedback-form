"use server"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "./supabase"

// Sign in the user
export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { success: false, message: "Missing email or password" }
  }

  try {
    const supabase = createServerSupabaseClient()

    // Try to sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // If login failed and it's the admin user, try to update the password
    if (authError && email === "admin@example.com" && password === "Admin123!") {
      console.log("Admin login failed, attempting to reset password...")

      // Check if the user exists in Supabase Auth
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers({
        filter: {
          email: email,
        },
      })

      if (userError) {
        console.error("Error checking user:", userError)
        return { success: false, message: "Failed to check if user exists" }
      }

      // If user exists, try to update the password
      if (userData && userData.users && userData.users.length > 0) {
        const userId = userData.users[0].id

        // Update the user's password
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password })

        if (updateError) {
          console.error("Error updating password:", updateError)
          return { success: false, message: "Failed to update password. Try a different password." }
        }

        // Try to sign in again
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (retryError) {
          console.error("Error signing in after password update:", retryError)
          return { success: false, message: "Updated password but failed to sign in" }
        }

        return { success: true, message: "Password updated and logged in successfully" }
      }
      // If user doesn't exist, create it
      else {
        // Create a new user in Supabase Auth
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        })

        if (createError) {
          console.error("Error creating admin auth user:", createError)
          return { success: false, message: "Failed to create admin user: " + createError.message }
        }

        // Check if user exists in our users table
        const { data: existingUser, error: existingUserError } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .single()

        // Update the users table with the auth_id
        if (existingUser) {
          const { error: updateError } = await supabase
            .from("users")
            .update({ auth_id: newUser.user.id })
            .eq("email", email)

          if (updateError) {
            console.error("Error updating admin user:", updateError)
          }
        } else {
          // Create user in our users table if it doesn't exist
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

        return { success: true, message: "Admin user created and logged in successfully" }
      }
    }

    // If regular login failed
    if (authError) {
      console.error("Login error:", authError)
      return { success: false, message: "Invalid credentials. Please check your email and password." }
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
      return { success: false, message: "You don't have admin privileges" }
    }

    // Update auth_id if needed
    if (existingUser && (!existingUser.auth_id || existingUser.auth_id !== authData.user.id)) {
      await supabase.from("users").update({ auth_id: authData.user.id }).eq("email", email)
    }

    return { success: true, message: "Login successful" }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Sign out the user
export async function logout() {
  const supabase = createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect("/login")
}

// Reset admin password
export async function resetAdminPassword() {
  try {
    const supabase = createServerSupabaseClient()
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
      return { success: false, message: "Failed to check if user exists" }
    }

    // If user exists, update the password
    if (userData && userData.users && userData.users.length > 0) {
      const userId = userData.users[0].id

      // Update the user's password
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password })

      if (updateError) {
        console.error("Error updating password:", updateError)
        return { success: false, message: "Failed to reset password" }
      }

      return { success: true, message: "Admin password reset successfully" }
    } else {
      return { success: false, message: "Admin user not found" }
    }
  } catch (error) {
    console.error("Error resetting admin password:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Create a test user
export async function createTestUser() {
  try {
    const supabase = createServerSupabaseClient()
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
          return { success: false, message: "Failed to check if user exists" }
        }

        if (userData && userData.users && userData.users.length > 0) {
          const userId = userData.users[0].id

          // Update the user's password
          const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password })

          if (updateError) {
            console.error("Error updating password:", updateError)
            return { success: false, message: "Failed to update test user password" }
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
              return { success: false, message: "Failed to create user record" }
            }
          } else if (!existingUser.is_admin) {
            // Update user to be admin if not already
            const { error: updateError } = await supabase.from("users").update({ is_admin: true }).eq("email", email)

            if (updateError) {
              console.error("Error updating user:", updateError)
            }
          }

          return {
            success: true,
            message: "Test user password updated. Email: test@example.com, Password: testpassword",
          }
        }

        return { success: false, message: "Test user exists but could not be updated" }
      }

      console.error("Error creating auth user:", authError)
      return { success: false, message: "Failed to create test user: " + authError.message }
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
      return { success: false, message: "Failed to create user record" }
    }

    return { success: true, message: "Test user created successfully. Email: test@example.com, Password: testpassword" }
  } catch (error) {
    console.error("Error creating test user:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function requireAdmin() {
  const supabase = createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { data: user, error } = await supabase.from("users").select("*").eq("email", session.user.email).single()

  if (error || !user || !user.is_admin) {
    await supabase.auth.signOut()
    redirect("/login")
  }
}
