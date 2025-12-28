'use client'

import { useEffect, useState } from 'react'

interface LoadingSpinnerProps {
  message?: string
  showProgress?: boolean
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  showProgress = true,
  size = 'md',
  fullScreen = false
}: LoadingSpinnerProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!showProgress) return

    // Simulate progress from 0 to 90%
    // The remaining 10% will complete when loading finishes
    let currentProgress = 0
    const interval = setInterval(() => {
      if (currentProgress < 90) {
        // Increment faster at the beginning, slower as we approach 90%
        const increment = currentProgress < 50 ? 5 : currentProgress < 80 ? 2 : 1
        currentProgress = Math.min(currentProgress + increment, 90)
        setProgress(currentProgress)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [showProgress])

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  }

  const containerClasses = fullScreen 
    ? 'fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50'
    : 'flex flex-col items-center justify-center'

  const heightClass = fullScreen ? 'h-screen' : 'h-64'

  return (
    <div className={`${containerClasses} ${heightClass}`}>
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Spinner */}
        <div className="relative">
          <div
            className={`${sizeClasses[size]} border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin`}
          />
          {showProgress && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                {progress}%
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-64 space-y-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </div>
        )}

        {/* Simple message if no progress */}
        {!showProgress && (
          <p className="text-gray-500 dark:text-gray-400">{message}</p>
        )}
      </div>
    </div>
  )
}

