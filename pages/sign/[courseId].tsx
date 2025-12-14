import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import SignatureCanvas from '@/components/SignatureCanvas'
import TimeTextInput from '@/components/TimeTextInput'
import TimeRangeInput from '@/components/TimeRangeInput'
import ClassPeriodSelector from '@/components/ClassPeriodSelector'
import { getInstructorById, getCourseById } from '@/lib/instructors'
import { mockClassPeriods } from '@/data'
import { AttendanceType, Course } from '@/types'

export default function SignaturePage() {
  const router = useRouter()
  const { courseId, instructorId } = router.query
  const [instructorName, setInstructorName] = useState<string>('')
  const [course, setCourse] = useState<Course | null>(null)
  const [currentDate, setCurrentDate] = useState<string>('')

  // 유형별 입력 상태
  const [timeText, setTimeText] = useState<string>('') // 유형1
  const [startTime, setStartTime] = useState<string>('') // 유형2
  const [endTime, setEndTime] = useState<string>('') // 유형2
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null) // 유형3

  useEffect(() => {
    if (typeof instructorId === 'string' && typeof courseId === 'string') {
      const instructor = getInstructorById(instructorId)
      const courseData = getCourseById(courseId)

      if (instructor) setInstructorName(instructor.name)
      if (courseData) setCourse(courseData)

      // 현재 날짜 설정 (KST)
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      setCurrentDate(`${year}-${month}-${day}`)
    }
  }, [instructorId, courseId])

  const handleSave = (imageData: string) => {
    if (!course) return

    // 유형별 데이터 수집
    const signatureData: Record<string, unknown> = {
      instructorId,
      instructorName,
      courseId,
      courseName: course.name,
      imageData,
      date: currentDate,
      attendanceType: course.attendanceType,
    }

    // 유형별 추가 데이터
    if (course.attendanceType === 'daily-multiple') {
      signatureData.timeText = timeText
    } else if (course.attendanceType === 'time-range') {
      signatureData.startTime = startTime
      signatureData.endTime = endTime
    } else if (course.attendanceType === 'class-period') {
      signatureData.classPeriodId = selectedPeriodId
      const period = mockClassPeriods.find((p) => p.id === selectedPeriodId)
      signatureData.periodName = period?.name
    }

    console.log('서명 저장:', signatureData)

    // 임시: 저장 완료 메시지
    alert('서명이 저장되었습니다! (Phase 2에서 실제 저장 기능이 구현됩니다)')

    // 강의 선택 화면으로 돌아가기
    router.push(`/sign?instructorId=${instructorId}`)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="서명 입력" />

      <main className="container mx-auto py-8">
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
            date={currentDate}
            canSubmit={canSubmit()}
          />
        </div>
      </main>
    </div>
  )
}
