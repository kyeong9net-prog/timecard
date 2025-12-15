import React, { useState, useEffect } from 'react'

interface TimeTextInputProps {
  value: string
  onChange: (value: string) => void
}

export default function TimeTextInput({ value, onChange }: TimeTextInputProps) {
  const [inputType, setInputType] = useState<'duration' | 'range' | ''>('')
  const [duration, setDuration] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')

  // 시간 범위의 총 시간 계산 (시간과 분 단위)
  const calculateDuration = () => {
    if (!startTime || !endTime) return null

    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)

    const startTotalMinutes = startHour * 60 + startMin
    const endTotalMinutes = endHour * 60 + endMin

    if (endTotalMinutes <= startTotalMinutes) return null

    const diffMinutes = endTotalMinutes - startTotalMinutes
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60

    return { hours, minutes }
  }

  const totalDuration = calculateDuration()

  // Generate time options in 10-minute intervals (08:30 ~ 23:50)
  const timeOptions = Array.from({ length: 93 }, (_, i) => {
    const totalMinutes = 510 + (i * 10) // 510 = 8시간 30분 (8*60 + 30)
    const hour = Math.floor(totalMinutes / 60).toString().padStart(2, '0')
    const minute = (totalMinutes % 60).toString().padStart(2, '0')
    return `${hour}:${minute}`
  })

  // Duration options (1시간 ~ 8시간)
  const durationOptions = Array.from({ length: 8 }, (_, i) => `${i + 1}시간`)

  // Initialize from existing value
  useEffect(() => {
    if (value && !inputType) {
      if (value.includes('-')) {
        // Time range format
        const [start, end] = value.split('-').map((t) => t.trim())
        setInputType('range')
        setStartTime(start)
        setEndTime(end)
      } else if (value.includes('시간')) {
        // Duration format
        setInputType('duration')
        setDuration(value)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update value when duration changes
  useEffect(() => {
    if (inputType === 'duration' && duration) {
      onChange(duration)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, inputType])

  // Update value when time range changes
  useEffect(() => {
    if (inputType === 'range' && startTime && endTime) {
      onChange(`${startTime} - ${endTime}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, endTime, inputType])

  const handleInputTypeChange = (type: 'duration' | 'range') => {
    setInputType(type)
    // Clear the other input
    if (type === 'duration') {
      setStartTime('')
      setEndTime('')
    } else {
      setDuration('')
    }
    onChange('')
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-bold text-gray-900 mb-3">
        시간 정보 입력
      </label>

      <div className="space-y-4">
        {/* Option 1: Duration */}
        <div className="border-2 border-gray-300 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <input
              type="radio"
              id="duration-option"
              name="time-input-type"
              checked={inputType === 'duration'}
              onChange={() => handleInputTypeChange('duration')}
              className="w-4 h-4 text-blue-600"
            />
            <label
              htmlFor="duration-option"
              className="ml-2 text-sm font-bold text-gray-900"
            >
              강의 시간 (몇 시간)
            </label>
          </div>
          {inputType === 'duration' && (
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
            >
              <option value="">시간 선택</option>
              {durationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Option 2: Time Range */}
        <div className="border-2 border-gray-300 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <input
              type="radio"
              id="range-option"
              name="time-input-type"
              checked={inputType === 'range'}
              onChange={() => handleInputTypeChange('range')}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="range-option" className="ml-2 text-sm font-bold text-gray-900">
              실제 강의 시간
            </label>
          </div>
          {inputType === 'range' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1">
                    시작 시간
                  </label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
                  >
                    <option value="">선택</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1">
                    종료 시간
                  </label>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
                  >
                    <option value="">선택</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 총 시간 표시 */}
              {totalDuration !== null && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-bold text-blue-900">
                    총 시간: {totalDuration.hours}시간
                    {totalDuration.minutes > 0 && ` ${totalDuration.minutes}분`}
                  </p>
                </div>
              )}

              {/* 종료 시간이 시작 시간보다 이르거나 같을 때 경고 */}
              {startTime && endTime && totalDuration === null && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-bold text-red-800">
                    종료 시간이 시작 시간보다 늦어야 합니다
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {!inputType && (
        <p className="text-sm font-semibold text-gray-900 mt-3">
          위 두 가지 중 하나를 선택해주세요
        </p>
      )}
    </div>
  )
}
