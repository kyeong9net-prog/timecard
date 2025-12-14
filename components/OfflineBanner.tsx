/**
 * 오프라인 배너 컴포넌트
 * 네트워크가 단절되었을 때 화면 상단에 표시됩니다.
 */

import { useOffline } from '@/contexts/OfflineContext'

export default function OfflineBanner() {
  const { isOffline } = useOffline()

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span className="font-medium">오프라인 모드입니다. 서명은 임시 저장되며 네트워크 복구 시 자동으로 동기화됩니다.</span>
      </div>
    </div>
  )
}
