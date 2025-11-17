'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, User, Phone, Eye, EyeOff, Check } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const passwordRequirements = [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(formData.password) },
    { label: 'Contains number', met: /[0-9]/.test(formData.password) },
  ]

  const passwordsMatch = formData.password === formData.confirmPassword && formData.password !== ''

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions')
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match')
      return
    }

    const allRequirementsMet = passwordRequirements.every((req) => req.met)
    if (!allRequirementsMet) {
      setError('Password does not meet all requirements')
      return
    }

      setIsLoading(true)
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Signup failed')
          return
        }

        window.location.href = '/login?success=Account created successfully'
      } catch (err) {
        setError('Signup failed. Please try again.')
        console.error('Signup error:', err)
      } finally {
        setIsLoading(false)
      }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-purple-50">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-1 sm:mb-2">Create Account</h1>
            <p className="text-sm sm:text-base text-gray-600">Join and start shopping</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-purple-400" />
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:bg-purple-50 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-purple-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:bg-purple-50 transition-all duration-200"
                    />
                  </div>
                </div>


                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-purple-400" />
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:bg-purple-50 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>


              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-purple-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:bg-purple-50 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-purple-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>


                {formData.password && (
                  <div className="mt-4 space-y-2">
                    {passwordRequirements.map((req) => (
                      <div
                        key={req.label}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                            req.met
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {req.met ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <span>•</span>
                          )}
                        </div>
                        <span
                          className={req.met ? 'text-green-700' : 'text-gray-600'}
                        >
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>


              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-purple-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className={`w-full pl-10 pr-12 py-3 border-2 rounded-lg focus:outline-none transition-all duration-200 ${
                      formData.confirmPassword
                        ? passwordsMatch
                          ? 'border-green-300 focus:border-green-500 focus:bg-green-50'
                          : 'border-red-300 focus:border-red-500 focus:bg-red-50'
                        : 'border-gray-200 focus:border-purple-500 focus:bg-purple-50'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-purple-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && !passwordsMatch && (
                  <p className="text-red-600 text-sm mt-1">Passwords do not match</p>
                )}
              </div>


              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-5 h-5 mt-1 border-2 border-gray-300 rounded text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                />
                <span className="text-sm text-gray-600">
                  I agree to the{' '}
                  <Link href="#" className="text-purple-600 hover:text-purple-700 font-semibold transition-colors">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="#" className="text-purple-600 hover:text-purple-700 font-semibold transition-colors">
                    Privacy Policy
                  </Link>
                </span>
              </label>


              <Button
                type="submit"
                variant="primary"
                size="medium"
                fullWidth
                disabled={isLoading || !agreedToTerms}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>


            <div className="flex items-center space-x-3">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="text-sm text-gray-500">OR</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>


            <div className="space-y-3">
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm font-medium text-gray-700">Sign up with Google</span>
              </button>

              <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-sm font-medium text-gray-700">Sign up with Facebook</span>
              </button>
            </div>
          </div>


          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
