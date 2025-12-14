import React from 'react'
import { ClassPeriod } from '@/types'

interface ClassPeriodSelectorProps {
  periods: ClassPeriod[]
  selectedPeriodId: string | null
  onSelect: (periodId: string) => void
}

export default function ClassPeriodSelector({
  periods,
  selectedPeriodId,
  onSelect,
}: ClassPeriodSelectorProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        교시 선택
      </label>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {periods.map((period) => (
          <button
            key={period.id}
            onClick={() => onSelect(period.id)}
            className={`p-4 border-2 rounded-lg transition-all duration-200 ${
              selectedPeriodId === period.id
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
          </button>
        ))}
      </div>

      {!selectedPeriodId && (
        <p className="text-sm text-gray-500 mt-3">
          서명할 교시를 선택해주세요
        </p>
      )}
    </div>
  )
}
