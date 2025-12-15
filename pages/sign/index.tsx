import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import CourseList from '@/components/CourseList'
import { getCoursesByInstructorId, getInstructorById } from '@/lib/instructors'
import { Course } from '@/types'

export default function SignPage() {
  const router = useRouter()
  const { instructorId } = router.query
  const [courses, setCourses] = useState<Course[]>([])
  const [instructorName, setInstructorName] = useState<string>('')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  useEffect(() => {
    if (typeof instructorId === 'string') {
      const instructor = getInstructorById(instructorId)
      const instructorCourses = getCoursesByInstructorId(instructorId)

      if (instructor) {
        setInstructorName(instructor.name)
        setCourses(instructorCourses)
      }
    }
  }, [instructorId])

  // One-Click Sign: 강의가 1개인 경우 자동으로 서명 페이지로 이동
  useEffect(() => {
    if (courses.length === 1 && typeof instructorId === 'string') {
      router.push(`/sign/${courses[0].id}?instructorId=${instructorId}`)
    }
  }, [courses, instructorId, router])

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course)
  }

  const handleNext = () => {
    if (selectedCourse) {
      router.push(`/sign/${selectedCourse.id}?instructorId=${instructorId}`)
    }
  }

  const handlePrevious = () => {
    router.push('/')
  }

  if (!instructorId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">강사 정보를 찾을 수 없습니다</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="강의 선택" />

      <main className="container mx-auto py-8">
        <CourseList
          courses={courses}
          instructorName={instructorName}
          selectedCourse={selectedCourse}
          onSelectCourse={handleCourseSelect}
        />

        {/* 하단 네비게이션 버튼 */}
        <div className="max-w-4xl mx-auto mt-6 flex justify-between gap-4 px-6">
          <button
            onClick={handlePrevious}
            className="min-h-[44px] px-8 py-3 bg-gray-200 text-gray-700 text-base font-semibold rounded-lg hover:bg-gray-300 transition-colors shadow-md flex items-center gap-2 touch-manipulation"
            aria-label="이전 단계로 돌아가기"
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
            onClick={handleNext}
            disabled={!selectedCourse}
            className="min-h-[44px] px-8 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md flex items-center gap-2 touch-manipulation focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-label="다음 단계로 진행하기"
          >
            <span>다음 단계로</span>
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
      </main>
    </div>
  )
}
