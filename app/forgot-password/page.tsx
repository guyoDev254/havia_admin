'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useTheme } from '@/contexts/ThemeContext'

const BACKGROUND_MEDIA = [
  {
    type: 'image',
    url: 'https://res.cloudinary.com/dymlg8elg/image/upload/v1748800732/freepik__the-style-is-candid-image-photography-with-natural__98766_r9fvft.jpg',
  },
  {
    type: 'image',
    url: 'https://res.cloudinary.com/dymlg8elg/image/upload/v1748800732/freepik__the-style-is-candid-image-photography-with-natural__98767_g7nhan.jpg',
  },
  {
    type: 'video',
    url: 'https://res.cloudinary.com/dymlg8elg/video/upload/v1692039405/samples/elephants.mp4',
  },
]

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const router = useRouter()
  const { isDark, theme } = useTheme()

  // Carousel auto-scroll effect - 2 second interval
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % BACKGROUND_MEDIA.length)
    }, 2000) // 2 seconds

    return () => clearInterval(interval)
  }, [])

  // Observe system theme changes
  useEffect(() => {
    if (theme === 'auto' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleChange = (e: MediaQueryListEvent) => {
        // Theme will be updated automatically by ThemeContext
        console.log('System theme changed to:', e.matches ? 'dark' : 'light')
      }

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
      }
      // Fallback for older browsers
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange)
        return () => mediaQuery.removeListener(handleChange)
      }
    }
  }, [theme])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/auth/forgot-password', { email })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background Carousel */}
        <div className="absolute inset-0 w-full h-full">
          {BACKGROUND_MEDIA.map((media, index) => (
            <div
              key={index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
                index === currentIndex ? 'opacity-100 z-0' : 'opacity-0 z-0'
              }`}
            >
              {media.type === 'image' ? (
                <img
                  src={media.url}
                  alt={`Background ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={media.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ))}
          {/* Dynamic overlay */}
          <div className={`absolute inset-0 z-0 transition-opacity duration-300 ${
            isDark ? 'bg-black/30' : 'bg-black/50'
          }`} />
        </div>

        {/* Success Content */}
        <div className="relative z-10 max-w-md w-full space-y-8 p-8">
          {/* Logo */}
          <div className="text-center">
            <div className="mx-auto w-20 h-20 flex items-center justify-center shadow-xl mb-6">
              <img 
                src="https://res.cloudinary.com/dymlg8elg/image/upload/v1739814594/NB-2-removebg-preview_dbo2fa_x51efp.png" 
                alt="NorthernBox Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className={`rounded-2xl shadow-2xl p-8 border transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-800/95 border-gray-700 backdrop-blur-sm' 
              : 'bg-white border-gray-100'
          }`}>
            <div className={`border-2 px-4 py-3 rounded-xl transition-colors duration-300 ${
              isDark 
                ? 'bg-green-900/30 border-green-700 text-green-300' 
                : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              <p className="font-medium">Email sent!</p>
              <p className={`text-sm mt-1 transition-colors duration-300 ${
                isDark ? 'text-green-300' : 'text-green-700'
              }`}>
                If an account exists with this email, a password reset link has been sent.
              </p>
            </div>
            <Link
              href="/login"
              className={`block text-center mt-6 font-medium text-sm underline transition-colors duration-300 ${
                isDark 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              Back to Login
            </Link>
          </div>

          {/* Footer */}
          <p className={`text-center text-xs drop-shadow-sm transition-colors duration-300 ${
            isDark ? 'text-white/60' : 'text-white/70'
          }`}>
            © 2025 NorthernBox. All rights reserved.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Carousel */}
      <div className="absolute inset-0 w-full h-full">
        {BACKGROUND_MEDIA.map((media, index) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
              index === currentIndex ? 'opacity-100 z-0' : 'opacity-0 z-0'
            }`}
          >
            {media.type === 'image' ? (
              <img
                src={media.url}
                alt={`Background ${index + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={media.url}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ))}
        {/* Dynamic overlay - darker in light mode, lighter in dark mode for better contrast */}
        <div className={`absolute inset-0 z-0 transition-opacity duration-300 ${
          isDark ? 'bg-black/30' : 'bg-black/50'
        }`} />
      </div>

      {/* Login Content */}
      <div className="relative z-10 max-w-md w-full space-y-8 p-8">
        {/* Logo/Header Section */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 flex items-center justify-center shadow-xl mb-6">
            <img 
              src="https://res.cloudinary.com/dymlg8elg/image/upload/v1739814594/NB-2-removebg-preview_dbo2fa_x51efp.png" 
              alt="NorthernBox Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className={`text-4xl font-extrabold bg-clip-text text-transparent drop-shadow-lg transition-colors duration-300 ${
            isDark 
              ? 'bg-gradient-to-r from-blue-300 to-purple-300' 
              : 'bg-gradient-to-r from-blue-400 to-purple-400'
          }`}>
            Forgot Password?
          </h2>
          <p className={`mt-2 text-center text-sm drop-shadow-md transition-colors duration-300 ${
            isDark ? 'text-white/80' : 'text-white/90'
          }`}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Form Card */}
        <div className={`rounded-2xl shadow-2xl p-8 border transition-colors duration-300 ${
          isDark 
            ? 'bg-gray-800/95 border-gray-700 backdrop-blur-sm' 
            : 'bg-white border-gray-100'
        }`}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className={`border-2 px-4 py-3 rounded-xl flex items-center gap-2 transition-colors duration-300 ${
                isDark 
                  ? 'bg-red-900/30 border-red-700 text-red-300' 
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`appearance-none relative block w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  isDark
                    ? 'border-gray-600 bg-gray-700/50 text-white placeholder-gray-400'
                    : 'border-gray-200 placeholder-gray-400 text-gray-900'
                }`}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className={`text-sm font-medium transition-colors underline ${
                  isDark 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                Back to Login
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className={`text-center text-xs drop-shadow-sm transition-colors duration-300 ${
          isDark ? 'text-white/60' : 'text-white/70'
        }`}>
          © 2025 NorthernBox. All rights reserved.
        </p>
      </div>
    </div>
  )
}

