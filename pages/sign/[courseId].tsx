import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import SignatureCanvas from '@/components/SignatureCanvas'
import TimeTextInput from '@/components/TimeTextInput'
import ClassPeriodSelector from '@/components/ClassPeriodSelector'
import MonthlySignatureCalendar from '@/components/MonthlySignatureCalendar'
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
  getAllSignatures,
} from '@/lib/storage-utils'
import {
  saveOfflineSignature,
  getOfflineSignatureCount,
} from '@/lib/offline-storage-utils'
import { useOffline } from '@/contexts/OfflineContext'
import { ERROR_MESSAGES, formatErrorMessage } from '@/lib/error-messages'

export default function SignaturePage() {
  const router = useRouter()
  const { courseId, instructorId } = router.query
  const { isOffline } = useOffline()
  const [instructorName, setInstructorName] = useState<string>('')
  const [course, setCourse] = useState<Course | null>(null)
  const [currentDate, setCurrentDate] = useState<string>('')
  const [availableDates, setAvailableDates] = useState<
    Array<{ date: string; label: string; isActivated: boolean }>
  >([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [offlineCount, setOfflineCount] = useState<number>(0)
  const [signedPeriodIds, setSignedPeriodIds] = useState<string[]>([])
  const [signedPeriodError, setSignedPeriodError] = useState<string>('')

  // 유형별 입력 상태
  const [timeText, setTimeText] = useState<string>('') // 유형1
  const [startTime, setStartTime] = useState<string>('') // 유형2
  const [endTime, setEndTime] = useState<string>('') // 유형2
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null) // 유형3

  // UI 상태
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [showSuccess, setShowSuccess] = useState<boolean>(false)
  const [isOfflineSave, setIsOfflineSave] = useState<boolean>(false)

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

      // 오프라인 서명 개수 업데이트
      setOfflineCount(getOfflineSignatureCount())
    }
  }, [instructorId, courseId])

  // 선택된 날짜의 이미 서명한 교시 목록 업데이트
  useEffect(() => {
    if (
      typeof instructorId === 'string' &&
      typeof courseId === 'string' &&
      selectedDate &&
      course?.attendanceType === 'class-period'
    ) {
      const allSignatures = getAllSignatures()
      const signedPeriods = allSignatures
        .filter(
          (sig) =>
            sig.instructorId === instructorId &&
            sig.courseId === courseId &&
            sig.date === selectedDate &&
            sig.classPeriodId
        )
        .map((sig) => sig.classPeriodId as string)

      setSignedPeriodIds(signedPeriods)
    }
  }, [selectedDate, instructorId, courseId, course?.attendanceType])

  const handleSave = async (imageData: string) => {
    if (!course || typeof instructorId !== 'string' || typeof courseId !== 'string')
      return

    // 에러 초기화
    setError('')
    setIsLoading(true)

    try {
      // 1. 비활성화된 강의 체크
      if (!course.isActive) {
        throw new Error(formatErrorMessage(ERROR_MESSAGES.INACTIVE_COURSE))
      }

      // 2. 월 마감 체크
      const targetMonth = getMonthFromDate(selectedDate)
      if (isMonthLocked(targetMonth)) {
        throw new Error(formatErrorMessage(ERROR_MESSAGES.MONTH_LOCKED(targetMonth)))
      }

      // 3. 선택된 날짜가 유효한지 체크 (오늘이거나 활성화된 날짜여야 함)
      const today = getCurrentDateKST()
      const isActivatedDate = availableDates.find(
        (d) => d.date === selectedDate && d.isActivated
      )
      if (selectedDate !== today && !isActivatedDate) {
        throw new Error(formatErrorMessage(ERROR_MESSAGES.INVALID_DATE))
      }

      // 4. 중복 서명 체크
      const additionalData: {
        timeText?: string
        startTime?: string
        endTime?: string
        classPeriodId?: string
      } = {}

      if (course.attendanceType === 'daily-multiple' || course.attendanceType === 'time-range') {
        additionalData.timeText = timeText
        // timeText가 시간 범위 형식이면 startTime과 endTime도 설정
        if (timeText.includes(' - ')) {
          const [start, end] = timeText.split(' - ').map((t) => t.trim())
          additionalData.startTime = start
          additionalData.endTime = end
        }
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
          formatErrorMessage(ERROR_MESSAGES.DUPLICATE_SIGNATURE(timeInfo))
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
      if (course.attendanceType === 'daily-multiple' || course.attendanceType === 'time-range') {
        signature.timeText = timeText
        // timeText가 시간 범위 형식이면 startTime과 endTime도 설정
        if (timeText.includes(' - ')) {
          const [start, end] = timeText.split(' - ').map((t) => t.trim())
          signature.startTime = start
          signature.endTime = end
        }
      } else if (course.attendanceType === 'class-period') {
        signature.classPeriodId = selectedPeriodId || undefined
      }

      // 6. LocalStorage에 저장 (온라인/오프라인 구분)
      if (isOffline) {
        // 오프라인 모드: 임시 저장
        saveOfflineSignature(signature)
        setIsOfflineSave(true)
      } else {
        // 온라인 모드: 일반 저장
        saveSignature(signature)
        setIsOfflineSave(false)
      }

      // 7. 저장 완료 화면 표시
      setShowSuccess(true)
      setIsLoading(false)
    } catch (err) {
      setIsLoading(false)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(formatErrorMessage(ERROR_MESSAGES.SAVE_ERROR))
      }
    }
  }

  // 제출 가능 여부 확인
  const canSubmit = () => {
    if (!course) return false

    if (course.attendanceType === 'daily-multiple' || course.attendanceType === 'time-range') {
      return timeText.trim().length > 0
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
    // 현재 월의 모든 서명 가져오기
    const currentMonth = selectedDate ? selectedDate.substring(0, 7) : getCurrentDateKST().substring(0, 7)
    const allSignatures = getAllSignatures()
    const monthSignatures = allSignatures.filter(
      (sig) =>
        sig.instructorId === instructorId &&
        sig.date.startsWith(currentMonth)
    ).sort((a, b) => b.date.localeCompare(a.date) || b.timestamp.localeCompare(a.timestamp))

    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="서명 완료" />

        {/* 성공 토스트 알림 - 우측 상단 고정 */}
        <div className="fixed top-20 right-4 z-50">
          <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-fadeIn">
            <svg
              className="h-5 w-5"
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
            <span className="font-medium">
              {isOfflineSave ? '임시 저장 완료!' : '서명 완료!'}
            </span>
          </div>
        </div>

        <main className="container mx-auto py-8 px-4">
          <div className="max-w-4xl mx-auto">
            {/* 달력 형태의 월 서명 목록 */}
            <MonthlySignatureCalendar
              yearMonth={currentMonth}
              signatures={monthSignatures}
            />

            {/* 하단 네비게이션 버튼 */}
            <div className="mt-6 flex justify-between gap-4">
              <button
                onClick={() => router.push(`/sign/${courseId}?instructorId=${instructorId}`)}
                className="px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors shadow-md flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span>이전 단계로</span>
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2"
              >
                <span>완료</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="서명 입력" />

      <main className="container mx-auto py-8">
        {/* 오프라인 서명 대기 개수 표시 */}
        {offlineCount > 0 && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-orange-500 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-orange-800">
                  동기화 대기 중인 서명: <span className="font-semibold">{offlineCount}건</span>
                </p>
              </div>
            </div>
          </div>
        )}

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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
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
          {(course.attendanceType === 'daily-multiple' || course.attendanceType === 'time-range') && (
            <TimeTextInput value={timeText} onChange={setTimeText} />
          )}

          {course.attendanceType === 'class-period' && (
            <>
              {signedPeriodError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-red-800">{signedPeriodError}</p>
                </div>
              )}
              <ClassPeriodSelector
                periods={mockClassPeriods}
                selectedPeriodId={selectedPeriodId}
                onSelect={(periodId) => {
                  setSelectedPeriodId(periodId)
                  setSignedPeriodError('')
                }}
                signedPeriodIds={signedPeriodIds}
                onSignedPeriodClick={() =>
                  setSignedPeriodError(ERROR_MESSAGES.DUPLICATE_PERIOD.message)
                }
              />
            </>
          )}

          {/* 서명 캔버스 */}
          <SignatureCanvas
            key={selectedPeriodId || 'no-period'}
            onSave={handleSave}
            instructorName={instructorName}
            courseName={course.name}
            date={selectedDate || currentDate}
            canSubmit={canSubmit() && !isLoading}
            onReturnHome={() => router.push('/')}
          />
        </div>
      </main>
    </div>
  )
}
