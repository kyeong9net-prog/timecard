import React from 'react'
import { Signature } from '@/types'
import { getCourseById } from '@/lib/instructors'
import { mockClassPeriods } from '@/data'

interface MonthlySignatureCalendarProps {
  yearMonth: string // Format: "YYYY-MM"
  signatures: Signature[]
}

export default function MonthlySignatureCalendar({
  yearMonth,
  signatures,
}: MonthlySignatureCalendarProps) {
  // 해당 월의 첫날과 마지막날 계산
  const [year, month] = yearMonth.split('-').map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()

  // 첫날의 요일 (0: 일요일, 1: 월요일, ...)
  const firstDayOfWeek = firstDay.getDay()

  // 달력에 표시할 날짜 배열 생성 (빈 날짜 포함)
  const calendarDays: (number | null)[] = []

  // 첫 주의 빈 칸 추가
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null)
  }

  // 실제 날짜 추가
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  // 날짜별 서명 그룹화
  const signaturesByDate = signatures.reduce((acc, sig) => {
    const date = sig.date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(sig)
    return acc
  }, {} as Record<string, Signature[]>)

  // 특정 날짜의 서명 가져오기
  const getSignaturesForDate = (day: number) => {
    const dateStr = `${yearMonth}-${day.toString().padStart(2, '0')}`
    return signaturesByDate[dateStr] || []
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {year}년 {month}월 서명 내역
      </h2>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <div
            key={day}
            className={`text-center text-sm font-bold py-2 ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }

          const daySigs = getSignaturesForDate(day)
          const hasSignature = daySigs.length > 0
          const dayOfWeek = index % 7

          return (
            <div
              key={day}
              className={`aspect-square border rounded-lg p-1 ${
                hasSignature
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-white border-gray-200'
              } hover:shadow-md transition-shadow`}
            >
              <div
                className={`text-sm font-semibold mb-1 ${
                  dayOfWeek === 0
                    ? 'text-red-600'
                    : dayOfWeek === 6
                    ? 'text-blue-600'
                    : 'text-gray-700'
                }`}
              >
                {day}
              </div>

              {/* 서명 표시 */}
              {hasSignature && (
                <div className="space-y-0.5">
                  {daySigs.slice(0, 3).map((sig, sigIndex) => {
                    const course = getCourseById(sig.courseId)
                    const period = sig.classPeriodId
                      ? mockClassPeriods.find((p) => p.id === sig.classPeriodId)
                      : null

                    return (
                      <div
                        key={`${sig.id}-${sigIndex}`}
                        className="bg-blue-500 text-white text-[10px] px-1 py-0.5 rounded truncate"
                        title={`${course?.name || '강의'} ${period ? `(${period.name})` : ''} ${sig.timeText || ''} ${sig.startTime || ''}`}
                      >
                        {course?.name?.substring(0, 4) || '강의'}
                        {period && ` ${period.name}`}
                      </div>
                    )
                  })}
                  {daySigs.length > 3 && (
                    <div className="text-[10px] text-blue-600 font-semibold">
                      +{daySigs.length - 3}개
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 통계 정보 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          총 서명 횟수: <span className="font-bold text-gray-900">{signatures.length}회</span>
        </p>
      </div>
    </div>
  )
}
