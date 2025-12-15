import React from 'react'
import { Course } from '@/types'

interface CourseListProps {
  courses: Course[]
  instructorName: string
  selectedCourse: Course | null
  onSelectCourse: (course: Course) => void
}

export default function CourseList({
  courses,
  instructorName,
  selectedCourse,
  onSelectCourse,
}: CourseListProps) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {instructorName} 강사님의 강의 목록
        </h2>
        <p className="text-gray-600">서명할 강의를 선택해주세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course) => {
          const isSelected = selectedCourse?.id === course.id
          return (
            <button
              key={course.id}
              onClick={() => onSelectCourse(course)}
              className={`min-h-[88px] bg-white border-2 rounded-lg p-6 hover:shadow-lg transition-all duration-200 text-left relative touch-manipulation focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-300 hover:border-blue-500'
              }`}
              aria-label={`${course.name} 강의 선택`}
              aria-pressed={isSelected}
            >
              <div className="text-lg font-semibold text-gray-800 mb-2">
                {course.name}
              </div>
              <div className="text-base text-gray-600">{course.code}</div>
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {courses.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          배정된 강의가 없습니다
        </div>
      )}
    </div>
  )
}
