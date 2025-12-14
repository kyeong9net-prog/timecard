// 강사 타입
export interface Instructor {
  id: string
  name: string
  isActive: boolean
}

// 강의 타입
export interface Course {
  id: string
  name: string
  code: string
  isActive: boolean
}

// 강사-강의 매핑 타입
export interface InstructorCourseMapping {
  instructorId: string
  courseIds: string[]
}

// 서명 상태 타입
export type SignatureStatus = 'normal' | 'activated' | 'invalidated'

// 서명 타입
export interface Signature {
  id: string
  instructorId: string
  instructorName: string
  courseId: string
  courseName: string
  date: string // YYYY-MM-DD format
  timestamp: string // ISO 8601 format
  imageData: string // SVG string
  status: SignatureStatus
}
