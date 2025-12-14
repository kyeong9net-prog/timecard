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

  const handleCourseSelect = (course: Course) => {
    router.push(`/sign/${course.id}?instructorId=${instructorId}`)
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
          onSelectCourse={handleCourseSelect}
        />
      </main>
    </div>
  )
}
