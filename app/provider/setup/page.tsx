"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, X, MapPin, Phone, Mail, Globe } from "lucide-react"
import { supabase } from "@/lib/supabase"

const serviceCategories = [
  "Web Development",
  "Mobile App Development",
  "UI/UX Design",
  "Graphic Design",
  "Digital Marketing",
  "Content Writing",
  "SEO Services",
  "Social Media Management",
  "Video Editing",
  "Photography",
  "Translation Services",
  "Virtual Assistant",
  "Data Entry",
  "Accounting & Finance",
  "Legal Services",
  "Consulting",
  "Other",
]

export default function ProviderSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4
  const [formData, setFormData] = useState({
    // Contact Information
    phone: "",
    email: "",
    website: "",

    // Location
    city: "",
    streetName: "",
    zipCode: "",
    country: "",

    // Business Information
    brandName: "",
    businessType: "", // individual or group
    description: "",

    // Services & Experience
    selectedServices: [] as string[],
    yearsOfExperience: "",
    hourlyRate: "",

    // Portfolio
    portfolioLinks: [""],

    // Additional Information
    languages: [] as string[],
    availability: "",
    certifications: "",
  })

  useEffect(() => {
    document.documentElement.classList.add("dark")

    // Check if user is authenticated
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login?message=Please sign in to complete your profile setup.")
        return
      }
    }

    checkAuth()
  }, [router])

  const handleServiceToggle = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(service)
        ? prev.selectedServices.filter((s) => s !== service)
        : [...prev.selectedServices, service],
    }))
  }

  const addPortfolioLink = () => {
    setFormData((prev) => ({
      ...prev,
      portfolioLinks: [...prev.portfolioLinks, ""],
    }))
  }

  const removePortfolioLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.filter((_, i) => i !== index),
    }))
  }

  const updatePortfolioLink = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.map((link, i) => (i === index ? value : link)),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get current user with better error handling
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error("Auth error:", userError)
        throw new Error("Authentication error. Please sign in again.")
      }

      if (!user) {
        throw new Error("No authenticated user found. Please sign in.")
      }

      console.log("User found:", user.id)

      // Get coordinates for the location (you can use a geocoding service)
      let coordinates = { latitude: 0, longitude: 0 }
      try {
        const geocodeResponse = await fetch(
          `https://api.bigdatacloud.net/data/geocode-city?city=${formData.city}&country=${formData.country}`,
        )
        const geocodeData = await geocodeResponse.json()
        if (geocodeData.latitude && geocodeData.longitude) {
          coordinates = {
            latitude: geocodeData.latitude,
            longitude: geocodeData.longitude,
          }
        }
      } catch (error) {
        console.error("Geocoding error:", error)
      }

      // Insert service provider data
      const { error } = await supabase.from("service_providers").insert({
        user_id: user.id,
        brand_name: formData.brandName,
        business_type: formData.businessType as "individual" | "group",
        description: formData.description,
        phone: formData.phone,
        website: formData.website,
        city: formData.city,
        street_name: formData.streetName,
        zip_code: formData.zipCode,
        country: formData.country,
        services: formData.selectedServices,
        years_experience: formData.yearsOfExperience,
        hourly_rate: Number.parseFloat(formData.hourlyRate),
        portfolio_links: formData.portfolioLinks.filter((link) => link.trim() !== ""),
        certifications: formData.certifications,
        languages: formData.languages,
        availability: formData.availability,
        location: coordinates,
        rating: 0,
        total_reviews: 0,
      })

      if (error) {
        console.error("Database error:", error)
        throw error
      }

      router.push("/provider/dashboard?message=Profile setup complete!")
    } catch (error: any) {
      console.error("Setup error:", error)
      if (error.message.includes("Authentication") || error.message.includes("sign in")) {
        router.push("/login?message=Please sign in to complete your profile setup.")
      } else {
        alert(`Profile setup failed: ${error.message}. Please try again.`)
      }
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link
            href="/register"
            className="inline-flex items-center text-orange-400 hover:text-orange-300 mb-6 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Complete Your Profile</h1>
          <p className="text-gray-400 text-lg">Help clients find you by completing your service provider profile</p>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>
                Step {currentStep} of {totalSteps}
              </span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-300 shadow-glow"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <>
                <CardHeader>
                  <CardTitle className="text-white text-2xl">Basic Information</CardTitle>
                  <CardDescription className="text-gray-400">Tell us about yourself and your business</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="brandName" className="text-gray-300">
                      Brand/Business Name *
                    </Label>
                    <Input
                      id="brandName"
                      className="bg-gray-800 border-gray-700 text-white"
                      value={formData.brandName}
                      onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                      placeholder="Your business or personal brand name"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-gray-300">Business Type *</Label>
                    <RadioGroup
                      value={formData.businessType}
                      onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div className="flex items-center space-x-2 p-4 border border-gray-700 rounded-lg hover:border-orange-500/50 transition-colors">
                        <RadioGroupItem value="individual" id="individual" />
                        <Label htmlFor="individual" className="text-gray-300">
                          Individual Freelancer
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border border-gray-700 rounded-lg hover:border-orange-500/50 transition-colors">
                        <RadioGroupItem value="group" id="group" />
                        <Label htmlFor="group" className="text-gray-300">
                          Team/Agency
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-300">
                      Professional Description *
                    </Label>
                    <Textarea
                      id="description"
                      className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your expertise, experience, and what makes you unique..."
                      required
                    />
                  </div>
                </CardContent>
              </>
            )}

            {/* Step 2: Contact & Location */}
            {currentStep === 2 && (
              <>
                <CardHeader>
                  <CardTitle className="text-white text-2xl">Contact & Location</CardTitle>
                  <CardDescription className="text-gray-400">
                    How can clients reach you and where are you located?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-300">
                        Phone Number *
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="phone"
                          className="pl-10 bg-gray-800 border-gray-700 text-white"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+1 (555) 123-4567"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300">
                        Email Address *
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="email"
                          type="email"
                          className="pl-10 bg-gray-800 border-gray-700 text-white"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-gray-300">
                      Website/Portfolio URL
                    </Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="website"
                        className="pl-10 bg-gray-800 border-gray-700 text-white"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-gray-300">
                        City *
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="city"
                          className="pl-10 bg-gray-800 border-gray-700 text-white"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="New York"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-gray-300">
                        Country *
                      </Label>
                      <Input
                        id="country"
                        className="bg-gray-800 border-gray-700 text-white"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        placeholder="United States"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="streetName" className="text-gray-300">
                        Street/Area Name
                      </Label>
                      <Input
                        id="streetName"
                        className="bg-gray-800 border-gray-700 text-white"
                        value={formData.streetName}
                        onChange={(e) => setFormData({ ...formData, streetName: e.target.value })}
                        placeholder="Manhattan, Downtown, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode" className="text-gray-300">
                        ZIP/Postal Code
                      </Label>
                      <Input
                        id="zipCode"
                        className="bg-gray-800 border-gray-700 text-white"
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        placeholder="10001"
                      />
                    </div>
                  </div>
                </CardContent>
              </>
            )}

            {/* Step 3: Services & Experience */}
            {currentStep === 3 && (
              <>
                <CardHeader>
                  <CardTitle className="text-white text-2xl">Services & Experience</CardTitle>
                  <CardDescription className="text-gray-400">
                    What services do you offer and what's your experience level?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-gray-300">Services You Provide * (Select all that apply)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-4 border border-gray-700 rounded-lg">
                      {serviceCategories.map((service) => (
                        <div key={service} className="flex items-center space-x-2">
                          <Checkbox
                            id={service}
                            checked={formData.selectedServices.includes(service)}
                            onCheckedChange={() => handleServiceToggle(service)}
                          />
                          <Label htmlFor={service} className="text-sm text-gray-300">
                            {service}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {formData.selectedServices.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.selectedServices.map((service) => (
                          <Badge
                            key={service}
                            variant="secondary"
                            className="bg-orange-500/20 text-orange-400 border-orange-500/30"
                          >
                            {service}
                            <button
                              type="button"
                              onClick={() => handleServiceToggle(service)}
                              className="ml-2 hover:text-red-400"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience" className="text-gray-300">
                        Years of Experience *
                      </Label>
                      <Select
                        value={formData.yearsOfExperience}
                        onValueChange={(value) => setFormData({ ...formData, yearsOfExperience: value })}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="0-1">Less than 1 year</SelectItem>
                          <SelectItem value="1-2">1-2 years</SelectItem>
                          <SelectItem value="3-5">3-5 years</SelectItem>
                          <SelectItem value="6-10">6-10 years</SelectItem>
                          <SelectItem value="10+">10+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate" className="text-gray-300">
                        Hourly Rate (USD) *
                      </Label>
                      <Input
                        id="hourlyRate"
                        className="bg-gray-800 border-gray-700 text-white"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                        placeholder="50"
                        type="number"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availability" className="text-gray-300">
                      Availability
                    </Label>
                    <Select
                      value={formData.availability}
                      onValueChange={(value) => setFormData({ ...formData, availability: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select your availability" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="full-time">Full-time (40+ hours/week)</SelectItem>
                        <SelectItem value="part-time">Part-time (20-40 hours/week)</SelectItem>
                        <SelectItem value="project-based">Project-based</SelectItem>
                        <SelectItem value="weekends">Weekends only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </>
            )}

            {/* Step 4: Portfolio & Additional Info */}
            {currentStep === 4 && (
              <>
                <CardHeader>
                  <CardTitle className="text-white text-2xl">Portfolio & Additional Information</CardTitle>
                  <CardDescription className="text-gray-400">
                    Showcase your work and add any additional details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-gray-300">Portfolio Links</Label>
                    {formData.portfolioLinks.map((link, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          className="bg-gray-800 border-gray-700 text-white"
                          value={link}
                          onChange={(e) => updatePortfolioLink(index, e.target.value)}
                          placeholder="https://example.com/portfolio"
                        />
                        {formData.portfolioLinks.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="border-gray-700 text-gray-400 hover:bg-gray-800"
                            onClick={() => removePortfolioLink(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addPortfolioLink}
                      className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Another Portfolio Link
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="certifications" className="text-gray-300">
                      Certifications & Qualifications
                    </Label>
                    <Textarea
                      id="certifications"
                      className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                      value={formData.certifications}
                      onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                      placeholder="List any relevant certifications, degrees, or qualifications..."
                    />
                  </div>
                </CardContent>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between p-6 border-t border-gray-800">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  {loading ? "Setting up..." : "Complete Profile"}
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
