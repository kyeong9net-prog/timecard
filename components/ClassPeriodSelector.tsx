import React from 'react'
import { ClassPeriod } from '@/types'

interface ClassPeriodSelectorProps {
  periods: ClassPeriod[]
  selectedPeriodId: string | null
  onSelect: (periodId: string) => void
  signedPeriodIds?: string[]
  onSignedPeriodClick?: () => void
}

export default function ClassPeriodSelector({
  periods,
  selectedPeriodId,
  onSelect,
  signedPeriodIds = [],
  onSignedPeriodClick,
}: ClassPeriodSelectorProps) {
  const handleKeyDown = (e: React.KeyboardEvent, period: ClassPeriod, isSigned: boolean) => {
    // Enter or Space to select
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (isSigned) {
        onSignedPeriodClick?.()
      } else {
        onSelect(period.id)
      }
    }
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-3" id="period-selector-label">
        교시 선택
      </label>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" role="group" aria-labelledby="period-selector-label">
        {periods.map((period) => {
          const isSigned = signedPeriodIds.includes(period.id)
          const isSelected = selectedPeriodId === period.id

          return (
            <button
              key={period.id}
              type="button"
              onClick={() => {
                if (isSigned) {
                  onSignedPeriodClick?.()
                } else {
                  onSelect(period.id)
                }
              }}
              onKeyDown={(e) => handleKeyDown(e, period, isSigned)}
              disabled={isSigned}
              aria-label={`${period.name} ${period.startTime}부터 ${period.endTime}까지 ${isSigned ? '이미 서명 완료' : isSelected ? '선택됨' : ''}`}
              aria-pressed={isSelected}
              aria-disabled={isSigned}
              className={`min-h-[88px] p-4 border-2 rounded-lg transition-all duration-200 relative touch-manipulation focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                isSigned
                  ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                  : isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-blue-300 hover:shadow'
              }`}
            >
              <div className="text-lg font-semibold text-gray-800">
                {period.name}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {period.startTime} - {period.endTime}
              </div>
              {isSigned && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    ✓ 서명완료
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {!selectedPeriodId && (
        <p className="text-sm text-gray-500 mt-3">
          서명할 교시를 선택해주세요
        </p>
      )}
    </div>
  )
}
