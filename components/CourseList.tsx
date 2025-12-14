import React from 'react'
import { Course } from '@/types'

interface CourseListProps {
  courses: Course[]
  instructorName: string
  onSelectCourse: (course: Course) => void
}

export default function CourseList({
  courses,
  instructorName,
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
        {courses.map((course) => (
          <button
            key={course.id}
            onClick={() => onSelectCourse(course)}
            className="bg-white border-2 border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="text-lg font-semibold text-gray-800 mb-2">
              {course.name}
            </div>
            <div className="text-sm text-gray-600">{course.code}</div>
          </button>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          배정된 강의가 없습니다
        </div>
      )}
    </div>
  )
}
