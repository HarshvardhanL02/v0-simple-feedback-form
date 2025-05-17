import { createClient } from "@supabase/supabase-js"

// Create a singleton client for the browser
let clientInstance: ReturnType<typeof createClient> | null = null

export const createBrowserSupabaseClient = () => {
  if (clientInstance) return clientInstance

  // ✅ Step 2 Debugging: Check if environment variables are loaded
  console.log("✅ SUPABASE URL (Browser):", process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log("✅ SUPABASE KEY (Browser):", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Missing Supabase environment variables in browser client")
    throw new Error("Missing Supabase environment variables")
  }

  console.log("🚀 Creating new Supabase browser client with URL:", supabaseUrl)

  clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "supabase-auth-token",
    },
  })

  return clientInstance
}

// This function should only be used in API routes in the pages/ directory
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Optional: Add server-side debugging logs too
  console.log("✅ SUPABASE URL (Server):", supabaseUrl)
  console.log("✅ SUPABASE KEY (Server):", supabaseKey?.substring(0, 10) + "...")

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase environment variables in server client")
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseKey)
}
