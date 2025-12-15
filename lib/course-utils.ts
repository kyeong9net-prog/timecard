/**
 * 강의 관리 유틸리티 함수 (Phase 9)
 * LocalStorage를 사용한 강의 데이터 CRUD 기능
 */

import { Course, AttendanceType } from '@/types'
import { logDataChange } from './data-log-utils'

const COURSES_KEY = 'courses'

/**
 * 모든 강의 목록 조회
 */
export function getAllCourses(): Course[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(COURSES_KEY)
  return data ? JSON.parse(data) : []
}

/**
 * ID로 강의 조회
 */
export function getCourseById(id: string): Course | null {
  const courses = getAllCourses()
  return courses.find((c) => c.id === id) || null
}

/**
 * 강의명 중복 체크
 */
export function isDuplicateCourseName(name: string, excludeId?: string): boolean {
  const courses = getAllCourses()
  return courses.some((c) => c.name === name && c.id !== excludeId)
}

/**
 * 강의 코드 중복 체크
 */
export function isDuplicateCourseCode(code: string, excludeId?: string): boolean {
  const courses = getAllCourses()
  return courses.some((c) => c.code === code && c.id !== excludeId)
}

/**
 * 새 강의 생성
 */
export function createCourse(
  name: string,
  code: string,
  attendanceType: AttendanceType,
  adminId: string,
  adminName: string
): Course {
  // 중복 체크
  if (isDuplicateCourseName(name)) {
    throw new Error('이미 존재하는 강의명입니다.')
  }

  if (isDuplicateCourseCode(code)) {
    throw new Error('이미 존재하는 강의 코드입니다.')
  }

  const courses = getAllCourses()
  const newCourse: Course = {
    id: `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: name.trim(),
    code: code.trim(),
    attendanceType,
    isActive: true,
  }

  courses.push(newCourse)
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses))

  // 변경 이력 로그
  logDataChange({
    adminId,
    adminName,
    actionType: 'create_course',
    targetType: 'course',
    targetId: newCourse.id,
    targetName: newCourse.name,
    afterValue: newCourse,
  })

  return newCourse
}

/**
 * 강의 정보 수정
 */
export function updateCourse(
  id: string,
  name: string,
  code: string,
  attendanceType: AttendanceType,
  adminId: string,
  adminName: string
): Course {
  const courses = getAllCourses()
  const index = courses.findIndex((c) => c.id === id)

  if (index === -1) {
    throw new Error('강의를 찾을 수 없습니다.')
  }

  // 중복 체크 (본인 제외)
  if (isDuplicateCourseName(name, id)) {
    throw new Error('이미 존재하는 강의명입니다.')
  }

  if (isDuplicateCourseCode(code, id)) {
    throw new Error('이미 존재하는 강의 코드입니다.')
  }

  const beforeValue = { ...courses[index] }
  courses[index].name = name.trim()
  courses[index].code = code.trim()
  courses[index].attendanceType = attendanceType
  const afterValue = { ...courses[index] }

  localStorage.setItem(COURSES_KEY, JSON.stringify(courses))

  // 변경 이력 로그
  logDataChange({
    adminId,
    adminName,
    actionType: 'update_course',
    targetType: 'course',
    targetId: id,
    targetName: afterValue.name,
    beforeValue,
    afterValue,
  })

  return courses[index]
}

/**
 * 강의 비활성화
 */
export function deactivateCourse(
  id: string,
  adminId: string,
  adminName: string
): Course {
  const courses = getAllCourses()
  const index = courses.findIndex((c) => c.id === id)

  if (index === -1) {
    throw new Error('강의를 찾을 수 없습니다.')
  }

  if (!courses[index].isActive) {
    throw new Error('이미 비활성화된 강의입니다.')
  }

  const beforeValue = { ...courses[index] }
  courses[index].isActive = false
  const afterValue = { ...courses[index] }

  localStorage.setItem(COURSES_KEY, JSON.stringify(courses))

  // 변경 이력 로그
  logDataChange({
    adminId,
    adminName,
    actionType: 'deactivate_course',
    targetType: 'course',
    targetId: id,
    targetName: afterValue.name,
    beforeValue,
    afterValue,
  })

  return courses[index]
}

/**
 * 강의 검색
 */
export function searchCourses(query: string): Course[] {
  const courses = getAllCourses()
  const lowerQuery = query.toLowerCase().trim()

  if (!lowerQuery) return courses

  return courses.filter(
    (c) =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.code.toLowerCase().includes(lowerQuery)
  )
}

/**
 * 활성 상태로 필터링
 */
export function filterCoursesByStatus(
  status: 'all' | 'active' | 'inactive'
): Course[] {
  const courses = getAllCourses()

  if (status === 'all') return courses
  if (status === 'active') return courses.filter((c) => c.isActive)
  return courses.filter((c) => !c.isActive)
}
