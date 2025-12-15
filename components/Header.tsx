import React from 'react'
import { useRouter } from 'next/router'

interface HeaderProps {
  title: string
  showBackButton?: boolean
  backUrl?: string
}

export default function Header({ title, showBackButton = false, backUrl }: HeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl)
    } else {
      router.back()
    }
  }

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto">
        <div className="flex items-center">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="mr-4 hover:bg-blue-700 p-2 rounded transition-colors"
              aria-label="뒤로가기"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
      </div>
    </header>
  )
}
