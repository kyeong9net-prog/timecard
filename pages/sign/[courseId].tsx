import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import SignatureCanvas from '@/components/SignatureCanvas'
import TimeTextInput from '@/components/TimeTextInput'
import TimeRangeInput from '@/components/TimeRangeInput'
import ClassPeriodSelector from '@/components/ClassPeriodSelector'
import { getInstructorById, getCourseById } from '@/lib/instructors'
import { mockClassPeriods } from '@/data'
import { Course, Signature, ActivatedDate } from '@/types'
import {
  getCurrentDateKST,
  getCurrentTimestampKST,
  isToday,
  formatDateKorean,
} from '@/lib/time-utils'
import {
  saveSignature,
  checkDuplicateSignature,
  getActivatedDatesByInstructor,
  isMonthLocked,
  getMonthFromDate,
} from '@/lib/storage-utils'

export default function SignaturePage() {
  const router = useRouter()
  const { courseId, instructorId } = router.query
  const [instructorName, setInstructorName] = useState<string>('')
  const [course, setCourse] = useState<Course | null>(null)
  const [currentDate, setCurrentDate] = useState<string>('')
  const [availableDates, setAvailableDates] = useState<
    Array<{ date: string; label: string; isActivated: boolean }>
  >([])
  const [selectedDate, setSelectedDate] = useState<string>('')

  // 유형별 입력 상태
  const [timeText, setTimeText] = useState<string>('') // 유형1
  const [startTime, setStartTime] = useState<string>('') // 유형2
  const [endTime, setEndTime] = useState<string>('') // 유형2
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null) // 유형3

  // UI 상태
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [showSuccess, setShowSuccess] = useState<boolean>(false)

  useEffect(() => {
    if (typeof instructorId === 'string' && typeof courseId === 'string') {
      const instructor = getInstructorById(instructorId)
      const courseData = getCourseById(courseId)

      if (instructor) setInstructorName(instructor.name)
      if (courseData) setCourse(courseData)

      // 현재 날짜 설정 (KST)
      const today = getCurrentDateKST()
      setCurrentDate(today)

      // 활성화된 날짜 가져오기
      const activatedDates = getActivatedDatesByInstructor(instructorId)
      const courseDates = activatedDates.filter((d) => d.courseId === courseId)

      // 사용 가능한 날짜 목록 생성 (오늘 + 활성화된 날짜들)
      const dates: Array<{
        date: string
        label: string
        isActivated: boolean
      }> = [
        {
          date: today,
          label: `오늘 (${formatDateKorean(today)})`,
          isActivated: false,
        },
      ]

      courseDates.forEach((ad) => {
        if (ad.date !== today) {
          dates.push({
            date: ad.date,
            label: `${formatDateKorean(ad.date)} (활성화됨)`,
            isActivated: true,
          })
        }
      })

      // 날짜순 정렬 (최신순)
      dates.sort((a, b) => b.date.localeCompare(a.date))

      setAvailableDates(dates)
      setSelectedDate(today) // 기본값은 오늘
    }
  }, [instructorId, courseId])

  const handleSave = async (imageData: string) => {
    if (!course || typeof instructorId !== 'string' || typeof courseId !== 'string')
      return

    // 에러 초기화
    setError('')
    setIsLoading(true)

    try {
      // 1. 비활성화된 강의 체크
      if (!course.isActive) {
        throw new Error(
          '비활성화된 강의입니다. 관리자에게 문의하세요.'
        )
      }

      // 2. 월 마감 체크
      const targetMonth = getMonthFromDate(selectedDate)
      if (isMonthLocked(targetMonth)) {
        throw new Error(
          `${targetMonth} 월은 이미 마감되었습니다. 서명을 추가할 수 없습니다.`
        )
      }

      // 3. 선택된 날짜가 유효한지 체크 (오늘이거나 활성화된 날짜여야 함)
      const today = getCurrentDateKST()
      const isActivatedDate = availableDates.find(
        (d) => d.date === selectedDate && d.isActivated
      )
      if (selectedDate !== today && !isActivatedDate) {
        throw new Error('오늘 또는 활성화된 날짜만 서명할 수 있습니다.')
      }

      // 4. 중복 서명 체크
      const additionalData: {
        timeText?: string
        startTime?: string
        endTime?: string
        classPeriodId?: string
      } = {}

      if (course.attendanceType === 'daily-multiple') {
        additionalData.timeText = timeText
      } else if (course.attendanceType === 'time-range') {
        additionalData.startTime = startTime
        additionalData.endTime = endTime
      } else if (course.attendanceType === 'class-period') {
        additionalData.classPeriodId = selectedPeriodId || undefined
      }

      const duplicate = checkDuplicateSignature(
        instructorId,
        courseId,
        selectedDate,
        course.attendanceType,
        additionalData
      )

      if (duplicate) {
        const timeInfo =
          duplicate.timestamp || duplicate.startTime || duplicate.timeText || ''
        throw new Error(
          `이미 서명하셨습니다. (${timeInfo ? `기존 서명: ${timeInfo}` : ''})`
        )
      }

      // 5. 서명 데이터 생성
      const signature: Signature = {
        id: `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        instructorId,
        instructorName,
        courseId,
        courseName: course.name,
        date: selectedDate,
        timestamp: getCurrentTimestampKST(),
        imageData,
        status: isActivatedDate ? 'activated' : 'normal',
      }

      // 유형별 추가 데이터
      if (course.attendanceType === 'daily-multiple') {
        signature.timeText = timeText
      } else if (course.attendanceType === 'time-range') {
        signature.startTime = startTime
        signature.endTime = endTime
      } else if (course.attendanceType === 'class-period') {
        signature.classPeriodId = selectedPeriodId || undefined
      }

      // 6. LocalStorage에 저장
      saveSignature(signature)

      // 7. 저장 완료 화면 표시
      setShowSuccess(true)
      setIsLoading(false)

      // 8. 3초 후 자동으로 강의 선택 화면으로 복귀
      setTimeout(() => {
        router.push(`/sign?instructorId=${instructorId}`)
      }, 3000)
    } catch (err) {
      setIsLoading(false)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('서명 저장 중 오류가 발생했습니다.')
      }
    }
  }

  // 제출 가능 여부 확인
  const canSubmit = () => {
    if (!course) return false

    if (course.attendanceType === 'daily-multiple') {
      return timeText.trim().length > 0
    } else if (course.attendanceType === 'time-range') {
      return Boolean(startTime && endTime && startTime < endTime)
    } else if (course.attendanceType === 'class-period') {
      return selectedPeriodId !== null
    }

    return false
  }

  if (!instructorId || !courseId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">정보를 찾을 수 없습니다</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    )
  }

  // 저장 완료 화면
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
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
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              서명이 완료되었습니다!
            </h2>
            <div className="mt-6 space-y-2 text-left bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">강사:</span> {instructorName}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">강의:</span> {course?.name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">날짜:</span> {selectedDate}
              </p>
            </div>
            <p className="mt-6 text-sm text-gray-500">3초 후 자동으로 돌아갑니다...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="서명 입력" />

      <main className="container mx-auto py-8">
        {/* 에러 메시지 */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-red-500 mt-0.5 mr-3"
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
                <div>
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 로딩 중 */}
        {isLoading && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg
                  className="animate-spin h-5 w-5 text-blue-500 mr-3"
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
                <p className="text-sm text-blue-800">서명을 저장하는 중...</p>
              </div>
            </div>
          </div>
        )}

        {/* 출근부 유형별 안내 */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              출근부 유형:{' '}
              <span className="font-semibold text-gray-800">
                {course.attendanceType === 'daily-multiple' && '일일 다회 출근부'}
                {course.attendanceType === 'time-range' && '시간대 기록 출근부'}
                {course.attendanceType === 'class-period' && '교시별 출근부'}
              </span>
            </p>
          </div>
        </div>

        {/* 날짜 선택 */}
        {availableDates.length > 0 && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                서명 날짜 선택
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableDates.map((dateOption) => (
                  <option key={dateOption.date} value={dateOption.date}>
                    {dateOption.label}
                  </option>
                ))}
              </select>
              {availableDates.find((d) => d.date === selectedDate)
                ?.isActivated && (
                <p className="mt-2 text-sm text-orange-600">
                  ⚠️ 이 날짜는 관리자가 활성화한 날짜입니다.
                </p>
              )}
            </div>
          </div>
        )}

        {/* 유형별 입력 UI */}
        <div className="max-w-4xl mx-auto">
          {course.attendanceType === 'daily-multiple' && (
            <TimeTextInput value={timeText} onChange={setTimeText} />
          )}

          {course.attendanceType === 'time-range' && (
            <TimeRangeInput
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
            />
          )}

          {course.attendanceType === 'class-period' && (
            <ClassPeriodSelector
              periods={mockClassPeriods}
              selectedPeriodId={selectedPeriodId}
              onSelect={setSelectedPeriodId}
            />
          )}

          {/* 서명 캔버스 */}
          <SignatureCanvas
            onSave={handleSave}
            instructorName={instructorName}
            courseName={course.name}
            date={selectedDate || currentDate}
            canSubmit={canSubmit() && !isLoading}
          />
        </div>
      </main>
    </div>
  )
}
