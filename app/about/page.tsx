"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Users, Target, Heart, Shield, Zap, Globe } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About ClickWork</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We are here to provide exceptional client-provider services with the least amount of effort from wherever
            you are. Our platform bridges the gap between talented professionals and clients who need quality work done
            efficiently.
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6 text-orange-600" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              At ClickWork, we believe that finding quality freelance services shouldn't be complicated or
              time-consuming. Our mission is to create a seamless platform where clients can easily connect with skilled
              professionals, and service providers can showcase their talents to reach the right audience. We're
              committed to making freelancing accessible, efficient, and rewarding for everyone involved.
            </p>
          </CardContent>
        </Card>

        {/* What We Do Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6 text-orange-600" />
              What We Do
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">For Clients</h3>
                <p className="text-gray-700 mb-4">
                  We provide a curated marketplace where you can find verified professionals for your projects. From web
                  development to graphic design, content writing to digital marketing - we have experts ready to help
                  you achieve your goals with minimal hassle.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Easy Search</Badge>
                  <Badge variant="secondary">Verified Providers</Badge>
                  <Badge variant="secondary">Secure Payments</Badge>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">For Service Providers</h3>
                <p className="text-gray-700 mb-4">
                  We offer a platform to showcase your skills, connect with potential clients, and build a sustainable
                  freelance business. Our tools help you manage projects, communicate effectively, and grow your
                  professional reputation.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Profile Showcase</Badge>
                  <Badge variant="secondary">Direct Messaging</Badge>
                  <Badge variant="secondary">Review System</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Our Values Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-orange-600" />
              Our Values
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Shield className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Trust & Security</h3>
                <p className="text-gray-600 text-sm">
                  We prioritize the safety and security of all our users through verified profiles and secure
                  transactions.
                </p>
              </div>
              <div className="text-center">
                <Zap className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Efficiency</h3>
                <p className="text-gray-600 text-sm">
                  We streamline the process of finding and hiring freelancers, saving time for both clients and
                  providers.
                </p>
              </div>
              <div className="text-center">
                <Globe className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Accessibility</h3>
                <p className="text-gray-600 text-sm">
                  Our platform is designed to be accessible from anywhere, making remote work opportunities available to
                  all.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Why Choose Us Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Why Choose ClickWork?</CardTitle>
            <CardDescription>
              We're more than just a freelancing platform - we're your partner in success
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium">Location-Based Matching</h4>
                  <p className="text-gray-600 text-sm">
                    Find professionals in your area or work remotely with global talent.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium">Real-Time Communication</h4>
                  <p className="text-gray-600 text-sm">
                    Built-in messaging system with online status indicators for instant communication.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium">Transparent Reviews</h4>
                  <p className="text-gray-600 text-sm">
                    Honest feedback system that helps build trust and maintain quality standards.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium">Simple Request System</h4>
                  <p className="text-gray-600 text-sm">
                    Easy-to-use request system that connects you with the right professionals quickly.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>About Our Company</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed mb-4">
              ClickWork was founded with the vision of simplifying the freelancing experience for everyone. We
              understand the challenges that both clients and service providers face in the digital marketplace, and
              we've built our platform to address these pain points directly.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our team is dedicated to continuously improving the platform based on user feedback and industry trends.
              We believe in the power of technology to connect people and create opportunities, regardless of
              geographical boundaries.
            </p>
            <Separator className="my-4" />
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <strong>Founded:</strong> 2024
              </div>
              <div>
                <strong>Platform Type:</strong> Freelancing Marketplace
              </div>
              <div>
                <strong>Focus:</strong> Client-Provider Services
              </div>
              <div>
                <strong>Coverage:</strong> Country Scale
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-6">
            Join our growing community of professionals and clients who are making work happen with minimal effort.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/register"
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Join as Provider
            </a>
            <a
              href="/register"
              className="border border-orange-600 text-orange-600 px-6 py-3 rounded-lg hover:bg-orange-50 transition-colors"
            >
              Find Services
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
