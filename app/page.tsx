"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Users, Star, Shield, Zap, Globe, ArrowRight, CheckCircle, MessageSquare } from "lucide-react"

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      setMounted(true)
      // Safely set dark mode
      if (typeof window !== "undefined" && document) {
        document.documentElement.classList.add("dark")
      }
    } catch (error) {
      console.error("Error in useEffect:", error)
      setMounted(true) // Still set mounted to show the page
    }
  }, [])

  // Show loading state while mounting
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">CW</span>
            </div>
            <span className="text-2xl font-bold text-white">ClickWork</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-300 hover:text-orange-400 transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-gray-300 hover:text-orange-400 transition-colors">
              How It Works
            </Link>
            <Link href="/about" className="text-gray-300 hover:text-orange-400 transition-colors">
              About Us
            </Link>
            <Link href="/login" className="text-gray-300 hover:text-orange-400 transition-colors">
              Sign In
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent"></div>
        <div className="container mx-auto text-center relative z-10">
          <Badge className="mb-6 bg-orange-500/20 text-orange-400 border-orange-500/30">
            🚀 Launch Your Freelance Career Today
          </Badge>
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Connect. Create.
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 block">
              Get Paid.
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            The ultimate platform connecting talented freelancers with clients worldwide. Find your next project or
            discover the perfect professional for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/register?type=client">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-lg px-8 py-4"
              >
                <Search className="mr-3 h-6 w-6" />
                Find Talent
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
            <Link href="/register?type=provider">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white text-lg px-8 py-4"
              >
                <Users className="mr-3 h-6 w-6" />
                Start Freelancing
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-black/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "500+", label: "Skilled Professionals" },
              { number: "200+", label: "Satisfied Clients" },
              { number: "1K+", label: "Projects Delivered" },
              { number: "New", label: "Platform Launch" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-orange-400 mb-2">{stat.number}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose <span className="text-orange-400">ClickWork</span>?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience the future of freelancing with our cutting-edge platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Verified Professionals",
                description: "Every freelancer is thoroughly vetted with verified skills and portfolio reviews",
                color: "text-blue-400",
              },
              {
                icon: Zap,
                title: "Lightning Fast Matching",
                description: "AI-powered matching system connects you with the perfect freelancer in minutes",
                color: "text-yellow-400",
              },
              {
                icon: Globe,
                title: "Country Scale",
                description: "Access talent from across the nation or find local professionals in your area",
                color: "text-green-400",
              },
              {
                icon: Star,
                title: "Quality Guaranteed",
                description: "Comprehensive rating system and money-back guarantee ensure top-quality work",
                color: "text-purple-400",
              },
              {
                icon: MessageSquare,
                title: "Real-time Communication",
                description: "Built-in messaging system keeps you connected throughout your project",
                color: "text-pink-400",
              },
              {
                icon: CheckCircle,
                title: "Secure Payments",
                description: "Escrow system protects both clients and freelancers with secure transactions",
                color: "text-orange-400",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="bg-gray-900/50 border-gray-800 hover:border-orange-500/50 transition-all duration-300"
              >
                <CardHeader>
                  <feature.icon className={`h-12 w-12 ${feature.color} mb-4`} />
                  <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-400 text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-gradient-to-r from-gray-900/50 to-black/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">How It Works</h2>
            <p className="text-xl text-gray-300">Get started in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Create Your Profile",
                description: "Sign up and create a detailed profile showcasing your skills or project needs",
              },
              {
                step: "02",
                title: "Connect & Collaborate",
                description: "Browse, connect, and start collaborating with the perfect match for your project",
              },
              {
                step: "03",
                title: "Get Paid Securely",
                description: "Complete your work and receive payment through our secure escrow system",
              },
            ].map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-6 mx-auto">
                  {step.step}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                <p className="text-gray-400 text-lg leading-relaxed">{step.description}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-orange-500 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-500/20 to-orange-600/20">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Career?</h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join hundreds of successful freelancers and clients who trust ClickWork
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-xl px-12 py-6"
            >
              Start Your Journey Today
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">CW</span>
                </div>
                <span className="text-2xl font-bold text-white">ClickWork</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Connecting talent with opportunity across the nation. Your success is our mission.
              </p>
            </div>

            {[
              {
                title: "For Clients",
                links: [
                  { name: "Find Freelancers", href: "/register?type=client" },
                  { name: "Post a Project", href: "/register?type=client" },
                  { name: "How It Works", href: "#how-it-works" },
                  { name: "About Us", href: "/about" },
                ],
              },
              {
                title: "For Freelancers",
                links: [
                  { name: "Find Work", href: "/register?type=provider" },
                  { name: "Create Profile", href: "/register?type=provider" },
                  { name: "Resources", href: "/about" },
                  { name: "Community", href: "/about" },
                ],
              },
              {
                title: "Support",
                links: [
                  { name: "Help Center", href: "/about" },
                  { name: "Contact Us", href: "/about" },
                  { name: "Terms of Service", href: "/terms" },
                  { name: "Privacy Policy", href: "/privacy" },
                ],
              },
            ].map((section, index) => (
              <div key={index}>
                <h3 className="font-semibold text-white mb-4 text-lg">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link href={link.href} className="text-gray-400 hover:text-orange-400 transition-colors">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">
              &copy; 2025 ClickWork. All rights reserved. Built with ❤️ for the freelance community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
