import { createClient } from "@supabase/supabase-js"

// Get environment variables with better error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables!")
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "SET" : "MISSING")
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "SET" : "MISSING")
}

// Create fallback values for development (you should replace these with your actual values)
const fallbackUrl = "https://your-project.supabase.co"
const fallbackKey = "your-anon-key"

// Create Supabase client with production-ready configuration
export const supabase = createClient(supabaseUrl || fallbackUrl, supabaseAnonKey || fallbackKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
  global: {
    headers: {
      "X-Client-Info": "clickwork-app",
    },
  },
  db: {
    schema: "public",
  },
})

// Helper function to safely get user
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) {
      console.warn("Auth error:", error.message)
      return null
    }
    return user
  } catch (error) {
    console.warn("Failed to get user:", error)
    return null
  }
}

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const user = await getCurrentUser()
  return !!user
}

// Helper function to test connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from("users").select("count").limit(1)
    if (error) {
      console.error("Connection test failed:", error)
      return false
    }
    console.log("Supabase connection successful!")
    return true
  } catch (error) {
    console.error("Connection test error:", error)
    return false
  }
}

// Types for our database
export interface User {
  id: string
  email: string
  user_type: "client" | "provider"
  first_name: string
  last_name: string
  created_at: string
  location?: {
    latitude: number
    longitude: number
    city: string
    country: string
  }
}

export interface ServiceProvider {
  id: string
  user_id: string
  brand_name: string
  business_type: "individual" | "group"
  description: string
  phone: string
  website?: string
  city: string
  street_name?: string
  zip_code?: string
  country: string
  services: string[]
  years_experience: string
  hourly_rate: number
  portfolio_links: string[]
  certifications?: string
  languages: string[]
  availability: string
  rating: number
  total_reviews: number
  location: {
    latitude: number
    longitude: number
  }
  created_at: string
}

export interface Request {
  id: string
  client_id: string
  provider_id: string
  title: string
  description: string
  budget: number
  deadline: string
  status: "pending" | "accepted" | "rejected" | "in_progress" | "completed"
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
}
