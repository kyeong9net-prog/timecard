/**
 * 동기화 상태 표시 컴포넌트
 * 동기화 진행 중, 완료, 실패 상태를 Toast 스타일로 표시합니다.
 */

import { useAutoSync } from '@/hooks/useAutoSync'
import { getFailedOfflineSignatures } from '@/lib/offline-storage-utils'

export default function SyncStatusIndicator() {
  const { isSyncing, syncResult, hasCompleted, retrySync } = useAutoSync()
  const failedCount = getFailedOfflineSignatures().length

  // 동기화 진행 중
  if (isSyncing) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3">
          <svg
            className="animate-spin h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <div>
            <p className="font-semibold">동기화 중...</p>
            {syncResult && (
              <p className="text-sm opacity-90">
                {syncResult.success + syncResult.failed + syncResult.conflicts}/{syncResult.total}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 동기화 완료
  if (hasCompleted && syncResult) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-semibold">동기화 완료</p>
              <p className="text-sm opacity-90">
                성공: {syncResult.success}건
                {syncResult.conflicts > 0 && ` / 충돌: ${syncResult.conflicts}건`}
                {syncResult.failed > 0 && ` / 실패: ${syncResult.failed}건`}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 동기화 실패 건수 표시
  if (failedCount > 0) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="font-semibold">동기화 실패 {failedCount}건</p>
              <p className="text-sm opacity-90">네트워크 상태를 확인하세요</p>
            </div>
            <button
              onClick={retrySync}
              className="ml-4 px-4 py-2 bg-white text-red-500 rounded font-medium hover:bg-red-50 transition-colors"
            >
              재시도
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
