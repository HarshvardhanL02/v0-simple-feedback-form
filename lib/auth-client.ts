"use client"

import { createBrowserSupabaseClient } from "./supabase"

// Client-side login function
export async function loginClient(email: string, password: string) {
  try {
    const supabase = createBrowserSupabaseClient()

    // Try to sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

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

    // Force a session refresh to ensure cookies are set properly
    await supabase.auth.refreshSession()

    return { success: true, message: "Login successful", user: authData.user }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Client-side logout function
export async function logoutClient() {
  const supabase = createBrowserSupabaseClient()
  await supabase.auth.signOut()
  window.location.href = "/login"
}

// Client-side create test user function
export async function createTestUserClient() {
  try {
    const supabase = createBrowserSupabaseClient()

    // Call a server endpoint to create the test user
    const response = await fetch("/api/create-test-user", {
      method: "POST",
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error creating test user:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Client-side reset admin password function
export async function resetAdminPasswordClient() {
  try {
    const supabase = createBrowserSupabaseClient()

    // Call a server endpoint to reset the admin password
    const response = await fetch("/api/reset-admin-password", {
      method: "POST",
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error resetting admin password:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Check if user is authenticated and is admin
export async function checkAdminAuth() {
  try {
    const supabase = createBrowserSupabaseClient()

    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { authenticated: false, isAdmin: false }
    }

    // Check if user is an admin
    const { data: user, error } = await supabase.from("users").select("*").eq("email", session.user.email).single()

    if (error || !user || !user.is_admin) {
      return { authenticated: true, isAdmin: false }
    }

    return { authenticated: true, isAdmin: true, user }
  } catch (error) {
    console.error("Auth check error:", error)
    return { authenticated: false, isAdmin: false }
  }
}
