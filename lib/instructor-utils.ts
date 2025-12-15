/**
 * 강사 관리 유틸리티 함수 (Phase 9)
 * LocalStorage를 사용한 강사 데이터 CRUD 기능
 */

import { Instructor, InstructorCourseMapping } from '@/types'
import { getCurrentTimestampKST } from './time-utils'
import { logDataChange } from './data-log-utils'

const INSTRUCTORS_KEY = 'instructors'
const MAPPINGS_KEY = 'instructor-course-mappings'

/**
 * 모든 강사 목록 조회
 */
export function getAllInstructors(): Instructor[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(INSTRUCTORS_KEY)
  return data ? JSON.parse(data) : []
}

/**
 * ID로 강사 조회
 */
export function getInstructorById(id: string): Instructor | null {
  const instructors = getAllInstructors()
  return instructors.find((i) => i.id === id) || null
}

/**
 * 강사명 중복 체크
 */
export function isDuplicateInstructorName(name: string, excludeId?: string): boolean {
  const instructors = getAllInstructors()
  return instructors.some((i) => i.name === name && i.id !== excludeId)
}

/**
 * 새 강사 생성
 */
export function createInstructor(
  name: string,
  adminId: string,
  adminName: string
): Instructor {
  // 중복 체크
  if (isDuplicateInstructorName(name)) {
    throw new Error('이미 존재하는 강사명입니다.')
  }

  const instructors = getAllInstructors()
  const newInstructor: Instructor = {
    id: `instructor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: name.trim(),
    isActive: true,
  }

  instructors.push(newInstructor)
  localStorage.setItem(INSTRUCTORS_KEY, JSON.stringify(instructors))

  // 변경 이력 로그
  logDataChange({
    adminId,
    adminName,
    actionType: 'create_instructor',
    targetType: 'instructor',
    targetId: newInstructor.id,
    targetName: newInstructor.name,
    afterValue: newInstructor,
  })

  // 빈 매핑 생성
  const mappings = getAllMappings()
  mappings.push({
    instructorId: newInstructor.id,
    courseIds: [],
  })
  localStorage.setItem(MAPPINGS_KEY, JSON.stringify(mappings))

  return newInstructor
}

/**
 * 강사 정보 수정
 */
export function updateInstructor(
  id: string,
  name: string,
  adminId: string,
  adminName: string
): Instructor {
  const instructors = getAllInstructors()
  const index = instructors.findIndex((i) => i.id === id)

  if (index === -1) {
    throw new Error('강사를 찾을 수 없습니다.')
  }

  // 중복 체크 (본인 제외)
  if (isDuplicateInstructorName(name, id)) {
    throw new Error('이미 존재하는 강사명입니다.')
  }

  const beforeValue = { ...instructors[index] }
  instructors[index].name = name.trim()
  const afterValue = { ...instructors[index] }

  localStorage.setItem(INSTRUCTORS_KEY, JSON.stringify(instructors))

  // 변경 이력 로그
  logDataChange({
    adminId,
    adminName,
    actionType: 'update_instructor',
    targetType: 'instructor',
    targetId: id,
    targetName: afterValue.name,
    beforeValue,
    afterValue,
  })

  return instructors[index]
}

/**
 * 강사 비활성화
 */
export function deactivateInstructor(
  id: string,
  adminId: string,
  adminName: string
): Instructor {
  const instructors = getAllInstructors()
  const index = instructors.findIndex((i) => i.id === id)

  if (index === -1) {
    throw new Error('강사를 찾을 수 없습니다.')
  }

  if (!instructors[index].isActive) {
    throw new Error('이미 비활성화된 강사입니다.')
  }

  const beforeValue = { ...instructors[index] }
  instructors[index].isActive = false
  const afterValue = { ...instructors[index] }

  localStorage.setItem(INSTRUCTORS_KEY, JSON.stringify(instructors))

  // 변경 이력 로그
  logDataChange({
    adminId,
    adminName,
    actionType: 'deactivate_instructor',
    targetType: 'instructor',
    targetId: id,
    targetName: afterValue.name,
    beforeValue,
    afterValue,
  })

  return instructors[index]
}

/**
 * 강사 검색
 */
export function searchInstructors(query: string): Instructor[] {
  const instructors = getAllInstructors()
  const lowerQuery = query.toLowerCase().trim()

  if (!lowerQuery) return instructors

  return instructors.filter((i) => i.name.toLowerCase().includes(lowerQuery))
}

/**
 * 활성 상태로 필터링
 */
export function filterInstructorsByStatus(
  status: 'all' | 'active' | 'inactive'
): Instructor[] {
  const instructors = getAllInstructors()

  if (status === 'all') return instructors
  if (status === 'active') return instructors.filter((i) => i.isActive)
  return instructors.filter((i) => !i.isActive)
}

/**
 * 모든 강사-강의 매핑 조회
 */
export function getAllMappings(): InstructorCourseMapping[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(MAPPINGS_KEY)
  return data ? JSON.parse(data) : []
}

/**
 * 특정 강사의 강의 ID 목록 조회
 */
export function getInstructorCourseIds(instructorId: string): string[] {
  const mappings = getAllMappings()
  const mapping = mappings.find((m) => m.instructorId === instructorId)
  return mapping?.courseIds || []
}

/**
 * 강사에게 강의 추가
 */
export function addCourseToInstructor(
  instructorId: string,
  courseId: string,
  adminId: string,
  adminName: string
): void {
  const mappings = getAllMappings()
  const index = mappings.findIndex((m) => m.instructorId === instructorId)

  if (index === -1) {
    throw new Error('강사를 찾을 수 없습니다.')
  }

  if (mappings[index].courseIds.includes(courseId)) {
    throw new Error('이미 배정된 강의입니다.')
  }

  const beforeValue = { courseIds: [...mappings[index].courseIds] }
  mappings[index].courseIds.push(courseId)
  const afterValue = { courseIds: [...mappings[index].courseIds] }

  localStorage.setItem(MAPPINGS_KEY, JSON.stringify(mappings))

  const instructor = getInstructorById(instructorId)

  // 변경 이력 로그
  logDataChange({
    adminId,
    adminName,
    actionType: 'add_course_mapping',
    targetType: 'mapping',
    targetId: instructorId,
    targetName: instructor?.name || '알 수 없음',
    beforeValue,
    afterValue,
  })
}

/**
 * 강사에게서 강의 제거
 */
export function removeCourseFromInstructor(
  instructorId: string,
  courseId: string,
  adminId: string,
  adminName: string
): void {
  const mappings = getAllMappings()
  const index = mappings.findIndex((m) => m.instructorId === instructorId)

  if (index === -1) {
    throw new Error('강사를 찾을 수 없습니다.')
  }

  const beforeValue = { courseIds: [...mappings[index].courseIds] }
  mappings[index].courseIds = mappings[index].courseIds.filter((id) => id !== courseId)
  const afterValue = { courseIds: [...mappings[index].courseIds] }

  localStorage.setItem(MAPPINGS_KEY, JSON.stringify(mappings))

  const instructor = getInstructorById(instructorId)

  // 변경 이력 로그
  logDataChange({
    adminId,
    adminName,
    actionType: 'remove_course_mapping',
    targetType: 'mapping',
    targetId: instructorId,
    targetName: instructor?.name || '알 수 없음',
    beforeValue,
    afterValue,
  })
}
