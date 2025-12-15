import React, { useState } from 'react'
import { Signature } from '@/types'
import { getCourseById } from '@/lib/instructors'
import { mockClassPeriods } from '@/data'
import { formatDateKorean } from '@/lib/time-utils'

interface MonthlySignatureCalendarProps {
  yearMonth: string // Format: "YYYY-MM"
  signatures: Signature[]
}

export default function MonthlySignatureCalendar({
  yearMonth,
  signatures,
}: MonthlySignatureCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // 서명의 총 시간 계산 (분 단위로 반환)
  const calculateSignatureMinutes = (sig: Signature): number => {
    // 1. timeText에서 시간 추출 (예: "3시간")
    if (sig.timeText) {
      const match = sig.timeText.match(/(\d+)시간/)
      if (match) {
        return parseInt(match[1]) * 60
      }
    }

    // 2. startTime과 endTime에서 시간 계산
    if (sig.startTime && sig.endTime) {
      const [startHour, startMin] = sig.startTime.split(':').map(Number)
      const [endHour, endMin] = sig.endTime.split(':').map(Number)
      const startTotalMin = startHour * 60 + startMin
      const endTotalMin = endHour * 60 + endMin
      return Math.max(0, endTotalMin - startTotalMin)
    }

    // 3. classPeriodId에서 시간 계산
    if (sig.classPeriodId) {
      const period = mockClassPeriods.find((p) => p.id === sig.classPeriodId)
      if (period) {
        const [startHour, startMin] = period.startTime.split(':').map(Number)
        const [endHour, endMin] = period.endTime.split(':').map(Number)
        const startTotalMin = startHour * 60 + startMin
        const endTotalMin = endHour * 60 + endMin
        return Math.max(0, endTotalMin - startTotalMin)
      }
    }

    return 0
  }

  // 분을 "X시간 Y분" 형식으로 변환
  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0 && mins === 0) return ''
    if (mins === 0) return `${hours}시간`
    if (hours === 0) return `${mins}분`
    return `${hours}시간 ${mins}분`
  }

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

  // 특정 날짜의 총 시간 계산 (분 단위)
  const getDailyTotalMinutes = (day: number): number => {
    const daySigs = getSignaturesForDate(day)
    return daySigs.reduce((total, sig) => total + calculateSignatureMinutes(sig), 0)
  }

  // 월 전체 총 시간 계산 (분 단위)
  const monthlyTotalMinutes = signatures.reduce(
    (total, sig) => total + calculateSignatureMinutes(sig),
    0
  )

  // 선택된 날짜의 서명 정보
  const selectedDaySignatures = selectedDate ? signaturesByDate[selectedDate] || [] : []

  return (
    <>
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
        <div className="grid grid-cols-7 gap-1 mb-4">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }

            const daySigs = getSignaturesForDate(day)
            const hasSignature = daySigs.length > 0
            const dayOfWeek = index % 7
            const dailyMinutes = getDailyTotalMinutes(day)
            const dateStr = `${yearMonth}-${day.toString().padStart(2, '0')}`

            return (
              <div
                key={day}
                onClick={() => hasSignature && setSelectedDate(dateStr)}
                className={`aspect-square border rounded-lg p-1 ${
                  hasSignature
                    ? 'bg-blue-50 border-blue-300 cursor-pointer hover:bg-blue-100'
                    : 'bg-white border-gray-200'
                } transition-all`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div
                    className={`text-sm font-semibold ${
                      dayOfWeek === 0
                        ? 'text-red-600'
                        : dayOfWeek === 6
                        ? 'text-blue-600'
                        : 'text-gray-700'
                    }`}
                  >
                    {day}
                  </div>
                  {hasSignature && (
                    <div className="text-[11px] font-bold text-blue-700">
                      {formatMinutes(dailyMinutes)}
                    </div>
                  )}
                </div>

                {/* 서명 표시 */}
                {hasSignature && (
                  <div className="space-y-0.5">
                    {daySigs.slice(0, 2).map((sig, sigIndex) => {
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
                    {daySigs.length > 2 && (
                      <div className="text-[10px] text-blue-600 font-semibold">
                        +{daySigs.length - 2}개
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 월별 총계 */}
        <div className="mt-4 pt-4 border-t-2 border-gray-300 bg-blue-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
          <div className="flex justify-between items-center">
            <p className="text-lg font-bold text-gray-900">월 총 시간</p>
            <p className="text-2xl font-bold text-blue-700">
              {formatMinutes(monthlyTotalMinutes)}
            </p>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            총 서명 횟수: <span className="font-bold text-gray-900">{signatures.length}회</span>
          </p>
        </div>
      </div>

      {/* 날짜별 상세 팝업 */}
      {selectedDate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {formatDateKorean(selectedDate)}
                  </h3>
                  <p className="text-lg font-semibold text-blue-700 mt-1">
                    총 {formatMinutes(selectedDaySignatures.reduce((sum, sig) => sum + calculateSignatureMinutes(sig), 0))}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {selectedDaySignatures.map((sig, index) => {
                const course = getCourseById(sig.courseId)
                const period = sig.classPeriodId
                  ? mockClassPeriods.find((p) => p.id === sig.classPeriodId)
                  : null
                const sigMinutes = calculateSignatureMinutes(sig)

                return (
                  <div
                    key={`${sig.id}-${index}`}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">
                          {course?.name || '알 수 없는 강의'}
                        </h4>
                        <p className="text-sm text-gray-600">{course?.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-700">
                          {formatMinutes(sigMinutes)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {period && (
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="font-semibold min-w-[80px]">교시:</span>
                          <span>{period.name} ({period.startTime} - {period.endTime})</span>
                        </div>
                      )}
                      {sig.timeText && (
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="font-semibold min-w-[80px]">시간:</span>
                          <span>{sig.timeText}</span>
                        </div>
                      )}
                      {sig.startTime && sig.endTime && (
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="font-semibold min-w-[80px]">시간:</span>
                          <span>{sig.startTime} - {sig.endTime}</span>
                        </div>
                      )}
                      {sig.timestamp && (
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="font-semibold min-w-[80px]">서명 시각:</span>
                          <span>{sig.timestamp}</span>
                        </div>
                      )}
                      {sig.syncStatus === 'pending' && (
                        <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                          오프라인 저장
                        </div>
                      )}
                    </div>

                    {sig.imageData && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">서명:</p>
                        <img
                          src={sig.imageData}
                          alt="서명"
                          className="w-full h-24 object-contain border border-gray-300 rounded bg-gray-50"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
