"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RefreshCw, CheckCircle, XCircle } from "lucide-react"

interface CaptchaProps {
  onVerify: (verified: boolean) => void
}

export function Captcha({ onVerify }: CaptchaProps) {
  const [num1, setNum1] = useState(0)
  const [num2, setNum2] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [showError, setShowError] = useState(false)

  const generateNewProblem = () => {
    setNum1(Math.floor(Math.random() * 10) + 1)
    setNum2(Math.floor(Math.random() * 10) + 1)
    setUserAnswer("")
    setShowError(false)
    setIsVerified(false)
    onVerify(false)
  }

  useEffect(() => {
    generateNewProblem()
  }, [])

  const checkAnswer = () => {
    const correctAnswer = num1 + num2
    const userNum = Number.parseInt(userAnswer)

    if (userNum === correctAnswer) {
      setIsVerified(true)
      setShowError(false)
      onVerify(true)
    } else {
      setShowError(true)
      setIsVerified(false)
      onVerify(false)
      setTimeout(() => {
        generateNewProblem()
      }, 1500)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && userAnswer && !isVerified) {
      checkAnswer()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-3 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center space-x-2 text-white">
          <span className="text-lg font-mono">{num1}</span>
          <span className="text-lg">+</span>
          <span className="text-lg font-mono">{num2}</span>
          <span className="text-lg">=</span>
        </div>

        <Input
          type="number"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="?"
          className="w-16 text-center bg-gray-700 border-gray-600 text-white"
          disabled={isVerified}
        />

        <Button
          type="button"
          onClick={checkAnswer}
          disabled={!userAnswer || isVerified}
          size="sm"
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          Check
        </Button>

        <Button
          type="button"
          onClick={generateNewProblem}
          size="sm"
          variant="ghost"
          className="text-gray-400 hover:text-gray-300"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {isVerified && (
        <div className="flex items-center space-x-2 text-green-400 text-sm">
          <CheckCircle className="h-4 w-4" />
          <span>CAPTCHA verified successfully!</span>
        </div>
      )}

      {showError && (
        <div className="flex items-center space-x-2 text-red-400 text-sm">
          <XCircle className="h-4 w-4" />
          <span>Incorrect answer. Generating new problem...</span>
        </div>
      )}
    </div>
  )
}
