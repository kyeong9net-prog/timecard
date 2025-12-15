/**
 * 오프라인 상태 관리 Context
 * navigator.onLine을 기반으로 네트워크 상태를 감지하고 전역으로 제공합니다.
 */

import React, { createContext, useContext, useState, useEffect } from 'react'

interface OfflineContextType {
  isOffline: boolean
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState<boolean>(false)

  useEffect(() => {
    // SSR 체크
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return
    }

    // 초기 상태 설정
    setIsOffline(!navigator.onLine)

    // 온라인 상태 변경 이벤트 리스너
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 정리 함수
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <OfflineContext.Provider value={{ isOffline }}>
      {children}
    </OfflineContext.Provider>
  )
}

export function useOffline() {
  const context = useContext(OfflineContext)
  if (context === undefined) {
    throw new Error('useOffline must be used within OfflineProvider')
  }
  return context
}
