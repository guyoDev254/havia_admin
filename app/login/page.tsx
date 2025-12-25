'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSweetAlert } from '@/hooks/useSweetAlert'

const BACKGROUND_MEDIA = [
  {
    type: 'image',
    url: 'https://res.cloudinary.com/dabfdxbfj/image/upload/v1686428211/IMG_8631_ndwkt2.jpg',
  },
  {
    type: 'video',
    url: 'https://res.cloudinary.com/dymlg8elg/video/upload/v1766637845/video1_dpj16u.mp4',
  },
  {
    type: 'video',
    url: 'https://res.cloudinary.com/dymlg8elg/video/upload/v1692039405/samples/elephants.mp4',
  },
  {
    type: 'video',
    url: 'https://res.cloudinary.com/dymlg8elg/video/upload/v1766638377/video2_k0l7ly.mp4',
  },
  {
    type: 'video',
    url: 'https://res.cloudinary.com/dymlg8elg/video/upload/v1766638813/video6_kaijl2.mp4',
  },
  {
    type: 'video',
    url: 'https://res.cloudinary.com/dymlg8elg/video/upload/v1766638812/video5_ttgiso.mp4',
  },
  {
    type: 'video',
    url: 'https://res.cloudinary.com/dymlg8elg/video/upload/v1766638813/video7_md9jxz.mp4',
  },
  {
    type: 'video',
    url: 'https://res.cloudinary.com/dymlg8elg/video/upload/v1766638812/video4_gbzckb.mp4',
  },
  {
    type: 'video',
    url: 'https://res.cloudinary.com/dymlg8elg/video/upload/v1766638812/video3_rxtl5e.mp4',
  },
  {
    type: 'video',
    url: 'https://res.cloudinary.com/dymlg8elg/video/upload/v1766638813/video7_md9jxz.mp4',
  },
  {
    type: 'video',
    url: 'https://res.cloudinary.com/dymlg8elg/video/upload/v1766638812/video1_dpj16u.mp4',
  },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const router = useRouter()
  const { login } = useAuth()
  const { isDark, theme } = useTheme()
  const { showError } = useSweetAlert()

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
        // This effect just ensures we're observing changes
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
    setLoading(true)

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      // Extract user-friendly error message
      let errorMessage = 'Login failed. Please try again.'
      
      if (err.response) {
        const status = err.response.status
        const message = err.response?.data?.message || err.response?.data?.error
        
        if (status === 401) {
          errorMessage = 'Invalid email or password. Please check your credentials.'
        } else if (status === 403) {
          errorMessage = 'Access denied. Please contact an administrator.'
        } else if (status === 429) {
          errorMessage = 'Too many login attempts. Please try again later.'
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again in a few moments.'
        } else if (message) {
          // Use server message if available and it's not too technical
          errorMessage = message.length > 100 ? 'An error occurred. Please try again.' : message
        }
      } else if (err.message) {
        // Network errors or other client-side errors
        if (err.message.includes('Network Error') || err.message.includes('fetch')) {
          errorMessage = 'Connection error. Please check your internet connection.'
        } else if (err.message.length < 100) {
          errorMessage = err.message
        }
      }
      
      showError('Login Failed', errorMessage)
    } finally {
      setLoading(false)
    }
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
            Havia Admin
          </h2>
          <p className={`mt-2 text-center text-sm drop-shadow-md transition-colors duration-300 ${
            isDark ? 'text-white/80' : 'text-white/90'
          }`}>
            Sign in to access the admin panel
          </p>
        </div>

        {/* Login Card */}
        <div className={`rounded-2xl shadow-2xl p-8 border transition-colors duration-300 ${
          isDark 
            ? 'bg-gray-800/95 border-gray-700 backdrop-blur-sm' 
            : 'bg-white border-gray-100'
        }`}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
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
                <label htmlFor="password" className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className={`appearance-none relative block w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      isDark
                        ? 'border-gray-600 bg-gray-700/50 text-white placeholder-gray-400'
                        : 'border-gray-200 placeholder-gray-400 text-gray-900'
                    }`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute inset-y-0 right-0 flex items-center pr-4 focus:outline-none transition-colors duration-300 ${
                      isDark 
                        ? 'text-gray-400 hover:text-gray-300' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
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
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            <div className="text-center mt-4">
              <Link
                href="/forgot-password"
                className={`text-sm font-medium transition-colors underline ${
                  isDark 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                Forgot password?
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

