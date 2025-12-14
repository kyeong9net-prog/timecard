import { mockInstructors, mockCourses, mockInstructorCourseMappings } from '@/data'
import { Course } from '@/types'

// 강사 ID로 해당 강사의 강의 목록 가져오기
export function getCoursesByInstructorId(instructorId: string): Course[] {
  const mapping = mockInstructorCourseMappings.find(
    (m) => m.instructorId === instructorId
  )

  if (!mapping) {
    return []
  }

  return mockCourses.filter(
    (course) => mapping.courseIds.includes(course.id) && course.isActive
  )
}

// 모든 활성 강사 가져오기
export function getActiveInstructors() {
  return mockInstructors.filter((instructor) => instructor.isActive)
}

// 강사 ID로 강사 정보 가져오기
export function getInstructorById(instructorId: string) {
  return mockInstructors.find((instructor) => instructor.id === instructorId)
}

// 강의 ID로 강의 정보 가져오기
export function getCourseById(courseId: string) {
  return mockCourses.find((course) => course.id === courseId)
}
