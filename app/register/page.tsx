"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Search, ArrowLeft, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [userType, setUserType] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })

  useEffect(() => {
    document.documentElement.classList.add("dark")
    const type = searchParams.get("type")
    if (type === "client" || type === "provider") {
      setUserType(type)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match!")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long!")
      return
    }

    setLoading(true)
    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        console.error("Auth error:", authError)
        setError(authError.message)
        return
      }

      if (!authData.user) {
        setError("Failed to create account")
        return
      }

      // Step 2: Create user record - FORCE INSERT
      const userRecord = {
        id: authData.user.id,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        user_type: userType,
        profile_photo: null,
        created_at: new Date().toISOString(),
      }

      const { data: userData, error: userError } = await supabase.from("users").insert(userRecord).select()

      if (userError) {
        console.error("User insert failed:", userError)
        setError(`Failed to create user profile: ${userError.message}`)
        return
      }

      // Step 3: Sign in the user immediately
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) {
        console.error("Auto sign-in failed:", signInError)
        setError("Account created but sign-in failed. Please try logging in manually.")
        return
      }

      setSuccess("Account created successfully! Redirecting...")

      // Step 4: Redirect based on user type
      setTimeout(() => {
        if (userType === "provider") {
          router.push("/provider/setup")
        } else {
          router.push("/client/dashboard")
        }
      }, 1500)
    } catch (error: any) {
      console.error("Registration failed:", error)
      setError(`Registration failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-orange-400 hover:text-orange-300 mb-6 transition-colors"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-white mb-4">Join ClickWork</h1>
            <p className="text-gray-400 text-lg">Choose how you want to get started</p>
          </div>

          <div className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-800 hover:border-orange-500/50 transition-all duration-300 shadow-dark hover:shadow-glow cursor-pointer">
              <Link href="/register?type=client">
                <CardHeader className="text-center p-8">
                  <Search className="h-16 w-16 text-orange-400 mx-auto mb-6" />
                  <CardTitle className="text-white text-2xl mb-3">I'm a Client</CardTitle>
                  <CardDescription className="text-gray-400 text-base leading-relaxed">
                    Looking for talented professionals to bring my projects to life
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 hover:border-orange-500/50 transition-all duration-300 shadow-dark hover:shadow-glow cursor-pointer">
              <Link href="/register?type=provider">
                <CardHeader className="text-center p-8">
                  <Users className="h-16 w-16 text-orange-400 mx-auto mb-6" />
                  <CardTitle className="text-white text-2xl mb-3">I'm a Service Provider</CardTitle>
                  <CardDescription className="text-gray-400 text-base leading-relaxed">
                    Ready to showcase my skills and work with amazing clients
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/50 border-gray-800 shadow-dark">
        <CardHeader className="text-center">
          <Link
            href="/register"
            className="inline-flex items-center text-orange-400 hover:text-orange-300 mb-4 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
          <div className="flex items-center justify-center mb-4">
            {userType === "client" ? (
              <Search className="h-12 w-12 text-orange-400" />
            ) : (
              <Users className="h-12 w-12 text-orange-400" />
            )}
          </div>
          <CardTitle className="text-2xl text-white">
            {userType === "client" ? "Client Registration" : "Service Provider Registration"}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {userType === "client"
              ? "Create your account to find amazing service providers"
              : "Create your account to start offering your services"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-6 bg-red-500/10 border-red-500/20 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-green-500/10 border-green-500/20 text-green-400">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-gray-300">
                  First Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="firstName"
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-gray-300">
                  Last Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="lastName"
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Password (min. 6 characters)
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="password"
                  type="password"
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="confirmPassword"
                  type="password"
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
              />
              <Label htmlFor="terms" className="text-sm text-gray-400">
                I agree to the{" "}
                <Link href="/terms" className="text-orange-400 hover:text-orange-300">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-orange-400 hover:text-orange-300">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              disabled={!formData.agreeToTerms || loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
