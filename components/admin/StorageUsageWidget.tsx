/**
 * LocalStorage 사용량 표시 위젯 (Phase 10)
 */

import React, { useEffect, useState } from 'react'
import {
  getLocalStorageUsage,
  formatBytes,
  isStorageNearLimit,
} from '@/lib/storage-error-handler'

export default function StorageUsageWidget() {
  const [usage, setUsage] = useState({
    used: 0,
    total: 0,
    percentage: 0,
  })
  const [nearLimit, setNearLimit] = useState(false)

  useEffect(() => {
    const updateUsage = () => {
      const currentUsage = getLocalStorageUsage()
      setUsage(currentUsage)
      setNearLimit(isStorageNearLimit())
    }

    updateUsage()
    // 10초마다 업데이트
    const interval = setInterval(updateUsage, 10000)

    return () => clearInterval(interval)
  }, [])

  const getProgressColor = () => {
    if (usage.percentage >= 80) return 'bg-red-600'
    if (usage.percentage >= 60) return 'bg-yellow-500'
    return 'bg-green-600'
  }

  const getTextColor = () => {
    if (usage.percentage >= 80) return 'text-red-700'
    if (usage.percentage >= 60) return 'text-yellow-700'
    return 'text-green-700'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          저장소 사용량
        </h3>
        {nearLimit && (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            주의 필요
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(usage.percentage, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className={`font-medium ${getTextColor()}`}>
            {usage.percentage}% 사용 중
          </span>
          <span className="text-gray-600">
            {formatBytes(usage.used)} / {formatBytes(usage.total)}
          </span>
        </div>

        {nearLimit && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>경고:</strong> 저장 공간이 부족합니다. 오래된 데이터나
              로그를 정리하는 것을 권장합니다.
            </p>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          <p>• 저장소가 가득 차면 새로운 서명을 저장할 수 없습니다.</p>
          <p>• 80% 이상 사용 시 오래된 데이터 정리를 권장합니다.</p>
        </div>
      </div>
    </div>
  )
}
