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
    // 항상 명시적인 URL로만 이동 (브라우저 히스토리 사용 안 함)
    if (backUrl) {
      router.push(backUrl)
    }
  }

  return (
    <>
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        본문으로 건너뛰기
      </a>

      <header className="bg-blue-600 text-white p-4 shadow-md" role="banner">
        <div className="container mx-auto">
          <div className="flex items-center">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="min-h-[44px] min-w-[44px] mr-4 hover:bg-blue-700 p-2 rounded transition-colors touch-manipulation focus:ring-2 focus:ring-white focus:outline-none"
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
    </>
  )
}
